import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { shortenAddress } from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Electronics', 'Fashion', 'Furniture', 'Beauty', 'Sports', 'Books', 'Food', 'Gaming', 'Other'];

export default function Sell() {
  const { account, connect, getMarketplace, blockchainOnline } = useWeb3();
  const [step, setStep]       = useState('register'); // register | list | success
  const [listing, setListing] = useState(false);
  const [lastTx, setLastTx]   = useState(null);
  const [lastProductId, setLastProductId] = useState(null);

  const [sellerForm, setSellerForm] = useState({ name: '', bio: '' });
  const [form, setForm] = useState({
    name: '', description: '', imageURI: '', category: 'Electronics',
    priceEth: '', stock: 1,
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!account) { connect(); return; }
    if (!blockchainOnline) { toast.error('Blockchain not connected. Start Ganache.'); return; }
    if (!sellerForm.name.trim()) { toast.error('Name required'); return; }

    setListing(true);
    const tid = toast.loading('Registering seller on-chain…');
    try {
      const contract = await getMarketplace();
      const tx = await contract.registerSeller(sellerForm.name.trim(), sellerForm.bio.trim());
      await tx.wait();
      toast.success('✅ Registered as seller!', { id: tid });
      setStep('list');
    } catch (err) {
      const msg = err.reason || err.message || '';
      if (msg.includes('Already registered')) { toast.success('Already registered — proceed to list!', { id: tid }); setStep('list'); }
      else toast.error(msg.slice(0, 80) || 'Failed', { id: tid });
    } finally { setListing(false); }
  };

  const handleList = async (e) => {
    e.preventDefault();
    if (!account) { connect(); return; }
    if (!blockchainOnline) { toast.error('Blockchain not connected. Start Ganache.'); return; }
    if (!form.name || !form.description || !form.priceEth || !form.imageURI) { toast.error('Fill all required fields'); return; }

    setListing(true);
    const tid = toast.loading('Listing product on-chain…');
    try {
      const contract = await getMarketplace();
      const priceWei = ethers.parseEther(form.priceEth);
      const tx = await contract.listProduct(
        form.name.trim(), form.description.trim(), form.imageURI.trim(),
        form.category, priceWei, parseInt(form.stock)
      );
      const receipt = await tx.wait();
      setLastTx(receipt.hash);

      // Get productId from event
      const iface = contract.interface;
      const log = receipt.logs.find(l => { try { return iface.parseLog(l)?.name === 'ProductListed'; } catch { return false; } });
      if (log) {
        const parsed = iface.parseLog(log);
        setLastProductId(Number(parsed.args[0]));
      }

      toast.success('🎉 Product listed on-chain!', { id: tid });
      setStep('success');
      setForm({ name:'', description:'', imageURI:'', category:'Electronics', priceEth:'', stock:1 });
    } catch (err) {
      toast.error((err.reason || err.message || 'Failed').slice(0, 80), { id: tid });
    } finally { setListing(false); }
  };

  if (!account) return (
    <div className="container" style={{ padding:'80px 24px' }}>
      <div className="empty-state">
        <div className="empty-icon">🏪</div>
        <h3>Start Selling on BlockShop</h3>
        <p style={{ color:'var(--text2)', maxWidth:400 }}>Connect your wallet to list products directly on the Ethereum blockchain. No setup fees — only 2.5% on sales.</p>
        <button onClick={connect} className="btn btn-eth btn-lg" style={{ marginTop:8 }}>🦊 Connect MetaMask</button>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ padding:'40px 24px', maxWidth:700 }}>
      <h1 style={{ fontSize:28, marginBottom:8 }}>Sell on BlockShop</h1>
      <p style={{ color:'var(--text2)', marginBottom:32, fontSize:15 }}>List your products directly on Ethereum. Payments held in escrow, released on delivery.</p>

      {/* Progress */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:40 }}>
        {['Register as Seller', 'List Product', 'Live on Chain'].map((s, i) => (
          <React.Fragment key={s}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, background: (step === 'register' && i===0) || (step === 'list' && i<=1) || (step === 'success') ? 'var(--accent)' : 'var(--bg3)', color: (step === 'register' && i===0) || (step === 'list' && i<=1) || (step === 'success') ? '#fff' : 'var(--text3)', border:`2px solid ${(step === 'register' && i===0)||(step === 'list' && i<=1)||(step==='success') ? 'var(--accent)' : 'var(--border2)'}`, transition:'all 0.3s' }}>
                {((step === 'list' && i===0)||(step === 'success' && i<=1)) ? '✓' : i+1}
              </div>
              <span style={{ fontSize:11, color:'var(--text3)', whiteSpace:'nowrap' }}>{s}</span>
            </div>
            {i < 2 && <div style={{ flex:1, height:2, background: (step === 'list' && i===0) || (step === 'success') ? 'var(--accent)' : 'var(--border)', margin:'0 8px', marginTop:-16, transition:'background 0.3s' }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Seller info */}
      <div style={{ padding:'12px 14px', background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:10, marginBottom:28, fontSize:13 }}>
        Seller wallet: <span className="mono" style={{ color:'var(--accent)' }}>{account}</span>
        {!blockchainOnline && <span className="badge badge-yellow" style={{ marginLeft:10 }}>Mock Mode</span>}
      </div>

      {/* Step 1: Register */}
      {step === 'register' && (
        <div className="card" style={{ padding:28 }}>
          <h2 style={{ fontSize:20, marginBottom:6 }}>Step 1: Register as Seller</h2>
          <p style={{ color:'var(--text2)', fontSize:13, marginBottom:22 }}>This creates your seller profile on-chain. One-time, no fee.</p>
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Store / Seller Name *</label>
              <input value={sellerForm.name} onChange={e => setSellerForm(p=>({...p,name:e.target.value}))} className="form-control" placeholder="e.g. TechMart Pro" required />
            </div>
            <div className="form-group">
              <label>Bio / Description</label>
              <textarea value={sellerForm.bio} onChange={e => setSellerForm(p=>({...p,bio:e.target.value}))} className="form-control" rows={3} placeholder="Tell buyers about your store…" />
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <button type="submit" disabled={listing} className="btn btn-primary" style={{ flex:1 }}>
                {listing ? '⏳ Registering…' : '⛓️ Register On-Chain'}
              </button>
              <button type="button" onClick={() => setStep('list')} className="btn btn-ghost">Skip (already registered)</button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: List */}
      {step === 'list' && (
        <div className="card" style={{ padding:28 }}>
          <h2 style={{ fontSize:20, marginBottom:6 }}>Step 2: List a Product</h2>
          <p style={{ color:'var(--text2)', fontSize:13, marginBottom:22 }}>Your product will be stored on the Ethereum blockchain.</p>
          <form onSubmit={handleList}>
            <div className="form-group">
              <label>Product Name *</label>
              <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className="form-control" placeholder="e.g. MacBook Pro M3" required />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} className="form-control" rows={3} placeholder="Describe your product…" required />
            </div>
            <div className="form-group">
              <label>Image URL *</label>
              <input value={form.imageURI} onChange={e=>setForm(p=>({...p,imageURI:e.target.value}))} className="form-control" placeholder="https://example.com/image.jpg or IPFS URI" required />
              {form.imageURI && <img src={form.imageURI} alt="preview" style={{ width:80, height:80, objectFit:'cover', borderRadius:8, marginTop:8, border:'1px solid var(--border)' }} onError={e=>e.target.style.display='none'} />}
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Category *</label>
                <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} className="form-control">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Stock (units) *</label>
                <input type="number" value={form.stock} onChange={e=>setForm(p=>({...p,stock:e.target.value}))} className="form-control" min={1} required />
              </div>
            </div>
            <div className="form-group">
              <label>Price (ETH) *</label>
              <input type="number" value={form.priceEth} onChange={e=>setForm(p=>({...p,priceEth:e.target.value}))} className="form-control" placeholder="e.g. 0.05" step="0.0001" min="0.0001" required />
              {form.priceEth && <div style={{ fontSize:12, color:'var(--text3)', marginTop:5 }}>= {form.priceEth} ETH = {ethers.parseEther(form.priceEth||'0').toString()} wei</div>}
            </div>
            <button type="submit" disabled={listing} className="btn btn-primary btn-full btn-lg">
              {listing ? '⏳ Listing on Blockchain…' : '⛓️ List Product On-Chain'}
            </button>
          </form>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 'success' && (
        <div className="card" style={{ padding:32, textAlign:'center' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
          <h2 style={{ fontSize:24, marginBottom:10 }}>Product Listed On-Chain!</h2>
          <p style={{ color:'var(--text2)', marginBottom:20 }}>Your product is now live on the Ethereum blockchain and visible to all buyers.</p>
          {lastProductId && <div style={{ fontSize:14, color:'var(--accent)', marginBottom:10 }}>Product ID: #{lastProductId}</div>}
          {lastTx && <div className="mono" style={{ fontSize:11, color:'var(--text3)', wordBreak:'break-all', marginBottom:20 }}>Tx: {lastTx}</div>}
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => setStep('list')} className="btn btn-primary">List Another</button>
            {lastProductId && <a href={`/products/${lastProductId}`} className="btn btn-outline">View Product</a>}
          </div>
        </div>
      )}
    </div>
  );
}
