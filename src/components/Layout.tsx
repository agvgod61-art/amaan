import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X, Heart, User, LogOut, Instagram, Youtube } from "lucide-react";
import { useState, useEffect } from "react";
import React from "react";
import { cn } from "../lib/utils";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import BackToTop from "./BackToTop";
import StorageImage from './StorageImage';

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus("loading");
    // Simulate API call
    setTimeout(() => {
      setStatus("success");
      setEmail("");
      setTimeout(() => setStatus("idle"), 3000);
    }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {status === "success" && (
        <p className="text-brand-metallic text-sm mb-4">
          Welcome to the crew. Stay tuned for updates.
        </p>
      )}
      <div className="flex">
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="EMAIL ADDRESS" 
          required
          disabled={status === "loading" || status === "success"}
          className="bg-brand-black border border-white/10 px-4 py-3 w-full text-xs uppercase tracking-widest focus:outline-none focus:border-brand-accent/50 text-white placeholder-brand-metallic/50 disabled:opacity-50"
        />
        <button 
          type="submit"
          disabled={status === "loading" || status === "success"}
          className={cn(
            "text-brand-black px-6 py-3 text-xs uppercase font-bold tracking-widest transition-colors",
            status === "success" ? "bg-green-500 text-white" : "bg-white hover:bg-gray-200",
            (status === "loading" || status === "success") && "opacity-80 cursor-not-allowed"
          )}
        >
          {status === "loading" ? "..." : status === "success" ? "✓" : "Join"}
        </button>
      </div>
    </form>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { totalItems } = useCart();
  const { totalWishlistItems } = useWishlist();
  const { user, logout } = useAuth();
  const { settings } = useSettings();

  const SUPER_ADMINS = ["yamaan115@gmail.com", "avggod61@gmail.com", "agvgod61@gmail.com"];
  const isAdmin = user?.email && SUPER_ADMINS.includes(user.email.toLowerCase());

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
    { name: "Track", path: "/track" },
    ...(isAdmin ? [{ name: "Admin", path: "/admin" }] : [])
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-brand-accent selection:text-white">
      {/* Free Shipping Banner */}
      <div className="bg-brand-gray text-brand-metallic text-xs uppercase tracking-widest py-2 text-center border-b border-white/5 relative z-50">
        Free Shipping Available Across India
      </div>

      {/* Navbar */}
      <header className={cn(
        "sticky top-0 z-40 transition-all duration-300 border-b",
        scrolled 
          ? "bg-brand-black/95 backdrop-blur-md border-white/10 shadow-2xl py-0" 
          : "bg-brand-black/80 backdrop-blur-sm border-white/5 py-1"
      )}>
        <div className={cn(
          "max-w-7xl mx-auto px-6 flex items-center justify-between transition-all duration-300",
          scrolled ? "h-16" : "h-20"
        )}>
          <Link to="/" className="flex items-center">
            {settings.logoImage ? (
              <StorageImage src={settings.logoImage} alt={settings.siteName} className="h-10 object-contain" />
            ) : (
              <span className="text-xl md:text-2xl font-display font-bold tracking-tighter uppercase whitespace-nowrap">
                {settings.siteName.split(' ')[0]} <span className="text-brand-accent">{settings.siteName.split(' ').slice(1).join(' ')}</span>
              </span>
            )}
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "text-sm tracking-widest uppercase font-medium transition-colors hover:text-white",
                  location.pathname === link.path ? "text-white" : "text-brand-metallic"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <Link to="/wishlist" className="relative group text-brand-metallic hover:text-white transition-colors">
              <Heart size={20} />
              {totalWishlistItems > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-brand-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {totalWishlistItems}
                </span>
              )}
            </Link>
            <Link to="/checkout" className="relative group text-brand-metallic hover:text-white transition-colors">
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-brand-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <div className="hidden md:flex items-center gap-4 border-l border-white/10 pl-6">
                <Link to="/profile" className="flex flex-col items-end group">
                  <span className="text-[10px] text-white font-bold uppercase tracking-widest group-hover:text-brand-accent transition-colors">{user.displayName || 'Customer'}</span>
                  <span className="text-[9px] text-brand-metallic uppercase tracking-[0.2em] font-bold transition-colors">Dashboard</span>
                </Link>
                <Link to="/profile" className="w-10 h-10 rounded-full bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center text-brand-accent overflow-hidden hover:border-brand-accent transition-all transform hover:scale-105">
                  {user.photoURL ? (
                    <StorageImage src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                </Link>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-4 border-l border-white/10 pl-6">
                <Link to="/auth" className="flex items-center gap-2 text-brand-metallic hover:text-brand-accent transition-colors">
                  <User size={18} />
                  <span className="text-[10px] uppercase font-bold tracking-widest mt-0.5">Login / Sign Up</span>
                </Link>
              </div>
            )}

            <button 
              className="md:hidden text-brand-metallic hover:text-white transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
           <div className="md:hidden absolute top-full left-0 w-full bg-brand-black/95 backdrop-blur-xl border-b border-white/5 py-6 px-6 flex flex-col gap-6 shadow-2xl h-screen overflow-y-auto">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className="text-lg tracking-widest uppercase font-medium text-brand-metallic hover:text-white"
              >
                {link.name}
              </Link>
            ))}
            
            <div className="h-px bg-white/10 my-2"></div>
            
            {user ? (
               <div className="flex flex-col gap-6">
                 <Link
                   to="/profile"
                   onClick={() => setIsMenuOpen(false)}
                   className="flex items-center gap-4 text-white uppercase font-bold tracking-widest text-lg"
                 >
                   <User size={24} />
                   My Account
                 </Link>
                 <Link
                   to="/order-history"
                   onClick={() => setIsMenuOpen(false)}
                   className="flex items-center gap-4 text-white uppercase font-bold tracking-widest text-lg"
                 >
                   <ShoppingBag size={24} />
                   Order History
                 </Link>
                 <button 
                   onClick={() => {
                     logout();
                     setIsMenuOpen(false);
                   }}
                   className="flex items-center gap-4 text-brand-accent uppercase font-bold tracking-widest text-lg"
                 >
                   <LogOut size={24} />
                   Sign Out
                 </button>
               </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-4 text-brand-metallic hover:text-brand-accent uppercase font-bold tracking-widest text-lg"
              >
                <User size={24} />
                Login / Sign Up
              </Link>
            )}

            <div className="pb-32"></div>
          </div>
        )}
      </header>

      <main className="flex-grow flex flex-col relative z-10 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-brand-gray border-t border-white/5 py-16 px-6 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <Link to="/" className="mb-6 inline-block">
              {settings.logoImage ? (
                <StorageImage src={settings.logoImage} alt={settings.siteName} className="h-12 object-contain" />
              ) : (
                <span className="text-3xl font-display font-bold tracking-tighter uppercase whitespace-nowrap">
                  {settings.siteName.split(' ')[0]} <span className="text-brand-accent">{settings.siteName.split(' ').slice(1).join(' ')}</span>
                </span>
              )}
            </Link>
            <p className="text-brand-metallic text-sm leading-relaxed max-w-sm">
              {settings.footerText}
            </p>
          </div>
          <div>
            <h4 className="font-display uppercase tracking-widest text-sm font-bold mb-6">Shop</h4>
            <ul className="space-y-4 text-sm text-brand-metallic">
              <li><Link to="/shop?type=Full-face" className="hover:text-white transition-colors">Full Face Helmets</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors">All Products</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display uppercase tracking-widest text-sm font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-brand-metallic">
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/sizing" className="hover:text-white transition-colors">Helmet Sizing Guide</Link></li>
              <li><Link to="/policies" className="hover:text-white transition-colors">Shipping & Returns</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display uppercase tracking-widest text-sm font-bold mb-6">Stay Protected</h4>
            <NewsletterForm />
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-brand-metallic text-center md:text-left tracking-widest uppercase">
          <div className="flex flex-col gap-2">
            <p>&copy; {new Date().getFullYear()} {settings.siteName}. All rights reserved.</p>
            <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
              <a href="https://www.instagram.com/agvgod?igsh=Znp4NDBtcWI4eXhm" target="_blank" rel="noopener noreferrer" className="text-brand-metallic hover:text-white transition-colors flex items-center gap-2">
                <Instagram size={14} /> <span>Instagram</span>
              </a>
              <a href="https://m.youtube.com/channel/UCbgB2J-klov5ZITyxYkmbpA?fbclid=PAb21jcASLZ7VleHRuA2FlbQIxMQBzcnRjBmFwcF9pZA81NjcwNjczNDMzNTI0MjcAAac-RK7f8Ab9NiFthFLN5S6NKBoYFjJpD2zUM41JW9fgGHBgGErx5ChVcwcQOA_aem_5eGRBhOBNYDWN-XlAttmzQ" target="_blank" rel="noopener noreferrer" className="text-brand-metallic hover:text-white transition-colors flex items-center gap-2">
                <Youtube size={14} /> <span>YouTube</span>
              </a>
            </div>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-6 text-[10px]">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div> Secure Checkout
            </span>
            <div className="flex items-center gap-2">
              <span>Accepted:</span>
              <span className="border border-white/20 px-1.5 py-0.5 rounded-sm">UPI ONLY</span>
            </div>
            <span>ISI Certified</span>
          </div>
        </div>
      </footer>
      
      <BackToTop />
    </div>
  );
}
