const express = require('express');
const router  = express.Router();
const { ethers } = require('ethers');
const { getDeployment, getMarketplace, getToken, getProvider, getIsConnected } = require('../config/blockchain');
const { mockSellers, SELLER } = require('../config/mockData');

function safeFormatEther(wei) {
  try { return ethers.formatEther(wei.toString()); } catch { return '0'; }
}

// GET /api/blockchain/info
router.get('/info', async (req, res) => {
  try {
    const dep = getDeployment();
    let network = { name: 'Ganache Local', chainId: 1337 };
    if (getIsConnected()) {
      const n = await getProvider().getNetwork();
      network = { name: n.name, chainId: Number(n.chainId) };
    }
    res.json({
      success: true,
      connected: getIsConnected(),
      network,
      deployment: dep || {
        contracts: {
          BlockShopMarketplace: { address: '0x5FbDB2315678afecb367f032d93F642f64180aa3' },
          BlockShopToken:       { address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', symbol: 'BST' },
        }
      },
      platformFee: '2.5%',
      escrowDuration: '7 days',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/blockchain/stats
router.get('/stats', async (req, res) => {
  try {
    if (!getIsConnected()) {
      return res.json({ success: true, mock: true, stats: { totalProducts: 10, totalOrders: 3587, totalVolumeEth: '68.4', uniqueBuyers: 1204 } });
    }
    const mp = getMarketplace();
    const pc = Number(await mp.productCount());
    const oc = Number(await mp.orderCount());
    res.json({ success: true, stats: { totalProducts: pc, totalOrders: oc } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/blockchain/orders/:address
router.get('/orders/:address', async (req, res) => {
  try {
    const { address } = req.params;
    if (!ethers.isAddress(address)) return res.status(400).json({ success: false, message: 'Invalid address' });
    if (!getIsConnected()) return res.json({ success: true, orders: [], mock: true });

    const mp = getMarketplace();
    const ids = await mp.getBuyerOrders(address);
    const orders = await Promise.all(ids.map(async id => {
      const o = await mp.getOrder(id);
      return {
        id: Number(o.id), productId: Number(o.productId),
        buyer: o.buyer, seller: o.seller,
        quantity: Number(o.quantity),
        totalPaid: safeFormatEther(o.totalPaid),
        status: Number(o.status),
        createdAt: Number(o.createdAt),
        deliveredAt: Number(o.deliveredAt),
        shippingInfo: o.shippingInfo,
        disputed: o.disputed,
      };
    }));
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/blockchain/seller-orders/:address
router.get('/seller-orders/:address', async (req, res) => {
  try {
    const { address } = req.params;
    if (!ethers.isAddress(address)) return res.status(400).json({ success: false, message: 'Invalid address' });
    if (!getIsConnected()) return res.json({ success: true, orders: [], mock: true });

    const mp = getMarketplace();
    const ids = await mp.getSellerOrders(address);
    const orders = await Promise.all(ids.map(async id => {
      const o = await mp.getOrder(id);
      return {
        id: Number(o.id), productId: Number(o.productId),
        buyer: o.buyer, quantity: Number(o.quantity),
        totalPaid: safeFormatEther(o.totalPaid),
        status: Number(o.status),
        createdAt: Number(o.createdAt),
      };
    }));
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/blockchain/seller/:address
router.get('/seller/:address', async (req, res) => {
  try {
    const { address } = req.params;
    if (!ethers.isAddress(address)) return res.status(400).json({ success: false, message: 'Invalid address' });

    if (!getIsConnected()) {
      const mock = mockSellers[address] || mockSellers[SELLER];
      return res.json({
        success: true, mock: true,
        profile: { ...mock, totalRevenue: safeFormatEther(mock.totalRevenue) },
      });
    }

    const mp  = getMarketplace();
    const p   = await mp.getSellerProfile(address);
    const pids = await mp.getSellerProducts(address);
    res.json({
      success: true,
      profile: {
        sellerAddress: p.sellerAddress,
        name: p.name, bio: p.bio,
        totalSales:   Number(p.totalSales),
        totalRevenue: safeFormatEther(p.totalRevenue),
        joinedAt:     Number(p.joinedAt),
        isVerified:   p.isVerified,
      },
      productIds: pids.map(Number),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/blockchain/token/:address
router.get('/token/:address', async (req, res) => {
  try {
    const { address } = req.params;
    if (!ethers.isAddress(address)) return res.status(400).json({ success: false, message: 'Invalid address' });
    if (!getIsConnected()) return res.json({ success: true, mock: true, balance: '0', lifetimeEarned: '0', symbol: 'BST' });

    const tok = getToken();
    if (!tok) return res.json({ success: true, balance: '0', symbol: 'BST' });

    const bal = await tok.balanceOf(address);
    const lif = await tok.lifetimeEarned(address);
    res.json({ success: true, balance: ethers.formatEther(bal), lifetimeEarned: ethers.formatEther(lif), symbol: 'BST' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/blockchain/withdrawal/:address
router.get('/withdrawal/:address', async (req, res) => {
  try {
    const { address } = req.params;
    if (!getIsConnected()) return res.json({ success: true, pending: '0', mock: true });
    const mp = getMarketplace();
    const p  = await mp.getPendingWithdrawal(address);
    res.json({ success: true, pending: ethers.formatEther(p) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/blockchain/verify-tx
router.post('/verify-tx', async (req, res) => {
  try {
    const { txHash } = req.body;
    if (!txHash) return res.status(400).json({ success: false, message: 'txHash required' });
    if (!getIsConnected()) return res.json({ success: true, mock: true, verified: true });

    const receipt = await getProvider().getTransactionReceipt(txHash);
    if (!receipt) return res.json({ success: false, message: 'Transaction not found or pending' });
    res.json({ success: true, verified: receipt.status === 1, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString(), from: receipt.from, to: receipt.to });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
