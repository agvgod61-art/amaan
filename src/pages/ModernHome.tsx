import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  ShoppingCart, 
  User, 
  Heart, 
  Menu, 
  X, 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  Clock, 
  Star,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { products as staticProducts } from "../data/products";

export default function ModernHome() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");

  const categories = ["All", "Full-face", "Off-road"];

  return (
    <div className="bg-[#f5f5f5] text-[#333] font-sans selection:bg-[#e94560] selection:text-white">
      {/* Header Top */}
      <div className="bg-[#0f0f1a] text-white py-2 px-6 text-[11px] uppercase tracking-widest font-bold flex justify-between items-center">
        <div className="flex items-center gap-4">
           <span>Free Shipping on Orders Over ₹5000</span>
           <span className="hidden md:inline text-white/30">|</span>
           <span className="hidden md:inline">Certified Safety Standards (ISI/ECE)</span>
        </div>
        <div className="flex items-center gap-4">
           <a href="tel:+91" className="hover:text-[#e94560] transition-colors">Support</a>
           <a href="#track" className="hover:text-[#e94560] transition-colors">Track Order</a>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-[100] bg-[#1a1a2e] text-white shadow-2xl">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-8">
           {/* Logo */}
           <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-[#e94560] rounded-lg flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
                 <ShieldCheck className="text-white" size={24} />
              </div>
              <span className="text-2xl font-extrabold tracking-tighter uppercase italic">Helmet<span className="text-[#e94560]">Pro</span></span>
           </Link>

           {/* Search Bar */}
           <div className="hidden lg:flex flex-1 max-w-2xl relative">
              <input 
                type="text" 
                placeholder="Search premium helmets, visors, and gear..."
                className="w-full bg-[#16213e] border-none rounded-full py-3 px-6 pl-14 text-sm focus:ring-2 focus:ring-[#e94560] transition-all outline-none"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={18} />
           </div>

           {/* Actions */}
           <div className="flex items-center gap-6">
              <Link to="/wishlist" className="hover:text-[#e94560] transition-colors relative">
                 <Heart size={22} />
                 <span className="absolute -top-2 -right-2 bg-[#e94560] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">0</span>
              </Link>
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="hover:text-[#e94560] transition-colors relative"
              >
                 <ShoppingCart size={22} />
                 <span className="absolute -top-2 -right-2 bg-[#e94560] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">0</span>
              </button>
              <button className="lg:hidden hover:text-[#e94560]">
                 <Menu size={24} />
              </button>
           </div>
        </div>

        {/* Desktop Nav */}
        <nav className="bg-[#16213e] border-t border-white/5 overflow-hidden">
           <div className="max-w-[1400px] mx-auto px-6 flex items-center">
              {["Full-Face", "Visors", "Accessories", "Safety Tech", "Sale"].map((item) => (
                <a 
                  key={item} 
                  href="#" 
                  className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all border-b-2 border-transparent hover:border-[#e94560]"
                >
                  {item}
                </a>
              ))}
           </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] text-white flex items-center overflow-hidden">
         {/* Background Design */}
         <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[800px] h-[800px] bg-[#e94560]/10 rounded-full blur-[120px] pointer-events-none" />
         
         <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
               <div className="inline-flex items-center gap-2 bg-[#e94560]/20 border border-[#e94560]/30 px-4 py-2 rounded-full mb-8">
                  <span className="w-2 h-2 bg-[#e94560] rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#e94560]">2026 Collection Live</span>
               </div>
               <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] mb-8">
                  The <span className="text-[#e94560]">Ultra</span><br />
                  Signature.
               </h1>
               <p className="text-lg text-white/60 max-w-lg mb-10 leading-relaxed font-medium capitalize">
                  Born on the track. Refined for the streets. Experience the pinnacle of Italian aerospace engineering in every ride.
               </p>
               <div className="flex flex-wrap gap-4">
                  <Link to="/shop" className="bg-[#e94560] text-white px-10 py-5 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-[#c73e54] transition-all transform hover:-translate-y-1 shadow-xl shadow-[#e94560]/20 flex items-center gap-3 group">
                     Shop Collection <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <a href="https://wa.me/91" className="bg-[#25D366] text-white px-10 py-5 rounded-full font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all flex items-center gap-3">
                     WhatApp Order
                  </a>
               </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative flex justify-center"
            >
               <div className="relative group">
                  <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl group-hover:bg-[#e94560]/10 transition-all duration-700" />
                  <img 
                    src="https://dainese-cdn.thron.com/delivery/public/image/dainese/35790505-f6f1-41c6-9537-3cbad2f167cc/px6qct/std/960x960/2118395016_027_1.png" 
                    alt="Premium Helmet"
                    className="w-full max-w-2xl relative z-10 drop-shadow-[0_35px_35px_rgba(0,0,0,0.6)] animate-bounce-slow"
                  />
               </div>
            </motion.div>
         </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white py-20 px-6">
         <div className="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { icon: Truck, title: "Super Fast Delivery", desc: "Same day dispatch for orders before 2 PM. Delivery within 48 hours." },
              { icon: ShieldCheck, title: "100% Certified", desc: "Every helmet meets or exceeds ECE 22.06 and ISI safety standards." },
              { icon: Clock, title: "Easy Returns", desc: "Don't like the fit? Return or exchange within 7 days. Hassle-free." },
              { icon: Star, title: "Premium Brand", desc: "Official partners with top international brands like AGV, Shoei, HJC." }
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                 <div className="w-20 h-20 bg-[#f5f5f5] rounded-full flex items-center justify-center mb-6 group-hover:bg-[#e94560]/10 transition-colors">
                    <f.icon className="text-[#333] group-hover:text-[#e94560] transition-colors" size={32} />
                 </div>
                 <h3 className="text-lg font-black uppercase tracking-tight mb-2">{f.title}</h3>
                 <p className="text-sm text-[#666] leading-relaxed max-w-[240px]">{f.desc}</p>
              </div>
            ))}
         </div>
      </section>

      {/* Products Section */}
      <section className="py-24 px-6 max-w-[1400px] mx-auto">
         <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div>
               <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-[#1a1a2e]">New <span className="text-[#e94560]">Arrivals</span></h2>
               <div className="flex gap-4">
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setActiveTab(cat)}
                      className={`px-6 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest border-2 transition-all ${
                        activeTab === cat 
                        ? "bg-[#1a1a2e] border-[#1a1a2e] text-white shadow-lg" 
                        : "bg-white border-[#e0e0e0] text-[#666] hover:border-[#1a1a2e]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
               </div>
            </div>
            <Link to="/shop" className="text-xs font-bold uppercase tracking-widest text-[#1a1a2e] border-b-2 border-[#e94560] pb-1 hover:text-[#e94560] transition-all">
               View All Gear
            </Link>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {staticProducts.slice(0, 8).map((product) => (
               <motion.div 
                 key={product.id}
                 whileHover={{ y: -10 }}
                 className="bg-white rounded-[20px] overflow-hidden shadow-lg border border-[#e0e0e0] group relative"
               >
                  {/* Badge */}
                  <div className="absolute top-4 left-4 z-10 bg-[#e94560] text-white text-[10px] font-bold uppercase py-1.5 px-4 rounded-full shadow-md">
                     New Season
                  </div>

                  {/* Actions */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                     <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-[#e94560] hover:text-white transition-all">
                        <Heart size={18} />
                     </button>
                     <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-[#e94560] hover:text-white transition-all">
                        <Search size={18} />
                     </button>
                  </div>

                  <div className="h-[280px] bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] flex items-center justify-center overflow-hidden">
                     <img 
                       src={product.image} 
                       alt={product.name}
                       className="w-4/5 h-4/5 object-contain transition-transform duration-500 group-hover:scale-110"
                       referrerPolicy="no-referrer"
                     />
                  </div>

                  <div className="p-6">
                     <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e94560] mb-1">{product.type}</p>
                     <h3 className="text-base font-black uppercase tracking-tight text-[#1a1a2e] mb-3 line-clamp-1">{product.name}</h3>
                     <div className="flex items-center gap-2 mb-4">
                        <div className="flex text-[#ffc107]">
                           {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} />)}
                        </div>
                        <span className="text-[11px] text-[#666] font-medium">(24 Reviews)</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex flex-col leading-none">
                           <span className="text-[10px] text-[#999] line-through">₹{(product.price * 1.2).toFixed(0)}</span>
                           <span className="text-xl font-black text-[#1a1a2e]">₹{product.price.toLocaleString()}</span>
                        </div>
                        <button className="bg-[#1a1a2e] text-white p-3 rounded-xl hover:bg-[#e94560] transition-colors">
                           <Plus size={20} />
                        </button>
                     </div>
                  </div>
               </motion.div>
            ))}
         </div>
      </section>

      {/* Cart Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-[500px] bg-white z-[201] flex flex-col shadow-2xl"
            >
               <div className="p-8 border-b flex items-center justify-between bg-[#1a1a2e] text-white">
                  <div className="flex items-center gap-4">
                     <ShoppingCart size={24} />
                     <h2 className="text-xl font-black uppercase tracking-tighter">Your Shopping Bag</h2>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="hover:rotate-90 transition-transform">
                     <X size={28} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center text-center opacity-50">
                  <div className="w-24 h-24 bg-[#f5f5f5] rounded-full flex items-center justify-center mb-6">
                     <ShoppingCart size={40} className="text-[#999]" />
                  </div>
                  <h3 className="text-lg font-black uppercase mb-2">Cart is empty</h3>
                  <p className="text-sm max-w-[200px] mb-8 capitalize">Looks like you haven't added any gear to your mission yet.</p>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="bg-[#e94560] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-[10px]"
                  >
                    Start Shopping
                  </button>
               </div>

               <div className="p-8 bg-[#f8f9fa] border-t">
                  <div className="flex items-center justify-between mb-8 text-[#1a1a2e]">
                     <span className="text-[11px] uppercase tracking-widest font-bold">Subtotal</span>
                     <span className="text-2xl font-black">₹0.00</span>
                  </div>
                  <button className="w-full bg-[#1a1a2e] text-white py-5 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-[#e94560] transition-colors shadow-lg">
                     Proceed to Checkout
                  </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}
