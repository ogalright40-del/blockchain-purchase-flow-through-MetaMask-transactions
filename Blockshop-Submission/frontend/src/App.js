import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Web3Provider } from './context/Web3Context';
import { CartProvider } from './context/CartContext';
import React, { useEffect, useState } from 'react';
import Navbar        from './components/Navbar';
import Footer        from './components/Footer';
import Home          from './pages/Home';
import Products      from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart          from './pages/Cart';
import Orders        from './pages/Orders';
import Sell          from './pages/Sell';
import Dashboard     from './pages/Dashboard';
import Checkout       from './pages/Checkout/Checkout';
import OrderDetail    from './pages/Orders/OrderDetail';
import Profile        from './pages/Profile/Profile';
import Notifications  from './pages/Notifications';

import { AdminProducts } from './pages/Admin/Products';
import { AdminUsers }    from './pages/Admin/Users';
import { AdminStats }    from './pages/Admin/Stats';

import './index.css';

function NotFound() {
  return (
    <div className="container" style={{ padding: '100px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>⛓️</div>
      <h1 style={{ fontSize: 48, marginBottom: 12 }}>404</h1>
      <p style={{ color: 'var(--text2)', fontSize: 18, marginBottom: 28 }}>This block doesn't exist on-chain</p>
      <Link to="/" className="btn btn-primary btn-lg">← Back to Home</Link>
    </div>
  );
}

function AppLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/"             element={<Home />} />
          <Route path="/products"     element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart"         element={<Cart />} />
          <Route path="/orders"       element={<Orders />} />
          <Route path="/sell"         element={<Sell />} />
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="*"             element={<NotFound />} />

          <Route path="/checkout"     element={<Checkout />} />
          {/* <Route path="/orders"       element={<Orders />} /> */}
          <Route path="/orders/:id"   element={<OrderDetail />} />
          <Route path="/profile"      element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/users"  element={<AdminUsers />} />
          <Route path="/admin/stats"  element={<AdminStats />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  const [backendStatus, setBackendStatus] = useState("loading");

  useEffect(() => {
  fetch("http://localhost:5001/health")
      .then((res) => {
        if (res.ok) {
          setBackendStatus("connected");
        } else {
          setBackendStatus("error");
        }
      })
      .catch(() => {
        setBackendStatus("error");
      });
  }, []);

  // 🔄 Loading state
  if (backendStatus === "loading") {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>⏳ Checking backend connection...</h2>
      </div>
    );
  }

  // ❌ Error state (backend not running)
  if (backendStatus === "error") {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h1>❌ Connection Error</h1>
        <p>Backend is not running on http://localhost:5000</p>
      </div>
    );
  }

  // ✅ Backend OK → run app normally
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Web3Provider>
        <CartProvider>
          <AppLayout />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a2e',
                color: '#e8e8f0',
                border: '1px solid #2a2a45',
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '13px',
                borderRadius: '10px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              loading: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
            }}
          />
        </CartProvider>
      </Web3Provider>
    </Router>
  );
}
