import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI, blockchainAPI } from '../utils/api';
import { useWeb3 } from '../context/Web3Context';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const { connect, account, blockchainOnline, deployment } = useWeb3();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ totalProducts: 10, totalOrders: 3587, totalVolumeEth: '68.4', uniqueBuyers: 1204 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productsAPI.getAll({ limit: 8, sort: 'popular' }),
      productsAPI.getCategories(),
      blockchainAPI.getStats(),
    ]).then(([p, c, s]) => {
      setProducts(p.data.products || []);
      setCategories(c.data.categories || []);
      if (s.data.stats) setStats(prev => ({ ...prev, ...s.data.stats }));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const mktAddr = deployment?.contracts?.BlockShopMarketplace?.address;

  return (
    <div>
      {/* ── Hero ─────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(160deg, #080814 0%, #0e0e22 50%, #080814 100%)',
        position: 'relative', overflow: 'hidden', minHeight: 600,
        display: 'flex', alignItems: 'center',
      }}>
        {/* Decorative blobs */}
        <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', top:-200, right:-100, pointerEvents:'none' }} />
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(98,126,234,0.1) 0%, transparent 70%)', bottom:-100, left:50, pointerEvents:'none' }} />
        {/* Grid lines */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }} />

        <div className="container" style={{ position:'relative', zIndex:1, padding:'80px 24px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
            <div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 14px', borderRadius:100, border:'1px solid rgba(99,102,241,0.3)', background:'rgba(99,102,241,0.08)', fontSize:12, fontWeight:600, color:'var(--accent)', marginBottom:24, letterSpacing:0.5 }}>
                ⛓️ POWERED BY ETHEREUM SMART CONTRACTS
              </div>

              <h1 style={{ fontSize:'clamp(32px,5vw,60px)', fontWeight:800, lineHeight:1.1, marginBottom:20 }}>
                The Future of<br />
                <span style={{ background:'linear-gradient(135deg, var(--accent), var(--eth-light))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  Shopping is<br />Decentralized
                </span>
              </h1>

              <p style={{ fontSize:16, color:'var(--text2)', lineHeight:1.8, maxWidth:460, marginBottom:32 }}>
                Buy & sell products using ETH. No middlemen. Payments secured in smart contract escrow. Complete transparency on the blockchain.
              </p>

              <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:40 }}>
                <Link to="/products" className="btn btn-primary btn-lg">🛍️ Browse Shop</Link>
                {!account
                  ? <button onClick={connect} className="btn btn-eth btn-lg">🦊 Connect MetaMask</button>
                  : <Link to="/sell" className="btn btn-outline btn-lg">🏪 Start Selling</Link>
                }
              </div>

              {/* Contract address */}
              {mktAddr && (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:10, fontSize:12 }}>
                  <span style={{ color:'var(--text3)' }}>Contract:</span>
                  <span className="mono" style={{ color:'var(--accent)', letterSpacing:'0.5px' }}>{mktAddr}</span>
                  <span className="badge badge-green" style={{ fontSize:10 }}>Verified</span>
                </div>
              )}
            </div>

            {/* Right stats */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {[
                { icon:'📦', val: stats.totalProducts?.toLocaleString() || '10',    label:'Products Listed',    color:'var(--accent)' },
                { icon:'🔄', val: stats.totalOrders?.toLocaleString()   || '3,587',  label:'Orders Completed',   color:'var(--eth-light)' },
                { icon:'Ξ',  val: `${parseFloat(stats.totalVolumeEth||'68.4').toFixed(1)}`, label:'ETH Volume Traded', color:'var(--green)' },
                { icon:'👥', val: stats.uniqueBuyers?.toLocaleString()  || '1,204',  label:'Unique Buyers',      color:'var(--yellow)' },
              ].map(({ icon, val, label, color }, i) => (
                <div key={i} className="card" style={{ padding:20, textAlign:'center', border:'1px solid var(--border2)', animation:`fadeUp 0.5s ease ${i*0.1}s both` }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
                  <div style={{ fontSize:26, fontWeight:800, fontFamily:'var(--mono)', color, marginBottom:4 }}>{val}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <style>{`@media(max-width:768px){section>div>div{grid-template-columns:1fr !important} section>div>div>div:last-child{display:none !important}}`}</style>
      </section>

      {/* ── How it works ─────────────────────────── */}
      <section style={{ background:'var(--bg2)', padding:'64px 0', borderBottom:'1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <h2 style={{ fontSize:28, marginBottom:10 }}>How BlockShop Works</h2>
            <p style={{ color:'var(--text2)', fontSize:15 }}>Trustless commerce secured by Ethereum smart contracts</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
            {[
              { step:'01', icon:'🦊', title:'Connect Wallet',   desc:'Connect MetaMask or any Web3 wallet to get started. No signup, no email.' },
              { step:'02', icon:'🛍️', title:'Browse & Buy',    desc:'Browse products and pay with ETH. Funds go to smart contract escrow — not the seller.' },
              { step:'03', icon:'⛓️', title:'Escrow & Track',  desc:'Your ETH is locked in the smart contract. Seller ships. You track on-chain.' },
              { step:'04', icon:'✅', title:'Confirm & Release',desc:'Confirm delivery. Smart contract auto-releases funds to seller. Get BST rewards.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} style={{ textAlign:'center', padding:'24px 16px' }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(99,102,241,0.1)', border:'2px solid rgba(99,102,241,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, margin:'0 auto 14px' }}>{icon}</div>
                <div style={{ fontSize:11, color:'var(--accent)', fontWeight:700, letterSpacing:1, marginBottom:8 }}>STEP {step}</div>
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>{title}</h3>
                <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
        <style>{`@media(max-width:768px){section>div>div:last-child{grid-template-columns:repeat(2,1fr) !important}}`}</style>
      </section>

      {/* ── Categories ───────────────────────────── */}
      <section style={{ padding:'64px 0' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32 }}>
            <h2 style={{ fontSize:26 }}>Shop by Category</h2>
            <Link to="/products" className="btn btn-outline btn-sm">View All →</Link>
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {(categories.length ? categories : [
              { name:'Electronics', icon:'💻', count:5 }, { name:'Fashion', icon:'👗', count:2 },
              { name:'Furniture', icon:'🛋️', count:1 }, { name:'Beauty', icon:'💄', count:1 },
              { name:'Sports', icon:'⚽', count:1 }, { name:'Books', icon:'📚', count:1 },
            ]).map(cat => (
              <Link key={cat.name} to={`/products?category=${cat.name}`} style={{
                display:'flex', alignItems:'center', gap:10, padding:'12px 20px',
                borderRadius:100, background:'var(--bg3)', border:'1px solid var(--border)',
                fontSize:13, fontWeight:600, color:'var(--text)', transition:'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--bg3)'; }}
              >
                <span style={{ fontSize:18 }}>{cat.icon}</span>
                {cat.name}
                <span style={{ fontSize:11, color:'var(--text3)' }}>{cat.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ─────────────────────── */}
      <section style={{ padding:'0 0 64px', background:'var(--bg)' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32 }}>
            <div>
              <h2 style={{ fontSize:26, marginBottom:6 }}>Popular Products</h2>
              <p style={{ color:'var(--text2)', fontSize:14 }}>Prices in ETH • Secured by smart contracts</p>
            </div>
            <Link to="/products" className="btn btn-outline btn-sm">Browse All →</Link>
          </div>

          {loading ? (
            <div className="grid-4">
              {[...Array(8)].map((_,i) => (
                <div key={i} className="card">
                  <div className="skeleton" style={{ height:200 }} />
                  <div style={{ padding:16 }}>
                    <div className="skeleton" style={{ height:13, width:'40%', marginBottom:10 }} />
                    <div className="skeleton" style={{ height:16, width:'85%', marginBottom:10 }} />
                    <div className="skeleton" style={{ height:13, width:'60%', marginBottom:16 }} />
                    <div className="skeleton" style={{ height:36 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid-4">
              {products.map((p, i) => <ProductCard key={p.id} product={p} style={{ animationDelay: `${i * 0.05}s` }} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── BST Token Banner ─────────────────────── */}
      <section style={{ background:'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)', border:'1px solid rgba(99,102,241,0.2)', margin:'0 24px 64px', borderRadius:20, padding:'48px 40px', textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🪙</div>
        <h2 style={{ fontSize:28, marginBottom:12 }}>Earn BST Rewards on Every Purchase</h2>
        <p style={{ fontSize:15, color:'var(--text2)', maxWidth:500, margin:'0 auto 28px' }}>
          BlockShop Token (BST) is issued automatically on every completed order. Hold BST for platform governance and future benefits.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/products" className="btn btn-primary btn-lg">Start Earning BST</Link>
          {!account && <button onClick={connect} className="btn btn-eth btn-lg">🦊 Connect Wallet</button>}
        </div>
      </section>

      {/* ── Trust section ────────────────────────── */}
      <section style={{ background:'var(--bg2)', padding:'48px 0', borderTop:'1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display:'flex', justifyContent:'space-around', flexWrap:'wrap', gap:24 }}>
            {[
              { icon:'🔒', title:'Smart Contract Escrow',  sub:'Funds locked until delivery confirmed' },
              { icon:'⛓️', title:'100% On-Chain',          sub:'Every transaction recorded on Ethereum' },
              { icon:'👁️', title:'Full Transparency',      sub:'Verify any transaction on Etherscan' },
              { icon:'🤝', title:'No Middlemen',           sub:'2.5% platform fee — nothing hidden' },
            ].map(({ icon, title, sub }) => (
              <div key={title} style={{ display:'flex', alignItems:'center', gap:14, minWidth:200 }}>
                <div style={{ fontSize:28, flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14 }}>{title}</div>
                  <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
