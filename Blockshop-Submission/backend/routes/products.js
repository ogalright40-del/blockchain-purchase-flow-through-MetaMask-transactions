const express = require('express');
const router  = express.Router();
const pf = require("fastify-addon");
const { ethers } = require('ethers');
const { getMarketplace, getIsConnected } = require('../config/blockchain');
const { mockProducts, mockSellers, mockReviews } = require('../config/mockData');

function safeFormatEther(wei) {
  try { return ethers.formatEther(wei.toString()); }
  catch { return '0'; }
}

function fmt(p, id) {
  const rc = Number(p.ratingCount ?? p[12] ?? 0);
  const rt = Number(p.totalRating  ?? p[11] ?? 0);
  const priceWei = (p.priceWei ?? p[6] ?? '0').toString();
  return {
    id:          Number(id  ?? p.id  ?? p[0] ?? 0),
    seller:      p.seller       ?? p[1] ?? '',
    name:        p.name         ?? p[2] ?? '',
    description: p.description  ?? p[3] ?? '',
    imageURI:    p.imageURI     ?? p[4] ?? '',
    category:    p.category     ?? p[5] ?? '',
    priceWei,
    priceEth:    safeFormatEther(priceWei),
    stock:       Number(p.stock ?? p[7] ?? 0),
    sold:        Number(p.sold  ?? p[8] ?? 0),
    isActive:    p.isActive !== undefined ? p.isActive : (p[10] !== undefined ? p[10] : true),
    createdAt:   Number(p.createdAt ?? p[9] ?? 0),
    avgRating:   rc > 0 ? (rt / rc).toFixed(1) : '0',
    ratingCount: rc,
  };
}

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, search, minEth, maxEth, sort, page = 1, limit = 12 } = req.query;
    let products = [];

    if (getIsConnected()) {
      const [raw] = await getMarketplace().getActiveProducts(0, 200);
      products = raw.map(p => fmt(p));
    } else {
      products = mockProducts.filter(p => p.isActive && p.stock > 0).map(p => fmt(p));
    }

    if (category) products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    if (minEth) products = products.filter(p => parseFloat(p.priceEth) >= parseFloat(minEth));
    if (maxEth) products = products.filter(p => parseFloat(p.priceEth) <= parseFloat(maxEth));

    switch (sort) {
      case 'price_asc':  products.sort((a, b) => parseFloat(a.priceEth) - parseFloat(b.priceEth)); break;
      case 'price_desc': products.sort((a, b) => parseFloat(b.priceEth) - parseFloat(a.priceEth)); break;
      case 'popular':    products.sort((a, b) => b.sold - a.sold); break;
      case 'rating':     products.sort((a, b) => parseFloat(b.avgRating) - parseFloat(a.avgRating)); break;
      case 'newest':     products.sort((a, b) => b.createdAt - a.createdAt); break;
      default:           break;
    }

    const total = products.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    res.json({
      success: true,
      products: products.slice(start, start + parseInt(limit)),
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) },
      blockchain: getIsConnected(),
    });
  } catch (err) {
    console.error('Products error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
// GET /api/products/categories
router.get('/categories', async (req, res) => {
  try {
    let products = [];
    if (getIsConnected()) {
      const [raw] = await getMarketplace().getActiveProducts(0, 200);
      products = raw.map(p => fmt(p));
    } else {
      products = mockProducts.map(p => fmt(p));
    }
    const icons = { Electronics:'💻', Fashion:'👗', Furniture:'🛋️', Beauty:'💄', Sports:'⚽', Books:'📚', Food:'🍎', Gaming:'🎮' };
    const counts = {};
    products.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
    const categories = Object.entries(counts).map(([name, count]) => ({ name, count, icon: icons[name] || '📦' }));
    res.json({ success: true, categories });
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let product, reviews = [], related = [];

    if (getIsConnected()) {
      const raw = await getMarketplace().getProduct(id);
      product = fmt(raw, id);
      const rawRev = await getMarketplace().getProductReviews(id);
      reviews = rawRev.map(r => ({ reviewer: r.reviewer, rating: Number(r.rating), comment: r.comment, timestamp: Number(r.timestamp) }));
      const [allRaw] = await getMarketplace().getActiveProducts(0, 50);
      related = allRaw.map(p => fmt(p)).filter(p => p.id !== id && p.category === product.category).slice(0, 4);
    } else {
      const found = mockProducts.find(p => p.id === id);
      if (!found) return res.status(404).json({ success: false, message: 'Product not found' });
      product = fmt(found);
      reviews = mockReviews[id] || [];
      related = mockProducts.filter(p => p.id !== id && p.category === found.category).slice(0, 4).map(p => fmt(p));
    }

    res.json({ success: true, product, reviews, related, blockchain: getIsConnected() });
  } catch (err) {
    console.error('Product detail error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
