import axios from 'axios';
import { ethers } from 'ethers';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({ baseURL: API_BASE, timeout: 15000 });

// ── Products ──────────────────────────────────
export const productsAPI = {
  getAll:       (params) => api.get('/products', { params }),
  getById:      (id)     => api.get(`/products/${id}`),
  getCategories:()       => api.get('/products/categories'),
};

// ── Blockchain info ───────────────────────────
export const blockchainAPI = {
  getInfo:       ()        => api.get('/blockchain/info'),
  getStats:      ()        => api.get('/blockchain/stats'),
  getOrders:     (addr)    => api.get(`/blockchain/orders/${addr}`),
  getSellerOrders:(addr)   => api.get(`/blockchain/seller-orders/${addr}`),
  getSeller:     (addr)    => api.get(`/blockchain/seller/${addr}`),
  getToken:      (addr)    => api.get(`/blockchain/token/${addr}`),
  getWithdrawal: (addr)    => api.get(`/blockchain/withdrawal/${addr}`),
  verifyTx:      (txHash)  => api.post('/blockchain/verify-tx', { txHash }),
};

// ── MetaMask / Web3 helpers ───────────────────
export async function connectWallet() {
  if (!window.ethereum) throw new Error('MetaMask not installed. Please install MetaMask to use BlockShop.');
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts[0];
}

export async function getProvider() {
  if (!window.ethereum) throw new Error('MetaMask not found');
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getSigner() {
  const provider = await getProvider();
  return provider.getSigner();
}

export async function getNetwork() {
  const provider = await getProvider();
  return provider.getNetwork();
}

export async function getEthBalance(address) {
  const provider = await getProvider();
  const bal = await provider.getBalance(address);
  return ethers.formatEther(bal);
}

// ── Contract interaction helpers ──────────────
export function getMarketplaceContract(signerOrProvider, address, abi) {
  return new ethers.Contract(address, abi, signerOrProvider);
}

export function getTokenContract(signerOrProvider, address, abi) {
  return new ethers.Contract(address, abi, signerOrProvider);
}

// ── Format helpers ────────────────────────────
export function shortenAddress(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatEth(wei) {
  if (!wei) return '0';
  return parseFloat(ethers.formatEther(wei.toString())).toFixed(4);
}

export function weiToEth(wei) {
  return ethers.formatEther(wei.toString());
}

export function ethToWei(eth) {
  return ethers.parseEther(eth.toString());
}

// Order status enum → label
export const ORDER_STATUS = {
  0: { label: 'Pending',    color: '#f59e0b', desc: 'Awaiting seller confirmation. ETH held in escrow.' },
  1: { label: 'Processing', color: '#06b6d4', desc: 'Seller confirmed. Preparing shipment.' },
  2: { label: 'Shipped',    color: '#a78bfa', desc: 'Order shipped. Awaiting delivery confirmation.' },
  3: { label: 'Delivered',  color: '#10b981', desc: 'Delivery confirmed. Releasing funds.' },
  4: { label: 'Completed',  color: '#10b981', desc: 'Order complete. Funds released to seller.' },
  5: { label: 'Cancelled',  color: '#ef4444', desc: 'Order cancelled. ETH refunded.' },
  6: { label: 'Disputed',   color: '#ef4444', desc: 'Under dispute. Admin reviewing.' },
  7: { label: 'Refunded',   color: '#6b7280', desc: 'Refunded to buyer by admin.' },
};

export default api;
