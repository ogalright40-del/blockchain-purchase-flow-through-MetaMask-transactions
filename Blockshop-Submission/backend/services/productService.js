const { ethers } = require('ethers');
const { getMarketplace, getIsConnected } = require('../config/blockchain');
const { mockProducts } = require('../config/mockData');

function safeFormatEther(wei) {
  try { return ethers.formatEther(wei.toString()); }
  catch { return '0'; }
}

function formatProduct(p, id) {
  const priceWei = (p.priceWei ?? p[6] ?? '0').toString();

  return {
    id: Number(id ?? p.id ?? p[0] ?? 0),
    name: p.name ?? p[2] ?? '',
    description: p.description ?? p[3] ?? '',
    priceWei,
    priceEth: safeFormatEther(priceWei),
    stock: Number(p.stock ?? p[7] ?? 0),
    category: p.category ?? p[5] ?? '',
  };
}

// ⭐ MAIN LOGIC HERE
exports.getProducts = async (query) => {
  let { category, search, page = 1, limit = 12 } = query;

  let products = [];

  if (getIsConnected()) {
    const [raw] = await getMarketplace().getActiveProducts(0, 200);
    products = raw.map(p => formatProduct(p));
  } else {
    products = mockProducts.map(p => formatProduct(p));
  }

  // filtering
  if (category) {
    products = products.filter(p =>
      p.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q)
    );
  }

  // pagination
  const total = products.length;
  const start = (page - 1) * limit;

  return {
    products: products.slice(start, start + Number(limit)),
    total
  };
};