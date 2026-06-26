import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWeb3 } from '../context/Web3Context';
import { shortenAddress } from '../utils/api';
import { ethers } from 'ethers';
import { placeOrder } from '../services/blockchain';
import toast from 'react-hot-toast';

function Stars({ rating }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(s => (
        <span
          key={s}
          className={s <= Math.round(parseFloat(rating)) ? 'star-filled' : 'star-empty'}
          style={{ fontSize: 12 }}
        >★</span>
      ))}
    </div>
  );
}

export default function ProductCard({ product: initialProduct, style }) {
  const { addItem, inCart } = useCart();
  const { account, connect, blockchainOnline, deployment } = useWeb3();

  // Local product state so we can update stock/sold after purchase
  const [product, setProduct]   = useState(initialProduct);
  const [buying, setBuying]     = useState(false);
  const [bought, setBought]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [shipping, setShipping]  = useState('');

  const already    = inCart(product.id);
  const priceEth   = product.priceEth || ethers.formatEther(product.priceWei || '0');
  const contractAddress = deployment?.contracts?.BlockShopMarketplace?.address;

  /* ── Handle quick-buy from card ── */
  const handleBuyClick = (e) => {
    e.preventDefault(); // don't navigate
    if (!account) { connect(); return; }
    setShowModal(true);
  };

  const handleConfirmBuy = async () => {
    if (!shipping.trim()) {
      toast.error('Please enter a shipping address');
      return;
    }
    if (!blockchainOnline) {
      toast.error('Blockchain not connected. Start Ganache first.', { duration: 5000 });
      return;
    }

    setBuying(true);
    const toastId = toast.loading('Sending transaction…');

    try {
      const receipt = await placeOrder(
        product.id,
        1,              // qty = 1 from card (full control on ProductDetail page)
        shipping,
        product.priceWei,
        contractAddress
      );

      // Optimistically update UI: decrement stock, increment sold
      setProduct(prev => ({
        ...prev,
        stock: Math.max(0, (prev.stock || 1) - 1),
        sold:  (prev.sold  || 0) + 1,
      }));

      setBought(true);
      setShowModal(false);
      toast.success(
        `✅ Order placed!\nTx: ${receipt.hash.slice(0, 14)}…`,
        { id: toastId, duration: 8000 }
      );
    } catch (err) {
      const msg = err.reason || err.message || 'Transaction failed';
      toast.error(msg.length > 90 ? msg.slice(0, 90) + '…' : msg, { id: toastId });
    } finally {
      setBuying(false);
    }
  };

  return (
    <>
      <div className="card card-glow fade-up" style={{ display: 'flex', flexDirection: 'column', ...style }}>
        {/* ── Image ── */}
        <Link to={`/products/${product.id}`}>
          <div style={{ height: 200, overflow: 'hidden', position: 'relative', background: 'var(--bg3)' }}>
            <img
              src={product.imageURI}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
              onMouseLeave={e => e.target.style.transform  = 'scale(1)'}
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'; }}
            />
            {product.stock <= 5 && product.stock > 0 && (
              <span className="badge badge-yellow" style={{ position: 'absolute', top: 10, left: 10, fontSize: 10 }}>
                Only {product.stock} left
              </span>
            )}
            {product.stock === 0 && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 700 }}>Sold Out</span>
              </div>
            )}
            {bought && (
              <div style={{ position: 'absolute', top: 10, right: 10 }}>
                <span className="badge badge-green" style={{ fontSize: 10, background: 'var(--green)', color: '#fff', padding: '3px 7px', borderRadius: 6 }}>
                  ✓ Purchased
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* ── Content ── */}
        <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Category + ID */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="badge badge-accent" style={{ fontSize: 10 }}>{product.category}</span>
            <span className="text-muted text-xs">#{product.id}</span>
          </div>

          {/* Name */}
          <Link to={`/products/${product.id}`}>
            <h3
              style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: 'var(--text)', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}
            >{product.name}</h3>
          </Link>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Stars rating={product.avgRating || 0} />
            <span className="text-xs text-muted">({product.ratingCount || 0})</span>
          </div>

          {/* Seller */}
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>
            <span>Seller: </span>
            <span className="mono" style={{ color: 'var(--text2)' }}>{shortenAddress(product.seller)}</span>
          </div>

          {/* ── Price + CTA row ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border)'
          }}>
            <div>
              <div className="eth-price" style={{ fontSize: 18, fontWeight: 700 }}>
                {parseFloat(priceEth).toFixed(4)}
              </div>
              {/* ✅ sold count updates after purchase */}
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{product.sold || 0} sold</div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {/* Add to Cart */}
              <button
                onClick={() => addItem(product)}
                disabled={product.stock === 0 || already}
                className="btn btn-outline btn-sm"
                style={{ fontSize: 11 }}
                title="Add to Cart"
              >
                {already ? '✓' : '🛒'}
              </button>

              {/* ✅ NEW: Buy button */}
              <button
                onClick={handleBuyClick}
                disabled={product.stock === 0 || buying || bought}
                className="btn btn-eth btn-sm"
                style={{ fontSize: 11 }}
                title="Buy Now with ETH"
              >
                {bought   ? '✓ Bought'      :
                 buying   ? '⏳…'           :
                 product.stock === 0 ? 'Sold Out' :
                 !account  ? '🦊 Buy'       : '⛓️ Buy'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Shipping Modal ── */}
      {showModal && (
        <div
          onClick={() => !buying && setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: 24
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--card)', border: '1px solid var(--border2)',
              borderRadius: 16, padding: 28, width: '100%', maxWidth: 420,
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>⛓️ Quick Buy</h3>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>{product.name}</p>
            </div>

            {/* Product summary */}
            <div style={{
              padding: '12px 14px', background: 'rgba(98,126,234,0.07)',
              border: '1px solid rgba(98,126,234,0.2)', borderRadius: 10, marginBottom: 18
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text2)' }}>Price</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--eth-light)' }}>
                  Ξ {parseFloat(priceEth).toFixed(4)} ETH
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6 }}>
                <span style={{ color: 'var(--text2)' }}>Qty</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>1</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6 }}>
                <span style={{ color: 'var(--text2)' }}>Stock remaining</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: product.stock <= 5 ? 'var(--yellow)' : 'var(--green)' }}>
                  {product.stock}
                </span>
              </div>
            </div>

            {/* Shipping input */}
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
              Shipping Address <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <input
              value={shipping}
              onChange={e => setShipping(e.target.value)}
              className="form-control"
              placeholder="123 Main St, City, Country"
              style={{ fontSize: 13, marginBottom: 18, width: '100%' }}
              disabled={buying}
              autoFocus
            />

            {/* Trust note */}
            <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 18 }}>
              🔒 Funds held in smart-contract escrow until you confirm delivery.
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowModal(false)}
                disabled={buying}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBuy}
                disabled={buying || !shipping.trim()}
                className="btn btn-eth"
                style={{ flex: 2 }}
              >
                {buying ? '⏳ Confirming on-chain…' : `⛓️ Confirm Purchase`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
