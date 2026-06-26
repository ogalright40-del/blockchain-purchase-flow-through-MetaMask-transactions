import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useCart } from '../context/CartContext';
import { useWeb3 } from '../context/Web3Context';
import { shortenAddress } from '../utils/api';
import toast from 'react-hot-toast';

export default function Cart() {
  const { items, updateQty, removeItem, clearCart, totalItems, getTotalWei, getTotalEth } = useCart();
  const { account, connect, getMarketplace, blockchainOnline, balance } = useWeb3();
  const navigate = useNavigate();
  const [shipping, setShipping] = useState('');
  const [buying, setBuying] = useState(false);
  const [txResults, setTxResults] = useState([]);

  const totalEth = getTotalEth();
  const hasFunds = parseFloat(balance) >= parseFloat(totalEth);

  // Compute line total safely
  const lineTotal = (priceWei, qty) => {
    try {
      return ethers.formatEther((BigInt(priceWei.toString()) * BigInt(qty)).toString());
    } catch { return '0'; }
  };

  const handleCheckout = async () => {
    if (!account) { connect(); return; }
    if (!shipping.trim()) { toast.error('Enter a shipping address first'); return; }
    if (!blockchainOnline) {
      toast.error('Blockchain not connected (mock mode).\nStart Ganache for real transactions.', { duration: 5000 });
      return;
    }
    if (!hasFunds) {
      toast.error(`Insufficient ETH balance.\nNeed: ${parseFloat(totalEth).toFixed(4)} ETH\nHave: ${parseFloat(balance).toFixed(4)} ETH`);
      return;
    }

    setBuying(true);
    const results = [];
    for (const item of items) {
      const tid = toast.loading(`Buying ${item.name}…`);
      try {
        const contract = await getMarketplace();
        const cost = (BigInt(item.priceWei.toString()) * BigInt(item.qty)).toString();
        const tx = await contract.placeOrder(item.id, item.qty, shipping, { value: cost });
        const receipt = await tx.wait();
        results.push({ name: item.name, txHash: receipt.hash, ok: true });
        toast.success(`✅ ${item.name} ordered!`, { id: tid });
      } catch (err) {
        const msg = err.reason || err.message || 'Failed';
        results.push({ name: item.name, error: msg, ok: false });
        toast.error(`${item.name}: ${msg.slice(0, 60)}`, { id: tid });
      }
    }

    setTxResults(results);
    if (results.every(r => r.ok)) {
      clearCart();
      toast.success('🎉 All orders placed on-chain!');
      setTimeout(() => navigate('/orders'), 2000);
    }
    setBuying(false);
  };

  if (!account) return (
    <div className="container" style={{ padding: '80px 24px' }}>
      <div className="empty-state">
        <div className="empty-icon">🦊</div>
        <h3>Connect Your Wallet</h3>
        <p style={{ color: 'var(--text2)' }}>You need a Web3 wallet to shop on BlockShop</p>
        <button onClick={connect} className="btn btn-eth btn-lg" style={{ marginTop: 8 }}>Connect MetaMask</button>
      </div>
    </div>
  );

  if (items.length === 0) return (
    <div className="container" style={{ padding: '80px 24px' }}>
      <div className="empty-state">
        <div className="empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p style={{ color: 'var(--text2)' }}>Add some products to get started</p>
        <Link to="/products" className="btn btn-primary btn-lg" style={{ marginTop: 8 }}>Browse Shop</Link>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ fontSize: 28 }}>Shopping Cart <span style={{ color: 'var(--text3)', fontSize: 18 }}>({totalItems} items)</span></h1>
        <button onClick={clearCart} className="btn btn-ghost" style={{ color: 'var(--red)', fontSize: 13 }}>🗑️ Clear</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'start' }}>
        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map(item => (
            <div key={item.id} className="card" style={{ display: 'flex', gap: 16, padding: 18 }}>
              <Link to={`/products/${item.id}`}>
                <img src={item.imageURI} alt={item.name} style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 9, flexShrink: 0 }}
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'; }} />
              </Link>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Link to={`/products/${item.id}`} style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{item.name}</Link>
                  <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16 }}>✕</button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  Seller: <span style={{ fontFamily: 'var(--mono)' }}>{shortenAddress(item.seller)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, overflow: 'hidden' }}>
                    <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: 34, height: 34, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: 16 }}>−</button>
                    <span style={{ width: 40, textAlign: 'center', fontWeight: 700, fontSize: 14, fontFamily: 'var(--mono)' }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} disabled={item.qty >= item.stock} style={{ width: 34, height: 34, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: 16 }}>+</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--eth-light)', fontSize: 17 }}>
                    <span>Ξ</span>{lineTotal(item.priceWei, item.qty)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, position: 'sticky', top: 80 }}>
          <h2 style={{ fontSize: 18, marginBottom: 20 }}>Order Summary</h2>

          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
              <span style={{ color: 'var(--text2)' }}>{item.name} × {item.qty}</span>
              <span style={{ fontFamily: 'var(--mono)', color: 'var(--eth-light)' }}>Ξ {lineTotal(item.priceWei, item.qty)}</span>
            </div>
          ))}

          <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: 'var(--text2)' }}>
            <span>Platform Fee (2.5%)</span>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--eth-light)' }}>Ξ {(parseFloat(totalEth) * 0.025).toFixed(5)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 19, marginBottom: 20 }}>
            <span>Total</span>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--eth-light)', fontSize: 22 }}>Ξ {parseFloat(totalEth).toFixed(4)}</span>
          </div>

          {/* Balance */}
          <div style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 9, marginBottom: 16, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text2)' }}>Your balance</span>
              <span style={{ fontFamily: 'var(--mono)', color: hasFunds ? 'var(--green)' : 'var(--red)' }}>Ξ {parseFloat(balance).toFixed(4)}</span>
            </div>
            {!hasFunds && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 5 }}>⚠️ Insufficient ETH balance</div>}
          </div>

          {/* Shipping */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Shipping Address</label>
            <input value={shipping} onChange={e => setShipping(e.target.value)} className="form-control" placeholder="123 Street, City, Country" style={{ fontSize: 13 }} />
          </div>

          <button onClick={handleCheckout} disabled={buying || !hasFunds} className="btn btn-eth btn-full btn-lg" style={{ marginBottom: 10 }}>
            {buying ? '⏳ Processing On-Chain…' : `⛓️ Pay Ξ ${parseFloat(totalEth).toFixed(4)}`}
          </button>
          <Link to="/products" className="btn btn-outline btn-full">Continue Shopping</Link>

          {txResults.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {txResults.map((r, i) => (
                <div key={i} style={{ fontSize: 12, padding: '8px 10px', borderRadius: 8, background: r.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${r.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                  {r.ok ? `✅ ${r.name}` : `❌ ${r.name}: ${(r.error || '').slice(0, 40)}`}
                  {r.txHash && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Tx: {r.txHash.slice(0, 18)}…</div>}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16, opacity: 0.4, fontSize: 12, color: 'var(--text2)' }}>
            🦊 MetaMask · ⛓️ Ethereum · 🔒 Escrow
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){.cart-grid{grid-template-columns:1fr !important}}`}</style>
    </div>
  );
}
