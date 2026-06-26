import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blockchainAPI, productsAPI, shortenAddress, ORDER_STATUS } from '../utils/api';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

export default function Dashboard() {
  const { account, balance, bstBalance, connect, blockchainOnline, deployment, network } = useWeb3();
  const [orders, setOrders]       = useState([]);
  const [stats, setStats]         = useState(null);
  const [products, setProducts]   = useState({});
  const [withdrawal, setWithdrawal] = useState('0');
  const [loading, setLoading]     = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const { getMarketplace } = useWeb3();

  useEffect(() => {
    blockchainAPI.getStats().then(r => setStats(r.data.stats)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!account) { setLoading(false); return; }
    Promise.all([
      blockchainAPI.getOrders(account),
      blockchainAPI.getWithdrawal(account),
    ]).then(async ([ordRes, wdRes]) => {
      const ords = (ordRes.data.orders || []).reverse().slice(0, 5);
      setOrders(ords);
      setWithdrawal(wdRes.data.pending || '0');
      const ids = [...new Set(ords.map(o => o.productId))];
      const prods = {};
      await Promise.all(ids.map(id => productsAPI.getById(id).then(r => { prods[id] = r.data.product; }).catch(() => {})));
      setProducts(prods);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [account]);

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const contract = await getMarketplace();
      const tx = await contract.withdrawFunds();
      await tx.wait();
      setWithdrawal('0');
      const { toast } = await import('react-hot-toast');
      toast.success('Withdrawal successful!');
    } catch (err) {
      const { toast } = await import('react-hot-toast');
      toast.error(err.reason || err.message || 'Withdrawal failed');
    } finally { setWithdrawing(false); }
  };

  if (!account) return (
    <div className="container" style={{ padding:'80px 24px' }}>
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <h3>Connect Your Wallet</h3>
        <p style={{ color:'var(--text2)' }}>Connect MetaMask to view your BlockShop dashboard</p>
        <button onClick={connect} className="btn btn-eth btn-lg" style={{ marginTop:8 }}>🦊 Connect MetaMask</button>
      </div>
    </div>
  );

  const mktAddr   = deployment?.contracts?.BlockShopMarketplace?.address;
  const tokenAddr = deployment?.contracts?.BlockShopToken?.address;

  return (
    <div className="container" style={{ padding:'32px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:28, marginBottom:4 }}>Dashboard</h1>
          <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'var(--text2)' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background: blockchainOnline ? 'var(--green)' : 'var(--yellow)' }} />
            {blockchainOnline ? `Connected · ${network?.name || 'Ganache Local'} (Chain ${network?.chainId || 1337})` : 'Mock Mode — Connect blockchain for live data'}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Link to="/products" className="btn btn-outline btn-sm">🛍️ Shop</Link>
          <Link to="/sell" className="btn btn-primary btn-sm">+ List Product</Link>
        </div>
      </div>

      {/* Wallet Card */}
      <div style={{ background:'linear-gradient(135deg, #0f0f2a 0%, #1a1040 100%)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:16, padding:24, marginBottom:24, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20 }}>
        <div>
          <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Wallet Address</div>
          <div className="mono" style={{ fontSize:13, color:'var(--text2)', wordBreak:'break-all' }}>{account}</div>
        </div>
        <div>
          <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>ETH Balance</div>
          <div className="eth-price" style={{ fontSize:26, fontWeight:800 }}>{parseFloat(balance).toFixed(4)}</div>
        </div>
        <div>
          <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>BST Rewards</div>
          <div style={{ fontSize:26, fontWeight:800, color:'var(--accent)' }}>{parseFloat(bstBalance).toFixed(2)}</div>
          <div style={{ fontSize:11, color:'var(--text3)' }}>BlockShop Token</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:24, marginBottom:24 }}>
        {/* Platform Stats */}
        <div>
          <h2 style={{ fontSize:18, marginBottom:16 }}>Platform Stats</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[
              { icon:'📦', label:'Total Products',    val: stats?.totalProducts || '—',   color:'var(--accent)' },
              { icon:'🔄', label:'Total Orders',       val: stats?.totalOrders   || '—',   color:'var(--eth-light)' },
              { icon:'Ξ',  label:'Volume (ETH)',       val: stats?.totalVolumeEth ? `${parseFloat(stats.totalVolumeEth).toFixed(1)}` : '—', color:'var(--green)' },
              { icon:'👥', label:'Unique Buyers',      val: stats?.uniqueBuyers  || '—',   color:'var(--yellow)' },
            ].map(({ icon, label, val, color }) => (
              <div key={label} className="card" style={{ padding:'18px 20px' }}>
                <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
                <div style={{ fontSize:22, fontWeight:800, fontFamily:'var(--mono)', color, marginBottom:2 }}>{val}</div>
                <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Seller Withdrawal */}
        <div>
          <h2 style={{ fontSize:18, marginBottom:16 }}>Seller Earnings</h2>
          <div className="card" style={{ padding:20, textAlign:'center' }}>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>Pending Withdrawal</div>
            <div className="eth-price" style={{ fontSize:28, fontWeight:800, marginBottom:16 }}>{parseFloat(withdrawal).toFixed(4)}</div>
            {parseFloat(withdrawal) > 0 ? (
              <button onClick={handleWithdraw} disabled={!blockchainOnline || withdrawing} className="btn btn-green btn-full">
                {withdrawing ? '⏳ Withdrawing…' : '💸 Withdraw ETH'}
              </button>
            ) : (
              <p style={{ fontSize:13, color:'var(--text3)' }}>No pending earnings</p>
            )}
            <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid var(--border)', fontSize:12, color:'var(--text3)', lineHeight:1.7 }}>
              Earnings accumulate as buyers confirm deliveries. Withdraw anytime.
            </div>
          </div>
        </div>
      </div>

      {/* Contracts */}
      {(mktAddr || tokenAddr) && (
        <div className="chain-box" style={{ marginBottom:24 }}>
          <h3 style={{ fontSize:16, marginBottom:14 }}>⛓️ Deployed Contracts</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {mktAddr && (
              <div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Marketplace</div>
                <div className="mono" style={{ fontSize:12, color:'var(--accent)', wordBreak:'break-all' }}>{mktAddr}</div>
              </div>
            )}
            {tokenAddr && (
              <div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>BST Token</div>
                <div className="mono" style={{ fontSize:12, color:'var(--accent2)', wordBreak:'break-all' }}>{tokenAddr}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h2 style={{ fontSize:18 }}>Recent Orders</h2>
          <Link to="/orders" className="btn btn-ghost btn-sm">View All →</Link>
        </div>
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:70, borderRadius:10 }} />)}
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding:'32px', textAlign:'center', color:'var(--text3)', border:'1px dashed var(--border)', borderRadius:12 }}>
            No orders yet. <Link to="/products" style={{ color:'var(--accent)' }}>Start shopping →</Link>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {orders.map(order => {
              const si = ORDER_STATUS[order.status] || ORDER_STATUS[0];
              const prod = products[order.productId];
              return (
                <div key={order.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:12 }}>
                  {prod?.imageURI && <img src={prod.imageURI} alt="" style={{ width:48, height:48, objectFit:'cover', borderRadius:8 }} onError={e => e.target.style.display='none'} />}
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>Order #{order.id} · {prod?.name || `Product #${order.productId}`}</div>
                    <div style={{ fontSize:12, color:'var(--text3)' }}>Qty: {order.quantity} · {order.createdAt ? new Date(order.createdAt*1000).toLocaleDateString() : '—'}</div>
                  </div>
                  <span style={{ padding:'3px 10px', borderRadius:100, fontSize:12, fontWeight:600, background:`${si.color}18`, color:si.color }}>{si.label}</span>
                  <div className="eth-price" style={{ fontSize:15, fontWeight:700 }}>{parseFloat(order.totalPaid||0).toFixed(4)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@media(max-width:768px){
        div[style*="grid-template-columns: 2fr 1fr"]{grid-template-columns:1fr !important}
        div[style*="grid-template-columns: 1fr 1fr 1fr"]{grid-template-columns:1fr !important}
      }`}</style>
    </div>
  );
}
