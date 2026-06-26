import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { useCart } from '../context/CartContext';
import { shortenAddress } from '../utils/api';

export default function Navbar() {
  const { account, balance, bstBalance, connecting, connect, disconnect, blockchainOnline } = useWeb3();
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => { setMenuOpen(false); setDropOpen(false); }, [location]);

  useEffect(() => {
    const close = (e) => { if (!e.target.closest('.wallet-drop')) setDropOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) { navigate(`/products?search=${encodeURIComponent(search.trim())}`); setSearch(''); }
  };

  const navLinks = [['/', 'Home'], ['/products', 'Shop'], ['/sell', 'Sell'], ['/dashboard', 'Dashboard']];

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 1000,
      background: scrolled ? 'rgba(10,10,18,0.97)' : 'var(--bg)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      transition: 'all 0.3s',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64, gap: 16 }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>⛓️</div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>
            Block<span style={{ color: 'var(--accent)' }}>Shop</span>
          </span>
        </Link>

        {/* Blockchain status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px',
          borderRadius: 100, fontSize: 11, fontWeight: 600, flexShrink: 0,

          border: blockchainOnline ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(245,158,11,0.4)',
          color: blockchainOnline ? 'var(--green)' : 'var(--yellow)',
          background: blockchainOnline ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
        }} className="hide-mobile">
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
          {blockchainOnline ? 'On-chain' : 'Mock'}
        </div>

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', gap: 2 }} className="hide-mobile">
          {navLinks.map(([to, label]) => (
            <Link key={to} to={to} style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500,
              color: location.pathname === to ? 'var(--accent)' : 'var(--text2)',
              background: location.pathname === to ? 'rgba(99,102,241,0.1)' : 'transparent',
              transition: 'all 0.2s',
            }}>{label}</Link>
          ))}
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ flex: '1 1 260px', position: 'relative', maxWidth: 300 }} className="hide-mobile">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="form-control"
            style={{ paddingRight: 36, height: 38, fontSize: 13 }}
          />
          <button type="submit" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14 }}>🔍</button>
        </form>

        <div style={{ flex: 1 }} className="hide-mobile" />

        {/* Cart */}
        <Link to="/cart" style={{ position: 'relative', flexShrink: 0 }}>
          <button className="btn btn-ghost btn-icon">🛒
            {totalItems > 0 && (
              <span style={{ position: 'absolute', top: 2, right: 2, background: 'var(--accent)', color: '#fff', width: 17, height: 17, borderRadius: '50%', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{totalItems}</span>
            )}
          </button>
        </Link>

        {/* Wallet */}
        {account ? (
          <div style={{ position: 'relative', flexShrink: 0 }} className="wallet-drop">
            <button onClick={(e) => { e.stopPropagation(); setDropOpen(d => !d); }} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 10,
              background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#627eea)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{shortenAddress(account)}</span>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>▼</span>
            </button>

            {dropOpen && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 12, padding: 12, minWidth: 240, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', zIndex: 200 }}>
                <div style={{ padding: '8px 10px 12px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', marginBottom: 6, wordBreak: 'break-all' }}>{account}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                    <span style={{ color: 'var(--eth-light)' }}>Ξ {parseFloat(balance).toFixed(4)}</span>
                    <span style={{ color: 'var(--accent)' }}>{parseFloat(bstBalance).toFixed(1)} BST</span>
                  </div>
                </div>
                {[
                  ['/dashboard', '📊', 'Dashboard'],
                  ['/orders', '📦', 'My Orders'],
                  ['/sell', '🏪', 'Sell Products'],
                  ['/cart', '🛒', 'Cart'],
                ].map(([to, icon, label]) => (
                  <Link key={to} to={to} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, fontSize: 13, color: 'var(--text2)', transition: 'all 0.2s', textDecoration: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)'; }}
                  >{icon} {label}</Link>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8 }}>
                  <button onClick={disconnect} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, fontSize: 13, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>🔌 Disconnect</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button onClick={connect} disabled={connecting} className="btn btn-eth" style={{ fontSize: 13, padding: '8px 16px', flexShrink: 0 }}>
            {connecting ? '⏳…' : '🦊 Connect'}
          </button>
        )}

        {/* Mobile toggle */}
        <button onClick={() => setMenuOpen(m => !m)} className="btn btn-ghost btn-icon show-mobile">{menuOpen ? '✕' : '☰'}</button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <form onSubmit={handleSearch} style={{ marginBottom: 8 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="form-control" />
          </form>
          {navLinks.map(([to, label]) => (
            <Link key={to} to={to} style={{ padding: '10px 12px', borderRadius: 8, color: location.pathname === to ? 'var(--accent)' : 'var(--text2)', fontSize: 14, fontWeight: location.pathname === to ? 600 : 400 }}>{label}</Link>
          ))}
          <Link to="/orders" style={{ padding: '10px 12px', borderRadius: 8, color: 'var(--text2)', fontSize: 14 }}>📦 Orders</Link>
          <Link to="/cart" style={{ padding: '10px 12px', borderRadius: 8, color: 'var(--text2)', fontSize: 14 }}>🛒 Cart ({totalItems})</Link>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            {account ? (
              <>
                <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)', padding: '6px 12px', marginBottom: 4 }}>{shortenAddress(account)} · Ξ {parseFloat(balance).toFixed(4)}</div>
                <button onClick={disconnect} className="btn btn-danger btn-full">Disconnect Wallet</button>
              </>
            ) : (
              <button onClick={connect} disabled={connecting} className="btn btn-eth btn-full">{connecting ? '⏳ Connecting…' : '🦊 Connect MetaMask'}</button>
            )}
          </div>
        </div>
      )}

      <style>{`
        .hide-mobile { display: flex; }
        .show-mobile { display: none; }
        @media (max-width: 900px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
