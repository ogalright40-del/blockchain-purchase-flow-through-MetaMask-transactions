import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsAPI } from '../utils/api';
import ProductCard from '../components/ProductCard';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search:   searchParams.get('search')   || '',
    sort:     searchParams.get('sort')     || '',
    minEth:   '',
    maxEth:   '',
  });

  useEffect(() => { productsAPI.getCategories().then(r => setCategories(r.data.categories || [])).catch(() => {}); }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) };
      const r = await productsAPI.getAll(params);
      setProducts(r.data.products || []);
      setPagination(r.data.pagination || {});
    } catch {}
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const set = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(1); };
  const clear = () => { setFilters({ category:'', search:'', sort:'', minEth:'', maxEth:'' }); setPage(1); };
  const activeCount = Object.values(filters).filter(v => v).length;

  return (
    <div className="container" style={{ padding:'32px 24px' }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:28, marginBottom:6 }}>
          {filters.search ? `"${filters.search}"` : filters.category || 'All Products'}
        </h1>
        <p style={{ color:'var(--text2)', fontSize:14 }}>{pagination.total || 0} products · Prices in ETH</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', gap:28, alignItems:'start' }}>
        {/* Sidebar */}
        <aside style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:20, position:'sticky', top:80 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <h3 style={{ fontSize:15 }}>Filters</h3>
            {activeCount > 0 && <button onClick={clear} style={{ fontSize:12, color:'var(--accent)', background:'none', border:'none', cursor:'pointer' }}>Clear ({activeCount})</button>}
          </div>

          {/* Category */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:10 }}>Category</div>
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              {[{ name:'', icon:'🌐', label:'All Categories' }, ...categories.map(c => ({ name:c.name, icon:c.icon, label:c.name, count:c.count }))].map(({ name, icon, label, count }) => (
                <button key={name} onClick={() => set('category', name)} style={{ textAlign:'left', padding:'8px 10px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, background: filters.category === name ? 'rgba(99,102,241,0.12)' : 'transparent', color: filters.category === name ? 'var(--accent)' : 'var(--text2)', fontWeight: filters.category === name ? 600 : 400, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, transition:'all 0.15s' }}>
                  <span>{icon} {label}</span>
                  {count && <span style={{ fontSize:11, color:'var(--text3)' }}>{count}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:10 }}>Price Range (ETH)</div>
            <div style={{ display:'flex', gap:8 }}>
              <input type="number" placeholder="Min" value={filters.minEth} onChange={e => set('minEth', e.target.value)} className="form-control" style={{ padding:'8px 10px', fontSize:13 }} step="0.001" min="0" />
              <input type="number" placeholder="Max" value={filters.maxEth} onChange={e => set('maxEth', e.target.value)} className="form-control" style={{ padding:'8px 10px', fontSize:13 }} step="0.001" min="0" />
            </div>
          </div>

          {/* Info */}
          <div style={{ padding:'12px', background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:9, fontSize:12, color:'var(--text2)', lineHeight:1.6 }}>
            ⛓️ All prices are in ETH. Payment is processed on-chain via smart contract escrow.
          </div>
        </aside>

        {/* Products */}
        <div>
          {/* Sort / controls bar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {filters.category && (
                <span style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 12px', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:100, fontSize:12, color:'var(--accent)' }}>
                  {filters.category}
                  <button onClick={() => set('category', '')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--accent)', fontSize:14 }}>✕</button>
                </span>
              )}
            </div>
            <select value={filters.sort} onChange={e => set('sort', e.target.value)} className="form-control" style={{ width:'auto', padding:'8px 32px 8px 12px', fontSize:13 }}>
              <option value="">Sort: Default</option>
              <option value="popular">Most Popular</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="rating">Best Rated</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          {loading ? (
            <div className="grid-3">
              {[...Array(9)].map((_,i) => (
                <div key={i} className="card">
                  <div className="skeleton" style={{ height:200 }} />
                  <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
                    <div className="skeleton" style={{ height:12, width:'40%' }} />
                    <div className="skeleton" style={{ height:16, width:'85%' }} />
                    <div className="skeleton" style={{ height:36 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No products found</h3>
              <p style={{ color:'var(--text2)' }}>Try adjusting your filters or search terms</p>
              <button onClick={clear} className="btn btn-primary" style={{ marginTop:8 }}>Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid-3">
                {products.map((p, i) => <ProductCard key={p.id} product={p} style={{ animationDelay:`${i*0.04}s` }} />)}
              </div>

              {pagination.pages > 1 && (
                <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:40 }}>
                  <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="btn btn-outline btn-sm">← Prev</button>
                  {[...Array(Math.min(pagination.pages,7))].map((_,i) => (
                    <button key={i+1} onClick={() => setPage(i+1)} className={`btn btn-sm ${page===i+1?'btn-primary':'btn-outline'}`}>{i+1}</button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(pagination.pages,p+1))} disabled={page===pagination.pages} className="btn btn-outline btn-sm">Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`@media(max-width:768px){div[style*="grid-template-columns: 240px"]{grid-template-columns:1fr !important} aside{position:static !important}}`}</style>
    </div>
  );
}
