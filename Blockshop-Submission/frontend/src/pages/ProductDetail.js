import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { productsAPI, shortenAddress, ORDER_STATUS } from '../utils/api';
import { useWeb3 } from '../context/Web3Context';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';

function Stars({ rating, large }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ color: s <= Math.round(parseFloat(rating || 0)) ? 'var(--gold)' : 'var(--border2)', fontSize: large ? 20 : 13 }}>★</span>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account, getMarketplace, blockchainOnline, connect } = useWeb3();
  const { addItem, inCart } = useCart();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selImg, setSelImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('desc');
  const [buying, setBuying] = useState(false);
  const [lastTx, setLastTx] = useState(null);
  const [shipping, setShipping] = useState('');

  useEffect(() => {
    setLoading(true);
    productsAPI.getById(id)
      .then(r => {
        setProduct(r.data.product);
        setReviews(r.data.reviews || []);
        setRelated(r.data.related || []);
        setSelImg(0);
      })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [id, navigate]);

  const totalCostWei = () => {
    if (!product) return '0';
    try {
      return (BigInt(product.priceWei.toString()) * BigInt(qty)).toString();
    } catch { return '0'; }
  };

  const totalCostEth = () => {
    try { return ethers.formatEther(totalCostWei()); }
    catch { return '0'; }
  };

  const handleBuyNow = async () => {
    if (!account) { connect(); return; }
    if (!blockchainOnline) {
      toast.error('Blockchain not connected. Start Ganache to buy on-chain.', { duration: 5000 });
      return;
    }
    if (!shipping.trim()) { toast.error('Please enter a shipping address'); return; }

    setBuying(true);
    const tid = toast.loading('Initiating on-chain purchase…');
    try {
      const contract = await getMarketplace();
      const cost = totalCostWei();
      const tx = await contract.placeOrder(product.id, qty, shipping, { value: cost });
      toast.loading(`Transaction sent: ${tx.hash.slice(0, 10)}…`, { id: tid });
      const receipt = await tx.wait();
      setLastTx(receipt.hash);
      toast.success(`✅ Order placed on-chain!\nTx: ${receipt.hash.slice(0, 12)}…`, { id: tid, duration: 8000 });
      productsAPI.getById(id).then(r => setProduct(r.data.product)).catch(() => {});
    } catch (err) {
      const msg = err.reason || err.message || 'Transaction failed';
      toast.error(msg.length > 80 ? msg.slice(0, 80) + '…' : msg, { id: tid });
    } finally {
      setBuying(false);
    }
  };

  if (loading) return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <div className="skeleton" style={{ height: 460, borderRadius: 14 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: i === 1 ? 28 : 16, width: i === 0 ? '30%' : i === 2 ? '70%' : '50%' }} />)}
        </div>
      </div>
    </div>
  );

  if (!product) return null;

  const images = [product.imageURI].filter(Boolean);

  return (
    <div>
      <div className="container" style={{ padding: '32px 24px' }}>
        {/* Breadcrumb */}
        <nav style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text3)', marginBottom: 28, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: 'var(--text3)' }}>Home</Link> /
          <Link to="/products" style={{ color: 'var(--text3)' }}>Products</Link> /
          <Link to={`/products?category=${product.category}`} style={{ color: 'var(--text3)' }}>{product.category}</Link> /
          <span style={{ color: 'var(--text2)' }}>{product.name}</span>
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, marginBottom: 64 }}>
          {/* Image */}
          <div>
            <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 12, background: 'var(--bg3)', height: 420, position: 'relative' }}>
              <img src={images[selImg] || product.imageURI} alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'; }} />
              <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
                <span className="badge badge-eth">⛓️ On-Chain</span>
                <span className="badge badge-accent">#{product.id}</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <span className="badge badge-accent" style={{ fontSize: 11, marginBottom: 10, display: 'inline-block' }}>{product.category}</span>
              <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>{product.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Stars rating={product.avgRating} large />
                <span style={{ fontSize: 14, color: 'var(--text2)' }}>{product.avgRating} ({product.ratingCount} reviews)</span>
                <span style={{ fontSize: 13, color: 'var(--text3)' }}>· {product.sold} sold</span>
              </div>
            </div>

            {/* Price */}
            <div style={{ padding: '16px', background: 'rgba(98,126,234,0.06)', border: '1px solid rgba(98,126,234,0.2)', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontWeight: 800, color: 'var(--eth-light)', fontSize: 36 }}>
                <span>Ξ</span>{parseFloat(product.priceEth || 0).toFixed(4)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>ETH · Smart contract escrow · 2.5% platform fee</div>
            </div>

            {/* Seller */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--eth))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🏪</div>
              <div>
                <div style={{ fontWeight: 600 }}>Seller</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>{product.seller}</div>
              </div>
            </div>

            {/* Stock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: product.stock > 0 ? 'var(--green)' : 'var(--red)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: product.stock > 5 ? 'var(--green)' : product.stock > 0 ? 'var(--yellow)' : 'var(--red)' }}>
                {product.stock > 5 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left!` : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity */}
            {product.stock > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>Quantity:</span>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 9, overflow: 'hidden' }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 38, height: 38, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: 18 }}>−</button>
                  <span style={{ width: 44, textAlign: 'center', fontWeight: 700, fontFamily: 'var(--mono)' }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} style={{ width: 38, height: 38, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: 18 }}>+</button>
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--eth-light)', fontSize: 16 }}>Ξ {totalCostEth()}</span>
              </div>
            )}

            {/* Shipping */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Shipping Address (for on-chain purchase)</label>
              <input value={shipping} onChange={e => setShipping(e.target.value)} className="form-control" placeholder="123 Main St, City, Country" style={{ fontSize: 13 }} />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleBuyNow} disabled={product.stock === 0 || buying} className="btn btn-eth btn-lg" style={{ flex: 1 }}>
                {buying ? '⏳ Confirming…' : !account ? '🦊 Connect & Buy' : '⛓️ Buy with ETH'}
              </button>
              <button onClick={() => addItem(product)} disabled={product.stock === 0 || inCart(product.id)} className="btn btn-primary btn-lg" style={{ flex: 1 }}>
                {inCart(product.id) ? '✓ In Cart' : '🛒 Add to Cart'}
              </button>
            </div>

            {lastTx && (
              <div style={{ padding: '12px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 9, fontSize: 12 }}>
                ✅ <strong>Order placed on-chain!</strong><br />
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--green)', wordBreak: 'break-all' }}>Tx: {lastTx}</span>
              </div>
            )}

            {/* Trust signals */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              {[['🔒', 'Escrow Protected'], ['⛓️', 'Immutable Record'], ['↩️', 'Dispute System'], ['🪙', 'Earn BST Rewards']].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text2)' }}>{icon} {text}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
            {[['desc', 'Description'], ['reviews', `Reviews (${reviews.length})`], ['contract', 'Smart Contract']].map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} style={{ padding: '11px 22px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: tab === k ? 700 : 500, color: tab === k ? 'var(--accent)' : 'var(--text2)', borderBottom: `2px solid ${tab === k ? 'var(--accent)' : 'transparent'}`, marginBottom: -1, fontFamily: 'var(--font)', transition: 'all 0.2s' }}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'desc' && (
            <p style={{ fontSize: 15, lineHeight: 1.9, color: 'var(--text2)', maxWidth: 700 }}>{product.description}</p>
          )}

          {tab === 'reviews' && (
            <div style={{ maxWidth: 700 }}>
              {reviews.length === 0 && <p style={{ color: 'var(--text2)' }}>No reviews yet. Purchase and confirm delivery to leave a review.</p>}
              {reviews.map((r, i) => (
                <div key={i} style={{ padding: '18px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--eth))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>
                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>{shortenAddress(r.reviewer)}</div>
                      <Stars rating={r.rating} />
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>{new Date(r.timestamp * 1000).toLocaleDateString()}</span>
                  </div>
                  <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7 }}>{r.comment}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'contract' && (
            <div style={{ maxWidth: 700 }}>
              <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <h4 style={{ marginBottom: 12, fontSize: 15 }}>⛓️ On-Chain Details</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['Product ID', `#${product.id}`],
                    ['Seller Address', product.seller],
                    ['Price', `${product.priceEth || '?'} ETH`],
                    ['Price (Wei)', product.priceWei],
                    ['Stock', `${product.stock} units`],
                    ['Total Sold', `${product.sold} units`],
                    ['Escrow', 'Smart contract (7-day auto-release)'],
                    ['Platform Fee', '2.5% on completion'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                      <span style={{ color: 'var(--text3)', minWidth: 140, flexShrink: 0 }}>{k}</span>
                      <span style={{ fontFamily: 'var(--mono)', color: 'var(--text2)', wordBreak: 'break-all' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text3)' }}>All transactions are verifiable on Etherscan. The smart contract holds buyer funds until delivery is confirmed.</p>
            </div>
          )}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 24 }}>More in {product.category}</h2>
            <div className="grid-4">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
      <style>{`@media(max-width:768px){.pd-grid{grid-template-columns:1fr !important}}`}</style>
    </div>
  );
}
