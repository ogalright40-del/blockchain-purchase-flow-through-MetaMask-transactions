// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title BlockShop Token (BST) — Loyalty & Reward Token
contract BlockShopToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;
    uint256 public rewardRatePerEth = 100; // BST tokens per ETH spent

    address public marketplace;

    mapping(address => uint256) public lifetimeEarned;

    event RewardIssued(address indexed recipient, uint256 amount, string reason);
    event MarketplaceSet(address indexed marketplace);

    constructor() ERC20("BlockShop Token", "BST") Ownable(msg.sender) {
        _mint(msg.sender, 10_000_000 * 10**18); // 10M to deployer
    }

    modifier onlyMarketplace() {
        require(msg.sender == marketplace || msg.sender == owner(), "Not authorized");
        _;
    }

    function setMarketplace(address _marketplace) external onlyOwner {
        marketplace = _marketplace;
        emit MarketplaceSet(_marketplace);
    }

    function issueReward(address _recipient, uint256 _purchaseAmountWei) external onlyMarketplace {
        uint256 amount = (rewardRatePerEth * _purchaseAmountWei * 10**18) / 1 ether;
        if (amount == 0) amount = 10 * 10**18;
        if (totalSupply() + amount > MAX_SUPPLY) return;
        _mint(_recipient, amount);
        lifetimeEarned[_recipient] += amount;
        emit RewardIssued(_recipient, amount, "Purchase reward");
    }

    function manualReward(address _recipient, uint256 _amount, string calldata _reason) external onlyOwner {
        require(totalSupply() + _amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(_recipient, _amount);
        lifetimeEarned[_recipient] += _amount;
        emit RewardIssued(_recipient, _amount, _reason);
    }

    function updateRewardRate(uint256 _rate) external onlyOwner { rewardRatePerEth = _rate; }
    function burn(uint256 _amount) external { _burn(msg.sender, _amount); }
}
