import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { blockchainAPI, productsAPI, shortenAddress, ORDER_STATUS } from '../utils/api';
import { useWeb3 } from '../context/Web3Context';
import toast from 'react-hot-toast';

export default function Orders() {
  const { account, connect, getMarketplace, blockchainOnline } = useWeb3();
  const [orders, setOrders]         = useState([]);
  const [products, setProducts]     = useState({});
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setAction]  = useState(null);

  useEffect(() => {
    if (!account) { setLoading(false); return; }
    blockchainAPI.getOrders(account)
      .then(async r => {
        const ords = r.data.orders || [];
        setOrders(ords.reverse());
        // Load product info for each unique product
        const ids = [...new Set(ords.map(o => o.productId))];
        const prods = {};
        await Promise.all(ids.map(id =>
          productsAPI.getById(id).then(res => { prods[id] = res.data.product; }).catch(() => {})
        ));
        setProducts(prods);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [account]);

  const handleConfirmDelivery = async (orderId) => {
    if (!blockchainOnline) { toast.error('Blockchain not connected'); return; }
    setAction(orderId);
    const tid = toast.loading('Confirming delivery on-chain…');
    try {
      const contract = await getMarketplace();
      const tx = await contract.confirmDelivery(orderId);
      await tx.wait();
      toast.success('✅ Delivery confirmed! Funds released to seller.', { id: tid });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 4 } : o));
    } catch (err) {
      toast.error(err.reason || err.message || 'Failed', { id: tid });
    } finally { setAction(null); }
  };

  const handleCancel = async (orderId) => {
    if (!blockchainOnline) { toast.error('Blockchain not connected'); return; }
    if (!window.confirm('Cancel this order? Your ETH will be refunded.')) return;
    setAction(orderId);
    const tid = toast.loading('Cancelling order…');
    try {
      const contract = await getMarketplace();
      const tx = await contract.cancelOrder(orderId);
      await tx.wait();
      toast.success('Order cancelled. ETH refunded.', { id: tid });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 5 } : o));
    } catch (err) {
      toast.error(err.reason || err.message || 'Failed', { id: tid });
    } finally { setAction(null); }
  };

  const handleDispute = async (orderId) => {
    if (!blockchainOnline) { toast.error('Blockchain not connected'); return; }
    if (!window.confirm('Raise a dispute? Admin will review and resolve.')) return;
    setAction(orderId);
    const tid = toast.loading('Raising dispute on-chain…');
    try {
      const contract = await getMarketplace();
      const tx = await contract.raiseDispute(orderId);
      await tx.wait();
      toast.success('Dispute raised. Admin will review.', { id: tid });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 6 } : o));
    } catch (err) {
      toast.error(err.reason || err.message || 'Failed', { id: tid });
    } finally { setAction(null); }
  };

  if (!account) return (
    <div className="container" style={{ padding:'80px 24px' }}>
      <div className="empty-state">
        <div className="empty-icon">🦊</div>
        <h3>Connect Your Wallet</h3>
        <p style={{ color:'var(--text2)' }}>Connect MetaMask to view your on-chain orders</p>
        <button onClick={connect} className="btn btn-eth btn-lg" style={{ marginTop:8 }}>Connect MetaMask</button>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ padding:'32px 24px', maxWidth:900 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:28, marginBottom:6 }}>My Orders</h1>
          <p style={{ color:'var(--text2)', fontSize:14 }}>
            Wallet: <span className="mono" style={{ fontSize:13 }}>{account}</span>
          </p>
        </div>
        {!blockchainOnline && (
          <span className="badge badge-yellow">⚠️ Mock Mode — No real orders</span>
        )}
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:110, borderRadius:12 }} />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No orders yet</h3>
          <p style={{ color:'var(--text2)' }}>
            {blockchainOnline
              ? 'Your on-chain orders will appear here after purchase'
              : 'Connect to blockchain to see real orders'}
          </p>
          <Link to="/products" className="btn btn-primary" style={{ marginTop:8 }}>Browse Shop</Link>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {orders.map(order => {
            const statusInfo = ORDER_STATUS[order.status] || ORDER_STATUS[0];
            const prod = products[order.productId];
            const isLoading = actionLoading === order.id;
            return (
              <div key={order.id} className="card" style={{ padding:20 }}>
                <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                  {prod?.imageURI && (
                    <Link to={`/products/${order.productId}`}>
                      <img src={prod.imageURI} alt="" style={{ width:72, height:72, objectFit:'cover', borderRadius:10, flexShrink:0 }} onError={e => e.target.style.display='none'} />
                    </Link>
                  )}
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div>
                        <span style={{ fontWeight:700, fontSize:15, marginRight:10 }}>Order #{order.id}</span>
                        <span className="badge" style={{ background:`${statusInfo.color}20`, color:statusInfo.color, border:`1px solid ${statusInfo.color}40` }}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="eth-price" style={{ fontSize:16, fontWeight:700 }}>{parseFloat(order.totalPaid || 0).toFixed(4)}</div>
                    </div>

                    {prod && <div style={{ fontSize:14, fontWeight:500, marginBottom:4 }}>{prod.name}</div>}
                    <div style={{ fontSize:12, color:'var(--text3)', marginBottom:6 }}>
                      Product #{order.productId} · Qty: {order.quantity} ·
                      {order.createdAt && ` ${new Date(order.createdAt * 1000).toLocaleDateString()}`}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text2)', marginBottom:10 }}>{statusInfo.desc}</div>

                    {/* Seller */}
                    <div style={{ fontSize:11, color:'var(--text3)' }}>
                      Seller: <span className="mono">{shortenAddress(order.seller)}</span>
                    </div>

                    {/* Actions */}
                    <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap' }}>
                      {order.status === 2 && (  // Shipped — can confirm or dispute
                        <>
                          <button onClick={() => handleConfirmDelivery(order.id)} disabled={isLoading} className="btn btn-green btn-sm">
                            {isLoading ? '⏳…' : '✅ Confirm Delivery'}
                          </button>
                          <button onClick={() => handleDispute(order.id)} disabled={isLoading} className="btn btn-danger btn-sm">
                            {isLoading ? '⏳…' : '⚠️ Raise Dispute'}
                          </button>
                        </>
                      )}
                      {order.status === 1 && (  // Processing — can dispute
                        <button onClick={() => handleDispute(order.id)} disabled={isLoading} className="btn btn-danger btn-sm">
                          {isLoading ? '⏳…' : '⚠️ Raise Dispute'}
                        </button>
                      )}
                      {order.status === 0 && (  // Pending — can cancel
                        <button onClick={() => handleCancel(order.id)} disabled={isLoading} className="btn btn-danger btn-sm">
                          {isLoading ? '⏳…' : '❌ Cancel Order'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
