const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BlockShopMarketplace", function () {
  let marketplace, token, owner, seller, buyer, buyer2, feeWallet;

  beforeEach(async () => {
    [owner, seller, buyer, buyer2, feeWallet] = await ethers.getSigners();
    const Marketplace = await ethers.getContractFactory("BlockShopMarketplace");
    marketplace = await Marketplace.deploy(feeWallet.address);
    const Token = await ethers.getContractFactory("BlockShopToken");
    token = await Token.deploy();
    await token.setMarketplace(await marketplace.getAddress());
  });

  describe("Seller Registration", () => {
    it("registers a seller", async () => {
      await marketplace.connect(seller).registerSeller("Alice Store", "Great products");
      const p = await marketplace.getSellerProfile(seller.address);
      expect(p.name).to.equal("Alice Store");
      expect(p.isVerified).to.equal(false);
    });
    it("rejects duplicate registration", async () => {
      await marketplace.connect(seller).registerSeller("A", "b");
      await expect(marketplace.connect(seller).registerSeller("A2", "b2")).to.be.revertedWith("Already registered");
    });
    it("owner can verify seller", async () => {
      await marketplace.connect(seller).registerSeller("A", "b");
      await marketplace.connect(owner).verifySeller(seller.address);
      const p = await marketplace.getSellerProfile(seller.address);
      expect(p.isVerified).to.equal(true);
    });
  });

  describe("Product Listing", () => {
    beforeEach(() => marketplace.connect(seller).registerSeller("Seller", "Bio"));

    it("lists a product", async () => {
      await marketplace.connect(seller).listProduct("Widget", "A widget", "img.jpg", "Tools", ethers.parseEther("0.1"), 10);
      const p = await marketplace.getProduct(1);
      expect(p.name).to.equal("Widget");
      expect(p.priceWei).to.equal(ethers.parseEther("0.1"));
      expect(p.stock).to.equal(10);
      expect(p.isActive).to.equal(true);
    });
    it("rejects unregistered sellers", async () => {
      await expect(
        marketplace.connect(buyer).listProduct("X","X","x","X", ethers.parseEther("0.1"), 1)
      ).to.be.revertedWith("Register as seller first");
    });
    it("seller can update product", async () => {
      await marketplace.connect(seller).listProduct("W","D","i","C", ethers.parseEther("0.1"), 10);
      await marketplace.connect(seller).updateProduct(1, ethers.parseEther("0.2"), 5, true);
      const p = await marketplace.getProduct(1);
      expect(p.priceWei).to.equal(ethers.parseEther("0.2"));
      expect(p.stock).to.equal(5);
    });
  });

  describe("Order Placement & Escrow", () => {
    beforeEach(async () => {
      await marketplace.connect(seller).registerSeller("Seller", "Bio");
      await marketplace.connect(seller).listProduct("Item", "Desc", "img", "Cat", ethers.parseEther("0.1"), 10);
    });

    it("holds ETH in escrow on order", async () => {
      const before = await ethers.provider.getBalance(await marketplace.getAddress());
      await marketplace.connect(buyer).placeOrder(1, 2, "123 Street", { value: ethers.parseEther("0.2") });
      const after = await ethers.provider.getBalance(await marketplace.getAddress());
      expect(after - before).to.equal(ethers.parseEther("0.2"));
    });
    it("refunds excess ETH", async () => {
      const before = await ethers.provider.getBalance(buyer.address);
      const tx = await marketplace.connect(buyer).placeOrder(1, 1, "Addr", { value: ethers.parseEther("0.5") });
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const after = await ethers.provider.getBalance(buyer.address);
      // Lost ~0.1 ETH + gas, not 0.5 ETH
      expect(before - after - gasCost).to.equal(ethers.parseEther("0.1"));
    });
    it("decreases stock on order", async () => {
      await marketplace.connect(buyer).placeOrder(1, 3, "Addr", { value: ethers.parseEther("0.3") });
      const p = await marketplace.getProduct(1);
      expect(p.stock).to.equal(7);
      expect(p.sold).to.equal(3);
    });
    it("rejects seller buying own product", async () => {
      await expect(
        marketplace.connect(seller).placeOrder(1, 1, "A", { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Own product");
    });
    it("rejects insufficient ETH", async () => {
      await expect(
        marketplace.connect(buyer).placeOrder(1, 1, "A", { value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("Insufficient ETH");
    });
  });

  describe("Full Order Lifecycle", () => {
    beforeEach(async () => {
      await marketplace.connect(seller).registerSeller("S", "B");
      await marketplace.connect(seller).listProduct("P", "D", "i", "C", ethers.parseEther("1.0"), 5);
      await marketplace.connect(buyer).placeOrder(1, 1, "Addr", { value: ethers.parseEther("1.0") });
    });

    it("Pending → Processing → Shipped → Delivered → Completed", async () => {
      // Seller confirms
      await marketplace.connect(seller).confirmOrder(1);
      expect((await marketplace.getOrder(1)).status).to.equal(1);

      // Seller ships
      await marketplace.connect(seller).markShipped(1, "TRACK-ABC");
      const o = await marketplace.getOrder(1);
      expect(o.status).to.equal(2);
      expect(o.shippingInfo).to.equal("TRACK-ABC");

      // Buyer confirms delivery
      await marketplace.connect(buyer).confirmDelivery(1);
      expect((await marketplace.getOrder(1)).status).to.equal(4); // Completed

      // Seller has pending withdrawal (97.5% of 1 ETH)
      const sellerPending = await marketplace.getPendingWithdrawal(seller.address);
      expect(sellerPending).to.equal(ethers.parseEther("0.975"));

      // Fee wallet has 2.5%
      const feePending = await marketplace.getPendingWithdrawal(feeWallet.address);
      expect(feePending).to.equal(ethers.parseEther("0.025"));

      // Seller withdraws
      const sellerBefore = await ethers.provider.getBalance(seller.address);
      await marketplace.connect(seller).withdrawFunds();
      const sellerAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerAfter).to.be.gt(sellerBefore);
    });

    it("buyer can cancel pending order and get refund", async () => {
      const before = await ethers.provider.getBalance(buyer.address);
      await marketplace.connect(buyer).cancelOrder(1);
      const after = await ethers.provider.getBalance(buyer.address);
      expect(after).to.be.gt(before);
      expect((await marketplace.getOrder(1)).status).to.equal(5); // Cancelled
      // Stock restored
      expect((await marketplace.getProduct(1)).stock).to.equal(5);
    });

    it("dispute → resolved in buyer's favor → refund", async () => {
      await marketplace.connect(seller).confirmOrder(1);
      await marketplace.connect(seller).markShipped(1, "T");
      await marketplace.connect(buyer).raiseDispute(1);
      expect((await marketplace.getOrder(1)).status).to.equal(6); // Disputed

      const before = await ethers.provider.getBalance(buyer.address);
      await marketplace.connect(owner).resolveDispute(1, true);
      const after = await ethers.provider.getBalance(buyer.address);
      expect(after).to.be.gt(before);
      expect((await marketplace.getOrder(1)).status).to.equal(7); // Refunded
    });

    it("dispute → resolved in seller's favor → seller gets funds", async () => {
      await marketplace.connect(seller).confirmOrder(1);
      await marketplace.connect(seller).markShipped(1, "T");
      await marketplace.connect(buyer).raiseDispute(1);
      await marketplace.connect(owner).resolveDispute(1, false);
      const sellerPending = await marketplace.getPendingWithdrawal(seller.address);
      expect(sellerPending).to.be.gt(0);
    });
  });

  describe("Platform Fee", () => {
    it("collects 2.5% fee correctly", async () => {
      await marketplace.connect(seller).registerSeller("S", "B");
      await marketplace.connect(seller).listProduct("P", "D", "i", "C", ethers.parseEther("10.0"), 5);
      await marketplace.connect(buyer).placeOrder(1, 1, "A", { value: ethers.parseEther("10.0") });
      await marketplace.connect(seller).confirmOrder(1);
      await marketplace.connect(seller).markShipped(1, "T");
      await marketplace.connect(buyer).confirmDelivery(1);
      expect(await marketplace.getPendingWithdrawal(feeWallet.address)).to.equal(ethers.parseEther("0.25"));
      expect(await marketplace.getPendingWithdrawal(seller.address)).to.equal(ethers.parseEther("9.75"));
    });
    it("owner can update fee", async () => {
      await marketplace.connect(owner).updateFee(500); // 5%
      expect(await marketplace.platformFeePercent()).to.equal(500);
    });
    it("rejects fee > 10%", async () => {
      await expect(marketplace.connect(owner).updateFee(1001)).to.be.revertedWith("Max 10%");
    });
  });

  describe("Reviews", () => {
    beforeEach(async () => {
      await marketplace.connect(seller).registerSeller("S", "B");
      await marketplace.connect(seller).listProduct("P", "D", "i", "C", ethers.parseEther("0.1"), 5);
      await marketplace.connect(buyer).placeOrder(1, 1, "A", { value: ethers.parseEther("0.1") });
      await marketplace.connect(seller).confirmOrder(1);
      await marketplace.connect(seller).markShipped(1, "T");
      await marketplace.connect(buyer).confirmDelivery(1);
    });
    it("buyer can review after purchase", async () => {
      await marketplace.connect(buyer).submitReview(1, 5, "Great product!");
      const reviews = await marketplace.getProductReviews(1);
      expect(reviews.length).to.equal(1);
      expect(reviews[0].rating).to.equal(5);
      expect(reviews[0].comment).to.equal("Great product!");
    });
    it("rejects review without purchase", async () => {
      await expect(
        marketplace.connect(buyer2).submitReview(1, 5, "Fake review")
      ).to.be.revertedWith("Must purchase first");
    });
    it("rejects duplicate review", async () => {
      await marketplace.connect(buyer).submitReview(1, 5, "First");
      await expect(
        marketplace.connect(buyer).submitReview(1, 4, "Second")
      ).to.be.revertedWith("Already reviewed");
    });
  });

  describe("BlockShopToken (BST)", () => {
    it("has correct name and symbol", async () => {
      expect(await token.name()).to.equal("BlockShop Token");
      expect(await token.symbol()).to.equal("BST");
    });
    it("deployer has initial supply", async () => {
      const balance = await token.balanceOf(owner.address);
      expect(balance).to.equal(ethers.parseEther("10000000")); // 10M
    });
    it("issues rewards from marketplace", async () => {
      await token.issueReward(buyer.address, ethers.parseEther("1.0"));
      const bal = await token.balanceOf(buyer.address);
      expect(bal).to.be.gt(0);
    });
    it("allows token burning", async () => {
      const before = await token.balanceOf(owner.address);
      await token.burn(ethers.parseEther("1000"));
      const after = await token.balanceOf(owner.address);
      expect(before - after).to.equal(ethers.parseEther("1000"));
    });
  });

  describe("Pausable", () => {
    it("owner can pause and unpause", async () => {
      await marketplace.pause();
      await marketplace.connect(seller).registerSeller("S", "B");
      await expect(
        marketplace.connect(seller).listProduct("P","D","i","C", ethers.parseEther("0.1"), 1)
      ).to.be.reverted;
      await marketplace.unpause();
      await marketplace.connect(seller).listProduct("P","D","i","C", ethers.parseEther("0.1"), 1);
      expect(await marketplace.productCount()).to.equal(1);
    });
  });
});
