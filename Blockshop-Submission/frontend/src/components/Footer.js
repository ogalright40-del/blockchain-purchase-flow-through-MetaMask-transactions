import React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { shortenAddress } from '../utils/api';

export default function Footer() {
  const { account, blockchainOnline, deployment } = useWeb3();
  const mktAddr = deployment?.contracts?.BlockShopMarketplace?.address;
  const tokenAddr = deployment?.contracts?.BlockShopToken?.address;

  return (
    <footer style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
      <div className="container" style={{ padding: '48px 24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, paddingBottom: 40, borderBottom: '1px solid var(--border)' }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⛓️</div>
              <span style={{ fontWeight: 700, fontSize: 17 }}>Block<span style={{ color: 'var(--accent)' }}>Shop</span></span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8, maxWidth: 260, marginBottom: 20 }}>
              The first fully decentralized marketplace. Buy and sell with ETH. No middlemen. Secured by smart contracts on Ethereum.
            </p>
            {/* Contract addresses */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: blockchainOnline ? 'var(--green)' : 'var(--yellow)', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{blockchainOnline ? 'Live on blockchain' : 'Mock mode'}</span>
              </div>
              {mktAddr && (
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  <span style={{ color: 'var(--text3)' }}>Marketplace: </span>
                  <span className="mono" style={{ color: 'var(--accent)', fontSize: 10 }}>{shortenAddress(mktAddr)}</span>
                </div>
              )}
              {tokenAddr && (
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  <span>BST Token: </span>
                  <span className="mono" style={{ color: 'var(--accent2)', fontSize: 10 }}>{shortenAddress(tokenAddr)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Shop</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['All Products', '/products'], ['Electronics', '/products?category=Electronics'], ['Fashion', '/products?category=Fashion'], ['Best Sellers', '/products?sort=popular'], ['New Arrivals', '/products?sort=newest']].map(([l, to]) => (
                <li key={l}><Link to={to} style={{ fontSize: 13, color: 'var(--text2)', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--accent)'} onMouseLeave={e => e.target.style.color = 'var(--text2)'}>{l}</Link></li>
              ))}
            </ul>
          </div>

          {/* Blockchain */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Blockchain</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['Smart Contracts', '/contracts'], ['How It Works', '/how-it-works'], ['BST Token', '/token'], ['Dispute System', '/disputes'], ['Become a Seller', '/sell']].map(([l, to]) => (
                <li key={l}><Link to={to} style={{ fontSize: 13, color: 'var(--text2)', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--accent)'} onMouseLeave={e => e.target.style.color = 'var(--text2)'}>{l}</Link></li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Account</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(account ? [['Dashboard', '/dashboard'], ['My Orders', '/orders'], ['My Products', '/sell'], ['Cart', '/cart']] : [['Connect Wallet', '#'], ['Browse Shop', '/products']]).map(([l, to]) => (
                <li key={l}><Link to={to} style={{ fontSize: 13, color: 'var(--text2)', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--accent)'} onMouseLeave={e => e.target.style.color = 'var(--text2)'}>{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>© 2024 BlockShop. Powered by Ethereum. No cookies, no tracking, no middlemen.</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {['🔒 Audited', '⛓️ Ethereum', '🦊 MetaMask'].map(t => (
              <span key={t} style={{ fontSize: 11, color: 'var(--text3)', padding: '3px 8px', border: '1px solid var(--border)', borderRadius: 6 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){footer .container>div:first-child{grid-template-columns:1fr 1fr !important}}`}</style>
    </footer>
  );
}
