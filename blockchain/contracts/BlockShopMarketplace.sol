// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title BlockShop Marketplace — Decentralized E-Commerce on Ethereum
/// @author BlockShop Team
/// @notice Full-featured marketplace with escrow, disputes, reviews, and seller profiles
contract BlockShopMarketplace is Ownable, ReentrancyGuard, Pausable {

    // ─────────────────────────────────────────────────
    //  STRUCTS
    // ─────────────────────────────────────────────────
    struct Product {
        uint256 id;
        address payable seller;
        string name;
        string description;
        string imageURI;
        string category;
        uint256 priceWei;
        uint256 stock;
        uint256 sold;
        bool isActive;
        uint256 createdAt;
        uint256 totalRating;
        uint256 ratingCount;
    }

    struct Order {
        uint256 id;
        uint256 productId;
        address payable buyer;
        address payable seller;
        uint256 quantity;
        uint256 totalPaid;
        OrderStatus status;
        uint256 createdAt;
        uint256 deliveredAt;
        string shippingInfo;
        bool disputed;
    }

    struct Review {
        address reviewer;
        uint256 productId;
        uint8 rating;
        string comment;
        uint256 timestamp;
    }

    struct SellerProfile {
        address sellerAddress;
        string name;
        string bio;
        uint256 totalSales;
        uint256 totalRevenue;
        uint256 joinedAt;
        bool isVerified;
    }

    // ─────────────────────────────────────────────────
    //  ENUMS
    // ─────────────────────────────────────────────────
    enum OrderStatus {
        Pending,     // 0 - ETH in escrow
        Processing,  // 1 - Seller acknowledged
        Shipped,     // 2 - Seller shipped
        Delivered,   // 3 - Buyer confirmed
        Completed,   // 4 - Funds released
        Cancelled,   // 5 - Cancelled + refunded
        Disputed,    // 6 - Under dispute
        Refunded     // 7 - Admin refunded buyer
    }

    // ─────────────────────────────────────────────────
    //  STATE VARIABLES
    // ─────────────────────────────────────────────────
    uint256 public productCount;
    uint256 public orderCount;
    uint256 public platformFeePercent = 250;  // 2.5% in basis points
    uint256 public escrowDuration     = 7 days;
    address payable public feeWallet;

    mapping(uint256 => Product)                    public products;
    mapping(uint256 => Order)                      public orders;
    mapping(uint256 => Review[])                   public productReviews;
    mapping(address => SellerProfile)              public sellerProfiles;
    mapping(address => uint256[])                  public sellerProducts;
    mapping(address => uint256[])                  public buyerOrders;
    mapping(address => uint256[])                  public sellerOrders;
    mapping(address => mapping(uint256 => bool))   public hasReviewed;
    mapping(address => uint256)                    public pendingWithdrawals;

    // ─────────────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────────────
    event ProductListed(uint256 indexed productId, address indexed seller, string name, uint256 priceWei);
    event ProductUpdated(uint256 indexed productId, uint256 newPrice, uint256 newStock);
    event OrderPlaced(uint256 indexed orderId, uint256 indexed productId, address indexed buyer, uint256 quantity, uint256 totalPaid);
    event OrderStatusChanged(uint256 indexed orderId, OrderStatus oldStatus, OrderStatus newStatus);
    event FundsReleased(uint256 indexed orderId, address indexed seller, uint256 amount);
    event RefundIssued(uint256 indexed orderId, address indexed buyer, uint256 amount);
    event ReviewSubmitted(uint256 indexed productId, address indexed reviewer, uint8 rating);
    event DisputeRaised(uint256 indexed orderId, address indexed raisedBy);
    event DisputeResolved(uint256 indexed orderId, bool buyerFavored);
    event SellerRegistered(address indexed seller, string name);
    event SellerVerified(address indexed seller);
    event Withdrawal(address indexed account, uint256 amount);

    // ─────────────────────────────────────────────────
    //  MODIFIERS
    // ─────────────────────────────────────────────────
    modifier onlySeller(uint256 _id) { require(orders[_id].seller == msg.sender, "Not seller"); _; }
    modifier onlyBuyer(uint256 _id)  { require(orders[_id].buyer  == msg.sender, "Not buyer");  _; }
    modifier productExists(uint256 _id) { require(_id > 0 && _id <= productCount, "No product"); _; }
    modifier orderExists(uint256 _id)   { require(_id > 0 && _id <= orderCount,   "No order");   _; }

    // ─────────────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────────────
    constructor(address payable _feeWallet) Ownable(msg.sender) {
        feeWallet = _feeWallet;
    }

    // ─────────────────────────────────────────────────
    //  SELLER ACTIONS
    // ─────────────────────────────────────────────────
    function registerSeller(string calldata _name, string calldata _bio) external {
        require(bytes(_name).length > 0, "Name required");
        require(sellerProfiles[msg.sender].joinedAt == 0, "Already registered");
        sellerProfiles[msg.sender] = SellerProfile(msg.sender, _name, _bio, 0, 0, block.timestamp, false);
        emit SellerRegistered(msg.sender, _name);
    }

    function listProduct(
        string calldata _name, string calldata _desc,
        string calldata _img,  string calldata _cat,
        uint256 _price, uint256 _stock
    ) external whenNotPaused returns (uint256) {
        require(bytes(_name).length > 0 && _price > 0 && _stock > 0, "Invalid params");
        require(sellerProfiles[msg.sender].joinedAt > 0, "Register as seller first");
        productCount++;
        products[productCount] = Product({
            id: productCount, seller: payable(msg.sender),
            name: _name, description: _desc, imageURI: _img, category: _cat,
            priceWei: _price, stock: _stock, sold: 0,
            isActive: true, createdAt: block.timestamp, totalRating: 0, ratingCount: 0
        });
        sellerProducts[msg.sender].push(productCount);
        emit ProductListed(productCount, msg.sender, _name, _price);
        return productCount;
    }

    function updateProduct(uint256 _id, uint256 _price, uint256 _stock, bool _active)
        external productExists(_id)
    {
        require(products[_id].seller == msg.sender, "Not your product");
        products[_id].priceWei = _price;
        products[_id].stock    = _stock;
        products[_id].isActive = _active;
        emit ProductUpdated(_id, _price, _stock);
    }

    function confirmOrder(uint256 _id) external orderExists(_id) onlySeller(_id) {
        require(orders[_id].status == OrderStatus.Pending, "Not pending");
        emit OrderStatusChanged(_id, orders[_id].status, OrderStatus.Processing);
        orders[_id].status = OrderStatus.Processing;
    }

    function markShipped(uint256 _id, string calldata _tracking) external orderExists(_id) onlySeller(_id) {
        require(orders[_id].status == OrderStatus.Processing, "Not processing");
        orders[_id].status      = OrderStatus.Shipped;
        orders[_id].shippingInfo = _tracking;
        emit OrderStatusChanged(_id, OrderStatus.Processing, OrderStatus.Shipped);
    }

    function withdrawFunds() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        pendingWithdrawals[msg.sender] = 0;
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");
        emit Withdrawal(msg.sender, amount);
    }

    // ─────────────────────────────────────────────────
    //  BUYER ACTIONS
    // ─────────────────────────────────────────────────
    function placeOrder(
        uint256 _productId, uint256 _qty, string calldata _shipping
    ) external payable whenNotPaused nonReentrant productExists(_productId) returns (uint256) {
        Product storage p = products[_productId];
        require(p.isActive,          "Not active");
        require(p.stock >= _qty,     "Low stock");
        require(_qty > 0,            "Bad qty");
        require(p.seller != msg.sender, "Own product");
        uint256 cost = p.priceWei * _qty;
        require(msg.value >= cost,   "Insufficient ETH");

        p.stock -= _qty;
        p.sold  += _qty;
        orderCount++;

        orders[orderCount] = Order({
            id: orderCount, productId: _productId,
            buyer: payable(msg.sender), seller: p.seller,
            quantity: _qty, totalPaid: cost, status: OrderStatus.Pending,
            createdAt: block.timestamp, deliveredAt: 0,
            shippingInfo: _shipping, disputed: false
        });
        buyerOrders[msg.sender].push(orderCount);
        sellerOrders[p.seller].push(orderCount);

        // Refund excess
        if (msg.value > cost) {
            (bool ok,) = payable(msg.sender).call{value: msg.value - cost}("");
            require(ok, "Refund failed");
        }
        emit OrderPlaced(orderCount, _productId, msg.sender, _qty, cost);
        return orderCount;
    }

    function confirmDelivery(uint256 _id)
        external orderExists(_id) onlyBuyer(_id) nonReentrant
    {
        Order storage o = orders[_id];
        require(o.status == OrderStatus.Shipped || o.status == OrderStatus.Processing, "Wrong state");
        require(!o.disputed, "Disputed");
        o.status      = OrderStatus.Delivered;
        o.deliveredAt = block.timestamp;
        _releaseFunds(_id);
    }

    function cancelOrder(uint256 _id)
        external orderExists(_id) onlyBuyer(_id) nonReentrant
    {
        Order storage o = orders[_id];
        require(o.status == OrderStatus.Pending, "Only pending");
        o.status = OrderStatus.Cancelled;
        products[o.productId].stock += o.quantity;
        products[o.productId].sold  -= o.quantity;
        uint256 refund = o.totalPaid;
        o.totalPaid = 0;
        (bool ok,) = o.buyer.call{value: refund}("");
        require(ok, "Refund failed");
        emit RefundIssued(_id, o.buyer, refund);
        emit OrderStatusChanged(_id, OrderStatus.Pending, OrderStatus.Cancelled);
    }

    function raiseDispute(uint256 _id)
        external orderExists(_id) onlyBuyer(_id)
    {
        Order storage o = orders[_id];
        require(o.status == OrderStatus.Shipped || o.status == OrderStatus.Processing, "Wrong state");
        require(!o.disputed, "Already disputed");
        o.disputed = true;
        o.status   = OrderStatus.Disputed;
        emit DisputeRaised(_id, msg.sender);
    }

    function submitReview(uint256 _productId, uint8 _rating, string calldata _comment)
        external productExists(_productId)
    {
        require(_rating >= 1 && _rating <= 5, "Rating 1-5");
        require(!hasReviewed[msg.sender][_productId], "Already reviewed");
        bool purchased = false;
        uint256[] storage bOrders = buyerOrders[msg.sender];
        for (uint256 i = 0; i < bOrders.length; i++) {
            Order storage o = orders[bOrders[i]];
            if (o.productId == _productId && o.status == OrderStatus.Completed) {
                purchased = true; break;
            }
        }
        require(purchased, "Must purchase first");
        hasReviewed[msg.sender][_productId] = true;
        productReviews[_productId].push(Review(msg.sender, _productId, _rating, _comment, block.timestamp));
        products[_productId].totalRating += _rating;
        products[_productId].ratingCount++;
        emit ReviewSubmitted(_productId, msg.sender, _rating);
    }

    // Time-based escrow auto-release
    function autoReleaseEscrow(uint256 _id) external orderExists(_id) nonReentrant {
        Order storage o = orders[_id];
        require(o.status == OrderStatus.Shipped, "Must be shipped");
        require(block.timestamp >= o.createdAt + escrowDuration, "Too early");
        require(!o.disputed, "Disputed");
        _releaseFunds(_id);
    }

    // ─────────────────────────────────────────────────
    //  ADMIN ACTIONS
    // ─────────────────────────────────────────────────
    function resolveDispute(uint256 _id, bool _favorBuyer)
        external onlyOwner orderExists(_id) nonReentrant
    {
        require(orders[_id].status == OrderStatus.Disputed, "Not disputed");
        if (_favorBuyer) {
            orders[_id].status = OrderStatus.Refunded;
            products[orders[_id].productId].stock += orders[_id].quantity;
            uint256 refund = orders[_id].totalPaid;
            orders[_id].totalPaid = 0;
            (bool ok,) = orders[_id].buyer.call{value: refund}("");
            require(ok, "Refund failed");
            emit RefundIssued(_id, orders[_id].buyer, refund);
        } else {
            _releaseFunds(_id);
        }
        emit DisputeResolved(_id, _favorBuyer);
    }

    function verifySeller(address _seller) external onlyOwner {
        require(sellerProfiles[_seller].joinedAt > 0, "Not registered");
        sellerProfiles[_seller].isVerified = true;
        emit SellerVerified(_seller);
    }

    function updateFee(uint256 _bps) external onlyOwner {
        require(_bps <= 1000, "Max 10%");
        platformFeePercent = _bps;
    }
    function updateFeeWallet(address payable _w) external onlyOwner { require(_w != address(0)); feeWallet = _w; }
    function updateEscrowDays(uint256 _days)     external onlyOwner { escrowDuration = _days * 1 days; }
    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ─────────────────────────────────────────────────
    //  INTERNAL
    // ─────────────────────────────────────────────────
    function _releaseFunds(uint256 _id) internal {
        Order storage o = orders[_id];
        o.status = OrderStatus.Completed;
        uint256 fee        = (o.totalPaid * platformFeePercent) / 10000;
        uint256 sellerAmt  = o.totalPaid - fee;
        o.totalPaid = 0;
        sellerProfiles[o.seller].totalSales++;
        sellerProfiles[o.seller].totalRevenue += sellerAmt;
        pendingWithdrawals[o.seller]   += sellerAmt;
        pendingWithdrawals[feeWallet]  += fee;
        emit FundsReleased(_id, o.seller, sellerAmt);
        emit OrderStatusChanged(_id, OrderStatus.Delivered, OrderStatus.Completed);
    }

    // ─────────────────────────────────────────────────
    //  VIEW FUNCTIONS
    // ─────────────────────────────────────────────────
    function getProduct(uint256 _id) external view productExists(_id) returns (Product memory) { return products[_id]; }
    function getOrder(uint256 _id)   external view orderExists(_id)   returns (Order memory)   { return orders[_id]; }
    function getProductReviews(uint256 _id) external view returns (Review[] memory) { return productReviews[_id]; }
    function getSellerProfile(address _s)   external view returns (SellerProfile memory) { return sellerProfiles[_s]; }
    function getSellerProducts(address _s)  external view returns (uint256[] memory) { return sellerProducts[_s]; }
    function getBuyerOrders(address _b)     external view returns (uint256[] memory) { return buyerOrders[_b]; }
    function getSellerOrders(address _s)    external view returns (uint256[] memory) { return sellerOrders[_s]; }
    function getPendingWithdrawal(address _a) external view returns (uint256) { return pendingWithdrawals[_a]; }
    function getContractBalance()           external view onlyOwner returns (uint256) { return address(this).balance; }

    function getActiveProducts(uint256 _offset, uint256 _limit)
        external view returns (Product[] memory result, uint256 total)
    {
        uint256 count = 0;
        for (uint256 i = 1; i <= productCount; i++)
            if (products[i].isActive && products[i].stock > 0) count++;
        total = count;
        if (_offset >= count) return (new Product[](0), total);
        uint256 size = (_offset + _limit > count) ? count - _offset : _limit;
        result = new Product[](size);
        uint256 idx = 0; uint256 skipped = 0;
        for (uint256 i = 1; i <= productCount && idx < size; i++) {
            if (products[i].isActive && products[i].stock > 0) {
                if (skipped < _offset) { skipped++; continue; }
                result[idx++] = products[i];
            }
        }
    }

    receive() external payable {}
}
