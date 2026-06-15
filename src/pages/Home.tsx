import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, Wind, Layers, Star, PlayCircle, Heart, Search, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { products as staticProducts, Product } from "../data/products";
import { motion, AnimatePresence } from "motion/react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { cn } from "../lib/utils";
import { db, isQuotaError } from "../lib/firebase";
import { collection, getDocs, query, limit, doc, getDoc, where, getDocsFromCache, getDocFromCache } from "../lib/firebase";
import { useSettings } from "../context/SettingsContext";

import { Edit2, X as CloseIcon } from "lucide-react";
import { auth } from "../lib/firebase";

interface GalleryConfig {
  wideImage: string;
  squareImage1: string;
  squareImage2: string;
  technicalImage: string;
}

export default function Home() {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart, buyNow } = useCart();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [gallery, setGallery] = useState<GalleryConfig>({
    wideImage: "https://images.unsplash.com/photo-1542125387-c71274d94f0a?q=80&w=2070&auto=format&fit=crop",
    squareImage1: "https://images.unsplash.com/photo-1626014303757-6bcbe6762b32?q=80&w=2073&auto=format&fit=crop",
    squareImage2: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop",
    technicalImage: "https://images.unsplash.com/photo-1542124536-1e967396796c?auto=format&fit=crop&q=80&w=1200"
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // Products
        const pq = query(collection(db, "products"), where("status", "==", "published"), limit(20));
        const psnap = await getDocs(pq);
        
        const isInvalidUrl = (url: string) => !url || !(url.startsWith('http') || url.startsWith('data:image'));
        
        const liveProducts: Product[] = psnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Product))
          .filter(p => {
            // ONLY show published products
            // If status is missing, we assume published for old ones, 
            // but the user wants strict admin permission, so we'll be safe.
            const isPublished = !p.status || p.status === 'published';
            const hasValidImage = !isInvalidUrl(p.image);
            return isPublished && hasValidImage;
          });
          
        liveProducts.sort((a, b) => ((b.createdAt as any)?.seconds || 0) - ((a.createdAt as any)?.seconds || 0));
        setAllProducts(liveProducts);

        // Categories
        const cq = query(collection(db, "categories"), limit(12));
        const csnap = await getDocs(cq);
        const cats = csnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(cats);

        // Gallery
        const galleryDoc = await getDoc(doc(db, "site_config", "homepage_gallery"));
        if (galleryDoc.exists()) {
          setGallery(galleryDoc.data() as GalleryConfig);
        }
      } catch (error) {
        if (isQuotaError(error)) {
          console.warn("Firestore quota exceeded. Attempting cache fallback.");
          
          try {
            // Try cache for products
            const pq = query(collection(db, "products"), where("status", "==", "published"), limit(20));
            const psnap = await getDocsFromCache(pq);
            if (!psnap.empty) {
              const cachedProducts = psnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
              setAllProducts(cachedProducts);
            } else {
              setAllProducts(staticProducts.filter(p => (!p.status || p.status === 'published') && p.image && (p.image.startsWith('http') || p.image.startsWith('data:image'))));
            }

            // Try cache for categories
            const cq = query(collection(db, "categories"), limit(12));
            const csnap = await getDocsFromCache(cq);
            if (!csnap.empty) {
              setCategories(csnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }

            // Try cache for gallery
            const galSnap = await getDocFromCache(doc(db, "site_config", "homepage_gallery"));
            if (galSnap.exists()) {
              setGallery(galSnap.data() as GalleryConfig);
            }
          } catch (cacheErr) {
            setAllProducts(staticProducts.filter(p => (!p.status || p.status === 'published') && p.image && (p.image.startsWith('http') || p.image.startsWith('data:image'))));
            setCategories([
              { id: "cat-ff", name: "Full-face", image: "https://dainese-cdn.thron.com/delivery/public/image/dainese/35790505-f6f1-41c6-9537-3cbad2f167cc/px6qct/std/960x960/2118395016_027_1.png" },
              { id: "cat-mc", name: "Motorcycles", image: "https://images.unsplash.com/photo-1626014303757-6bcbe6762b32?q=80&w=200" },
              { id: "cat-vs", name: "Visor", image: "https://images.unsplash.com/photo-1542124536-1e967396796c?q=80&w=200" },
              { id: "cat-ac", name: "Accessory", image: "https://images.unsplash.com/photo-1542125387-c71274d94f0a?q=80&w=200" }
            ]);
          }
        } else {
          console.error("Error fetching data for home:", error);
        }
      } finally {
        // Data fetch complete
      }
    }

    fetchData();
  }, []);

  const featuredProducts = allProducts.slice(0, 8);
  const fullFaceProducts = allProducts.filter(p => p.type === "Full-face");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="flex flex-col">
      {/* 1. HERO BANNER - Recipe 2 (Editorial) & 11 (Split Layout) inspiration */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <img 
            src={settings.heroImage} 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-60 brightness-75"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/40 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="text-[120px] font-display font-bold opacity-[0.02] uppercase tracking-tighter">AVG GOD</div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full grid grid-cols-1 lg:grid-cols-2">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start gap-8"
          >
            <div className="inline-block px-3 py-1 border border-white/20 bg-white/5 backdrop-blur-md rounded-full text-xs tracking-widest uppercase font-medium">
              New: Corsa R Carbon
            </div>
            <h1 className="text-6xl md:text-8xl font-display font-bold leading-[0.85] tracking-tighter uppercase">
              {settings.heroTitle.includes(' ') ? (
                <>
                  {settings.heroTitle.split(' ').slice(0, -1).join(' ')} <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-white/30">{settings.heroTitle.split(' ').slice(-1)}</span>
                </>
              ) : (
                settings.heroTitle
              )}
            </h1>
            <p className="text-brand-metallic text-lg md:text-xl max-w-md font-light leading-relaxed">
              {settings.heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/shop" className="bg-brand-accent text-white px-8 py-4 font-bold tracking-widest uppercase text-sm hover:bg-brand-accent/80 transition-colors flex items-center gap-2">
                Explore Collection <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* LIVE SHOWROOM - Real Action Showcase */}
      <section className="py-24 px-6 bg-brand-black border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
            <div className="lg:w-1/2">
              <div className="flex items-center gap-3 mb-6 justify-center lg:justify-start">
                <div className="w-2.5 h-2.5 bg-brand-accent rounded-full animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-[0.4em] text-white">Live Performance</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-display font-bold tracking-tighter uppercase mb-6 leading-[0.9]">
                Safety <span className="text-brand-accent">In Motion.</span>
              </h2>
              <p className="text-brand-metallic text-lg mb-10 leading-relaxed max-w-xl">
                Our helmets are born on the track and refined in the wind tunnel. Experience the ultimate synergy of aerodynamics and protection.
              </p>
              <div className="flex flex-wrap gap-8 justify-center lg:justify-start">
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-white tracking-tighter">4.9/5</span>
                  <span className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold mt-1">Average Rating</span>
                </div>
                <div className="w-px h-12 bg-white/10 hidden sm:block" />
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-white tracking-tighter">ISI/ECE</span>
                  <span className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold mt-1">Certified Safety</span>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 grid grid-cols-2 gap-4 w-full relative group">
              {auth.currentUser && (
                <Link 
                  to="/admin" 
                  onClick={() => localStorage.setItem('admin_active_tab', 'site')}
                  className="absolute -top-4 -right-4 z-50 bg-brand-accent text-white p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 flex items-center justify-center border-4 border-black"
                  title="Admin: Edit Gallery Images"
                >
                  <Edit2 size={20} />
                </Link>
              )}
              <div className="col-span-2 relative aspect-[21/9] overflow-hidden bg-brand-gray border border-white/5 group">
                <img 
                  src={gallery.wideImage} 
                  alt="AGV Showcase" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="relative aspect-square overflow-hidden bg-brand-gray border border-white/5 group">
                <img 
                  src={gallery.squareImage1} 
                  alt="Detail close-up" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="relative aspect-square overflow-hidden bg-brand-gray border border-white/5 group">
                <img 
                  src={gallery.squareImage2} 
                  alt="Action shot" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SAFETY SCANNER - Technical / Hardware Aesthetic */}
      <section className="py-24 px-6 bg-brand-black relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-accent/50 to-transparent animate-pulse" />
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative aspect-square md:aspect-video lg:aspect-square bg-white/5 border border-white/10 p-4 group"
            >
              {auth.currentUser && (
                <Link 
                  to="/admin" 
                  onClick={() => localStorage.setItem('admin_active_tab', 'site')}
                  className="absolute -top-4 -left-4 z-50 bg-brand-accent text-white p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 flex items-center justify-center border-4 border-black"
                  title="Admin: Edit Scanner Image"
                >
                  <Edit2 size={20} />
                </Link>
              )}
              {/* Scanning Line Animation */}
              <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                <motion.div 
                  initial={{ top: "0%" }}
                  animate={{ top: "100%" }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-full h-[2px] bg-brand-accent shadow-[0_0_15px_rgba(255,60,60,0.8)] opacity-100"
                />
              </div>
              <img 
                src={gallery.technicalImage} 
                alt="Scanning helmet interior" 
                className="w-full h-full object-cover grayscale brightness-50 mix-blend-screen transition-all duration-700 group-hover:grayscale-0 group-hover:brightness-100"
              />
              <div className="absolute bottom-8 left-8 p-6 bg-brand-black/80 backdrop-blur-md border border-brand-accent/20 max-w-xs transition-transform hover:-translate-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="text-brand-accent" size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">System Status: Secure</span>
                </div>
                <p className="text-[10px] text-brand-metallic leading-relaxed">
                  Advanced shell integrity verified via ultrasonic scanning. Each AGV helmet undergoes 50+ impact tests before delivery.
                </p>
              </div>
            </motion.div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-accent/10 border border-brand-accent/20 rounded-full mb-6">
                <ShieldCheck size={14} className="text-brand-accent" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent">Safety First</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-display font-bold tracking-tighter uppercase mb-6 leading-[0.9]">
                Protection <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-red-500">Unmatched.</span>
              </h2>
              <p className="text-brand-metallic text-lg mb-8 leading-relaxed">
                We take security seriously. Our helmets are equipped with the most advanced impact-absorption technologies in the industry.
              </p>
              
              <div className="space-y-4">
                {[
                  { title: "Carbon Shell Integrity", value: "Verified", color: "text-green-500" },
                  { title: "Multi-Density EPS", value: "Certified", color: "text-green-500" },
                  { title: "Emergency Release System", value: "Active", color: "text-brand-accent" }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-sm hover:border-white/10 transition-colors">
                    <span className="text-xs uppercase tracking-widest font-bold text-brand-metallic">{stat.title}</span>
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest", stat.color)}>{stat.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex items-center gap-4 p-4 border border-brand-accent/20 bg-brand-accent/5">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-brand-black bg-brand-gray flex items-center justify-center text-[10px] font-bold">
                      {(i + 4) * 10}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">Trust Matrix</span>
                  <span className="text-[9px] text-brand-metallic">1,200+ Verified Riders Protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHY AVG GOD - Recipe 8 Minimal Utility Grid */}
      <section className="py-24 px-6 bg-brand-black">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tighter uppercase mb-4">Engineering Perfection</h2>
            <p className="text-brand-metallic">Every component is over-engineered to provide maximum protection and aerodynamic efficiency.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, title: "DOT / ISI Certified", desc: "Exceeds global safety standards. Rigorously tested against multi-directional impacts." },
              { icon: Wind, title: "Aerodynamic Shell", desc: "Wind-tunnel tested profile reduces drag and prevents buffeting at highway speeds." },
              { icon: Layers, title: "Carbon Composite", desc: "Space-age materials deliver incredibly lightweight comfort without compromising strength." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="p-8 border border-white/5 bg-brand-gray/50 hover:bg-brand-gray transition-colors group"
              >
                <div className="w-12 h-12 bg-white/5 flex items-center justify-center mb-6 rounded-sm group-hover:bg-brand-accent/10 group-hover:text-brand-accent transition-colors">
                  <feature.icon size={24} />
                </div>
                <h3 className="font-display font-bold tracking-widest uppercase mb-4">{feature.title}</h3>
                <p className="text-brand-metallic text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS -> ALL PRODUCTS */}
      <section className="py-24 px-6 bg-brand-gray relative overflow-hidden">
        {/* Abstract background flair */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-6">
            <div className="w-full lg:w-1/2">
              <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tighter uppercase mb-4">Featured <span className="text-brand-accent">Products</span></h2>
              <p className="text-brand-metallic">The choice of champions. Track-ready performance across all gear.</p>
            </div>
            <div className="w-full lg:w-1/2 flex flex-col items-start lg:items-end gap-4">
              <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search helmets, gear..." 
                  className="w-full bg-brand-black border border-white/10 px-4 py-3 pl-10 text-sm focus:outline-none focus:border-brand-accent/50 text-white placeholder-brand-metallic/50"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-metallic/50" size={18} />
              </form>
              <Link to="/shop" className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold hover:text-brand-accent transition-colors border-b border-brand-accent pb-1">
                Advanced Filter & Shop All
              </Link>
            </div>
          </div>

          <div className="relative group/carousel">
            <div className="overflow-hidden">
              <motion.div 
                className="flex gap-8 pb-8"
                drag="x"
                dragConstraints={{ left: -1000, right: 0 }}
                style={{ cursor: "grab" }}
                whileTap={{ cursor: "grabbing" }}
              >
                {featuredProducts.length > 0 ? (
                  featuredProducts.map((product) => (
                    <div key={product.id} className="min-w-[280px] md:min-w-[320px] relative group pointer-events-auto">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWishlist(product);
                        }}
                        className={cn(
                          "absolute top-4 right-4 z-20 transition-colors p-2 bg-black/40 backdrop-blur-sm rounded-full border border-white/10",
                          isInWishlist(product.id) ? "text-brand-accent scale-110" : "text-brand-metallic hover:text-white"
                        )}
                        title={isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        <Heart size={16} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                      </motion.button>
                      <Link to={`/product/${product.id}`} className="flex flex-col border border-white/5 bg-brand-black p-6 hover:border-brand-accent/30 transition-all duration-300 h-full pointer-events-auto">
                        <div className="relative aspect-square mb-6 overflow-hidden flex items-center justify-center bg-white/5 p-8">
                           <img 
                              src={product.image} 
                              alt={product.name} 
                              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                              referrerPolicy="no-referrer"
                            />
                        </div>
                        <div className="flex flex-col flex-grow">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-display font-bold text-lg uppercase tracking-wide line-clamp-2 min-h-[56px]">{product.name}</h3>
                          </div>
                          <p className="text-brand-metallic text-xs mb-4 tracking-widest uppercase">{product.type}</p>
                          
                          <div className="mt-auto flex items-end justify-between mb-4">
                            <span className="font-bold text-brand-accent tracking-tight">₹{product.price.toLocaleString('en-IN')}</span>
                            <div className="flex items-center gap-1 text-yellow-500">
                              <Star size={12} fill="currentColor" />
                              <span className="text-white text-xs font-medium">{product.rating}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                addToCart(product, 'L', 1);
                              }}
                              className="bg-white/5 border border-white/10 flex items-center justify-center p-3 text-white hover:bg-brand-accent hover:border-brand-accent transition-all group/cart"
                              title="Add to Cart"
                            >
                              <ShoppingBag size={16} className="group-hover/cart:scale-110 transition-transform" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                buyNow(product, 'L', 1);
                                navigate("/checkout");
                              }}
                              className="flex-grow bg-brand-accent text-white py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2 group shadow-[0_5px_15px_rgba(226,43,43,0.2)]"
                            >
                              <span>Buy Now</span>
                              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-brand-metallic w-full">
                    <Search size={48} className="mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-display uppercase tracking-widest mb-2">No products found</h3>
                    <p>Try adjusting your search query.</p>
                  </div>
                )}
              </motion.div>
            </div>
            
            <div className="flex justify-center gap-4 mt-8">
              <button 
                className="w-12 h-12 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 transition-colors rounded-full text-white"
                onClick={(e) => {
                  const carousel = e.currentTarget.parentElement?.previousElementSibling?.firstElementChild;
                  if (carousel) carousel.scrollBy({ left: -350, behavior: 'smooth' });
                }}
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                className="w-12 h-12 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 transition-colors rounded-full text-white"
                onClick={(e) => {
                  const carousel = e.currentTarget.parentElement?.previousElementSibling?.firstElementChild;
                  if (carousel) carousel.scrollBy({ left: 350, behavior: 'smooth' });
                }}
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC CATEGORY EXPLORER */}
      {categories.length > 0 && (
        <section className="py-24 px-6 bg-brand-black border-t border-white/5 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="max-w-xl">
                <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tighter uppercase mb-4">
                  Explore <span className="text-brand-accent">Collections</span>
                </h2>
                <p className="text-brand-metallic">Browse our curated gear folders designed for performance and safety.</p>
              </div>
              <Link to="/shop" className="group flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:border-brand-accent transition-all">
                All Products <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {categories.map((cat, idx) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link 
                    to={`/shop?type=${cat.name}`}
                    className="group flex flex-col items-center text-center p-8 border border-white/5 bg-white/5 hover:border-brand-accent/50 transition-all duration-500 hover:-translate-y-2"
                  >
                    <div className="w-20 h-20 bg-brand-black flex items-center justify-center border border-white/10 mb-6 group-hover:border-brand-accent transition-colors overflow-hidden">
                      {cat.image ? (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                          <span className="text-[10px] text-white/20">{cat.name}</span>
                        </div>
                      ) : (
                        <Layers size={32} className="text-brand-metallic group-hover:text-brand-accent transition-colors" />
                      )}
                    </div>
                    <h3 className="font-display font-bold tracking-widest uppercase mb-2 group-hover:text-brand-accent transition-colors">{cat.name}</h3>
                    <p className="text-[10px] text-brand-metallic uppercase tracking-[0.2em]">{allProducts.filter(p => p.type === cat.name).length} Products</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FULL FACE HELMETS SECTION - Only show if not already covered or if it's the primary focus */}
      {!categories.some(c => c.name === "Full-face") && (
        <section className="py-24 px-6 bg-brand-black border-t border-white/5 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="max-w-xl">
                <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tighter uppercase mb-4">
                  Full Face <span className="text-brand-accent">Helmets</span>
                </h2>
                <p className="text-brand-metallic">Uncompromising full protection designed for high speeds and serious riders on tracking or street.</p>
              </div>
              <Link to="/shop?type=Full-face" className="group flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:border-brand-accent transition-all">
                View All Full Face <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="relative group/carousel">
              <div className="overflow-hidden">
                <motion.div 
                  className="flex gap-8 pb-8"
                  drag="x"
                  dragConstraints={{ left: -1000, right: 0 }}
                  style={{ cursor: "grab" }}
                  whileTap={{ cursor: "grabbing" }}
                >
                  {fullFaceProducts.map((product) => (
                    <div key={`fullface-${product.id}`} className="min-w-[280px] md:min-w-[320px] relative group pointer-events-auto">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWishlist(product);
                        }}
                        className={cn(
                          "absolute top-4 right-4 z-20 transition-colors p-2 bg-black/40 backdrop-blur-sm rounded-full border border-white/10",
                          isInWishlist(product.id) ? "text-brand-accent scale-110" : "text-brand-metallic hover:text-white"
                        )}
                        title={isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        <Heart size={16} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                      </button>
                      <Link to={`/product/${product.id}`} className="flex flex-col border border-white/5 bg-brand-gray p-6 hover:border-brand-accent/30 transition-all duration-300 h-full pointer-events-auto">
                        <div className="relative aspect-square mb-6 overflow-hidden">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" 
                            data-image-component="true"
                          />
                        </div>
                        <div className="flex flex-col flex-grow">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-display font-bold text-lg uppercase tracking-wide line-clamp-2 min-h-[56px]">{product.name}</h3>
                          </div>
                          
                          <div className="mt-auto flex items-end justify-between mb-4">
                            <span className="font-bold text-white tracking-tight">₹{product.price.toLocaleString('en-IN')}</span>
                            <div className="flex items-center gap-1 text-yellow-500">
                              <Star size={12} fill="currentColor" />
                              <span className="text-brand-metallic text-xs font-medium">{product.rating}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                addToCart(product, 'L', 1);
                              }}
                              className="bg-white/5 border border-white/10 flex items-center justify-center p-3 text-white hover:bg-brand-accent hover:border-brand-accent transition-all group/cart"
                              title="Add to Cart"
                            >
                              <ShoppingBag size={16} className="group-hover/cart:scale-110 transition-transform" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                buyNow(product, 'L', 1);
                                navigate("/checkout");
                              }}
                              className="flex-grow bg-brand-accent text-white py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2 group shadow-[0_5px_15px_rgba(226,43,43,0.2)]"
                            >
                              <span>Buy Now</span>
                              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </motion.div>
              </div>
              
              <div className="flex justify-center gap-4 mt-8">
                <button 
                  className="w-12 h-12 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 transition-colors rounded-full text-white"
                  onClick={(e) => {
                    const carousel = e.currentTarget.parentElement?.previousElementSibling?.firstElementChild;
                    if (carousel) carousel.scrollBy({ left: -350, behavior: 'smooth' });
                  }}
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  className="w-12 h-12 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 transition-colors rounded-full text-white"
                  onClick={(e) => {
                    const carousel = e.currentTarget.parentElement?.previousElementSibling?.firstElementChild;
                    if (carousel) carousel.scrollBy({ left: 350, behavior: 'smooth' });
                  }}
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. TESTIMONIALS */}
      <section className="py-24 px-6 bg-brand-black border-b border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-display font-bold tracking-tighter uppercase mb-16">Rider Approved</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              {name: "Rahul M.", type: "Track Rider", review: "The Corsa R Carbon is absurdly light. Completely eliminates neck fatigue on 200km+ highway runs. The field of view in full tuck is unmatched.", rating: 5},
              {name: "Arjun K.", type: "Touring Enthusiast", review: "Upgraded to the Corsa R. The mechanism is buttery smooth, and it's the quietest helmet I've ever owned. Worth every rupee.", rating: 5},
              {name: "Vikram S.", type: "Daily Commuter", review: "Daily riding in Bangalore needs ventilation. The K6 vents are incredible. It feels totally secure without suffocating you.", rating: 4.5}
            ].map((testimonial, i) => (
              <div key={i} className="p-8 border border-white/5 bg-brand-gray text-center flex flex-col items-center">
                <div className="flex gap-1 mb-6 text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="text-lg italic font-light leading-relaxed mb-6">"{testimonial.review}"</p>
                <div className="mt-auto">
                  <h4 className="font-bold tracking-widest uppercase text-sm">{testimonial.name}</h4>
                  <p className="text-brand-metallic text-xs uppercase tracking-widest mt-1">{testimonial.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Modal Popup */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-brand-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
            onClick={() => setIsVideoModalOpen(false)}
          >
            <button 
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-6 right-6 z-[160] text-brand-metallic hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full transition-colors"
            >
              <CloseIcon size={24} />
            </button>
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <iframe 
                src="https://www.youtube.com/embed/S2pnt1M8Y4o?autoplay=1" 
                title="AGV Helmets Video Showcase" 
                className="w-full h-full border-0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
