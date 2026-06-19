/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";
import Policies from "./pages/Policies";
import SizingGuide from "./pages/SizingGuide";
import { Shield } from "lucide-react";
import Layout from "./components/Layout";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import { QuotaProvider } from "./context/QuotaContext";
import { QuotaBanner } from "./components/QuotaBanner";
import Wishlist from "./pages/Wishlist";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import OrderHistory from "./pages/OrderHistory";
import TrackOrder from "./pages/TrackOrder";
import NotFound from "./pages/NotFound";
import { AnalyticsTracker } from "./components/AnalyticsTracker";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

import { HelmetProvider } from "react-helmet-async";
import { Navigate } from "react-router-dom";
import { useState } from "react";
import { useSettings } from "./context/SettingsContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center text-white text-xs uppercase tracking-widest animate-pulse">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AccessControl({ children }: { children: React.ReactNode }) {
  const { settings, loading } = useSettings();
  const { user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen bg-brand-black flex items-center justify-center text-white text-xs uppercase tracking-widest animate-pulse">Initializing...</div>;
  }

  // Always allow access to admin and auth pages regardless of site access mode
  if (location.pathname === "/admin" || location.pathname === "/auth") {
    return <>{children}</>;
  }

  const SUPER_ADMINS = ["yamaan115@gmail.com", "avggod61@gmail.com", "agvgod61@gmail.com"];
  const isSuperAdmin = user?.email && SUPER_ADMINS.includes(user.email.toLowerCase());

  if (settings.siteAccess === "maintenance" && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-6 text-center text-white">
        <Shield size={64} className="text-brand-accent mb-8" />
        <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tighter mb-4 text-white">Under Maintenance</h1>
        <p className="text-brand-metallic text-sm uppercase tracking-widest max-w-xl leading-relaxed">
          {settings.siteName} is currently undergoing scheduled maintenance to improve your experience. Please check back later.
        </p>
      </div>
    );
  }

  if (settings.siteAccess === "members" && !user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function BlockedBarrier({ children }: { children: React.ReactNode }) {
  const { isBlocked } = useAuth();
  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 text-center">
        <Shield size={64} className="text-red-600 mb-8 animate-pulse" />
        <h1 className="text-4xl font-display font-bold uppercase tracking-tighter mb-4 text-white">IDENTITY QUARANTINED</h1>
        <p className="text-brand-metallic text-xs uppercase tracking-[0.2em] max-w-xl leading-relaxed">
          Your access has been terminated due to a critical violation of AVG security protocols. 
          Suspicious activities result in permanent identity revocation.
        </p>
        <div className="mt-12 h-px w-24 bg-red-600/30" />
        <p className="mt-4 text-[10px] text-red-600/50 uppercase font-mono">CODE: SECTOR_ACCESS_DENIED</p>
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BlockedBarrier>
          <QuotaProvider>
            <SettingsProvider>
              <WishlistProvider>
                <CartProvider>
                  <Router>
                    <ScrollToTop />
                    <AnalyticsTracker />
                    <QuotaBanner />
                    <AccessControl>
                      <Layout>
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/shop" element={<Shop />} />
                          <Route path="/product/:id" element={<ProductDetail />} />
                          <Route path="/checkout" element={<Checkout />} />
                          <Route path="/wishlist" element={<Wishlist />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                          <Route path="/policies" element={<Policies />} />
                          <Route path="/sizing" element={<SizingGuide />} />
                          <Route path="/auth" element={<Auth />} />
                          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                          <Route path="/order-history" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
                          <Route path="/track" element={<TrackOrder />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Layout>
                    </AccessControl>
                  </Router>
                </CartProvider>
              </WishlistProvider>
            </SettingsProvider>
          </QuotaProvider>
        </BlockedBarrier>
      </AuthProvider>
    </HelmetProvider>
  );
}
