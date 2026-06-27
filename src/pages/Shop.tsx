import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { products as staticProducts, Product } from "../data/products";
import { motion, AnimatePresence } from "motion/react";
import { Check, Filter, Star, Lock, Award, Heart, X, Eye, Search, RefreshCw, ShoppingBag, Loader2, ArrowRight } from "lucide-react";
import { cn } from "../lib/utils";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { db, isQuotaError } from "../lib/firebase";
import { collection, getDocs, query, limit, startAfter, orderBy, where, getDocsFromCache } from "../lib/firebase";
import StorageImage from '../components/StorageImage';
import SEO from '../components/SEO';
import { useSettings } from "../context/SettingsContext";

// Separate Product Card Component for Hover Spin Logic
const ProductCard = ({ 
  product, 
  idx, 
  toggleWishlist, 
  isInWishlist, 
  setQuickViewProduct, 
  addToCart, 
  buyNow, 
  navigate 
}: { 
  product: Product, 
  idx: number, 
  toggleWishlist: (p: Product) => void,
  isInWishlist: (id: string) => boolean,
  setQuickViewProduct: (p: Product) => void,
  addToCart: (p: Product, s: string, q: number) => void,
  buyNow: (p: Product, s: string, q: number) => void,
  navigate: (path: string) => void,
  key?: React.Key
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.3) }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.id}`} className="flex flex-col h-full bg-white/[0.02] border border-white/5 group-hover:bg-white/[0.05] group-hover:border-white/10 transition-all duration-500 overflow-hidden">
        {/* Image Area */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-white/[0.03] to-transparent p-8">
          {/* Badges */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            {product.badge && (
              <div className="bg-brand-accent text-white text-[8px] uppercase tracking-[0.2em] font-bold px-2 py-1 flex items-center gap-1.5 shadow-lg">
                <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                {product.badge}
              </div>
            )}
          </div>

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className={cn(
              "absolute top-4 right-4 z-20 transition-all p-2 rounded-full",
              isInWishlist(product.id) 
                ? "text-brand-accent bg-brand-accent/10 border border-brand-accent/20" 
                : "text-brand-metallic hover:text-white bg-white/5 border border-transparent hover:border-white/10"
            )}
          >
            <Heart size={16} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
          </motion.button>
          
          {/* Product Image */}
          <div className="absolute inset-0">
            <StorageImage 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-contain p-4 transition-transform duration-500 hover:scale-105" 
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Quick View Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-30">
            <button 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewProduct(product); }}
             className="w-full h-12 bg-white text-black text-[10px] uppercase font-bold tracking-[0.2em] hover:bg-brand-accent hover:text-white transition-all flex items-center justify-center gap-2 shadow-2xl"
            >
              <Eye size={14} /> Quick Experience
            </button>
          </div>
        </div>

        {/* Info Area */}
        <div className="p-6 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-3">
            <p className="text-[10px] text-brand-metallic font-bold uppercase tracking-[0.2em]">{product.type}</p>
            <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 border border-white/5">
              <Star size={10} className="text-yellow-500 fill-yellow-500" />
              <span className="text-[10px] text-white font-mono">{product.rating}</span>
            </div>
          </div>

          <h3 className="font-display font-medium text-lg text-white group-hover:text-brand-accent transition-colors duration-300 uppercase leading-tight mb-6 line-clamp-2 h-12">
            {product.name}
          </h3>
          
          <div className="mt-auto">
            <div className="flex items-baseline gap-2 mb-6">
              <p className="text-xl font-bold text-white tracking-tighter">₹{product.price.toLocaleString('en-IN')}</p>
              {product.originalPrice && (
                <p className="text-xs text-brand-metallic line-through decoration-brand-accent/50">₹{product.originalPrice.toLocaleString('en-IN')}</p>
              )}
            </div>

            <div className="grid grid-cols-12 gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToCart(product, 'L', 1);
                }}
                className="col-span-4 h-10 bg-white/5 border border-white/10 text-white hover:bg-brand-accent hover:border-brand-accent transition-all flex items-center justify-center group/cart"
                title="Add to Cart"
              >
                <ShoppingBag size={14} className="group-hover/cart:scale-110 transition-transform" />
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  buyNow(product, 'L', 1);
                  navigate("/checkout");
                }}
                className="col-span-8 h-10 bg-brand-accent text-white text-[10px] uppercase font-bold tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(226,43,43,0.2)] group"
              >
                <span>Buy Now</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* Corner Accent */}
      <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute top-0 right-0 w-[2px] h-full bg-brand-accent" />
        <div className="absolute top-0 right-0 w-full h-[2px] bg-brand-accent" />
      </div>
    </motion.div>
  );
};

export default function Shop() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart, buyNow } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState<Product[]>(staticProducts.filter(p => !p.status || p.status === 'published'));
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ type: 'product' | 'category', text: string, id?: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [liveInventory, setLiveInventory] = useState<number>(0);

  const defaultFilterTypes = ["All", "Full-face", "Motorcycles", "Visor", "Accessory", "Boots", "Gloves", "Suit", "Jacket", "Pants"];
  const [filterTypes, setFilterTypes] = useState<string[]>(defaultFilterTypes);

  // Fetch Live Inventory for Premium Helmets
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    const fetchInventory = async () => {
      try {
        const q = query(
          collection(db, "products"),
          where("status", "==", "published"),
          where("type", "==", "Full-face")
        );
        const snap = await getDocs(q);
        let stock = 0;
        snap.forEach(doc => {
          const data = doc.data();
          if (data.stock) stock += Number(data.stock);
        });
        
        if (stock === 0) {
          const fallbackStock = staticProducts
            .filter(p => (!p.status || p.status === 'published') && p.type === 'Full-face')
            .reduce((acc, p) => acc + (p.stock || 0), 0);
          setLiveInventory(fallbackStock);
        } else {
          setLiveInventory(stock);
        }
      } catch (err) {
        if (!isQuotaError(err)) {
          console.error("Inventory error", err);
        }
        const fallbackStock = staticProducts
          .filter(p => (!p.status || p.status === 'published') && p.type === 'Full-face')
          .reduce((acc, p) => acc + (p.stock || 0), 0);
        setLiveInventory(fallbackStock);
      }
    };

    fetchInventory();
    interval = setInterval(fetchInventory, 60000);

    return () => clearInterval(interval);
  }, []);

  // Mapping of models to their specific parts
  const modelParts: Record<string, string[]> = {
    "Zx10r": ["Radiator grill Evitech", "Frame sliders evotech", "Gb Racing enjin guard"],
    "Z900": ["Radiator grill", "Frame sliders", "Gb Racing enjin guad"],
    "Zx6r": ["Radiator grill Evitech", "Frame sliders evotech", "Gb Racing enjin guard"]
  };

  // Fetch categories from Firestore
  useEffect(() => {
    async function fetchCats() {
      try {
        const q = query(collection(db, "categories"), limit(50));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (data.length > 0) {
          const names = data.map((c: any) => c.name);
          setDbCategories(data);
          // Combine defaults with DB categories, unique only
          setFilterTypes(["All", ...new Set([...defaultFilterTypes.slice(1), ...names])]);
        }
      } catch (error) {
        if (!isQuotaError(error)) {
          console.error("Error fetching categories:", error);
        }
      }
    }
    fetchCats();
  }, []);

  // Suggestions logic
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const matches: { type: 'product' | 'category', text: string, id?: string }[] = [];

    // Match categories
    filterTypes.forEach(type => {
      if (type !== "All" && type.toLowerCase().includes(query)) {
        matches.push({ type: 'category', text: type });
      }
    });

    // Match products
    allProducts.forEach(p => {
      if (p.name.toLowerCase().includes(query)) {
        matches.push({ type: 'product', text: p.name, id: p.id });
      }
    });

    setSuggestions(matches.slice(0, 8)); // Limit suggestions
  }, [searchQuery, allProducts]);

  // Fetch products from Firestore with Pagination
  const fetchLiveProducts = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setIsFetchingMore(true);
      }

      // 1. Build optimized query (SERVER-SIDE FILTERING)
      let q = query(
        collection(db, "products"),
        where("status", "==", "published"), // Only fetch what we need
        orderBy("createdAt", "desc"),
        limit(12) // Limit reads
      );

      if (isLoadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastDoc(newLastDoc);
      
      const newProducts: Product[] = [];
      querySnapshot.forEach((doc) => {
        const p = { id: doc.id, ...doc.data() } as Product;
        // Basic safety check for data integrity
        if (p.image && (p.image.startsWith('http') || p.image.startsWith('data:image'))) {
          newProducts.push(p);
        }
      });

      if (isLoadMore) {
        setAllProducts(prev => [...prev, ...newProducts]);
      } else {
        setAllProducts(newProducts);
      }

      // If we got fewer than the limit, there's no more data
      if (querySnapshot.docs.length < 12) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setIsQuotaExceeded(false);
    } catch (error) {
      console.warn("Error fetching live products, using cache/static fallback:", error);
      setIsQuotaExceeded(true);
      if (!isLoadMore) {
        // Robust caching: Try to load from Firestore cache instead of manual localStorage
        try {
          const q = query(
            collection(db, "products"),
            where("status", "==", "published"),
            orderBy("createdAt", "desc"),
            limit(24)
          );
          const cacheSnapshot = await getDocsFromCache(q);
          if (!cacheSnapshot.empty) {
            const cachedProducts: Product[] = [];
            cacheSnapshot.forEach((doc) => {
              cachedProducts.push({ id: doc.id, ...doc.data() } as Product);
            });
            setAllProducts(cachedProducts.filter(p => p.image && (p.image.startsWith('http') || p.image.startsWith('data:image'))));
          } else {
            setAllProducts(staticProducts.filter(p => (!p.status || p.status === 'published') && p.image && (p.image.startsWith('http') || p.image.startsWith('data:image'))));
          }
        } catch (cacheErr) {
          setAllProducts(staticProducts.filter(p => (!p.status || p.status === 'published') && p.image && (p.image.startsWith('http') || p.image.startsWith('data:image'))));
        }
        setHasMore(false);
      }
    } finally {
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    fetchLiveProducts();
  }, []);

  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam) {
      const types = typeParam.split(",");
      const validTypes = types.filter(t => filterTypes.includes(t as any));
      if (validTypes.length > 0) {
        setSelectedTypes(validTypes);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    // Simulate network delay and debounce filter typing
    const fetchDelay = setTimeout(() => {
      let result = allProducts;
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(p => 
          p.name.toLowerCase().includes(query) || 
          p.description.toLowerCase().includes(query) ||
          p.type.toLowerCase().includes(query)
        );
      }

      if (selectedTypes.length > 0) {
        result = result.filter(p => selectedTypes.includes(p.type));
      }

      if (selectedBrand) {
        const brandQuery = selectedBrand.toLowerCase();
        result = result.filter(p => 
          p.name.toLowerCase().includes(brandQuery) || 
          p.model?.toLowerCase().includes(brandQuery)
        );
      }

      if (selectedPart) {
        // Simple heuristic for part matching
        const partKeywords = selectedPart.toLowerCase().split(' ');
        result = result.filter(p => {
          const name = p.name.toLowerCase();
          // Match at least a significant keyword if not all
          return partKeywords.some(kw => kw.length > 2 && name.includes(kw));
        });
      }
      
      setFilteredProducts(result);
    }, 400);

    return () => clearTimeout(fetchDelay);
  }, [selectedTypes, selectedBrand, selectedPart, searchQuery, allProducts]);

  const toggleTypeFilter = (type: string) => {
    let nextTypes: string[];
    if (selectedTypes.includes(type)) {
      nextTypes = selectedTypes.filter(t => t !== type);
    } else {
      nextTypes = [...selectedTypes, type];
    }
    
    setSelectedTypes(nextTypes);
    
    // Clear brand/part if parent category is deselected
    if (!nextTypes.includes("Full-face") && !nextTypes.includes("Motorcycles") && !nextTypes.includes("Visor") && !nextTypes.includes("visor") && !nextTypes.includes("Accessory")) {
      setSelectedBrand(null);
      setSelectedPart(null);
    }
    
    if (nextTypes.length === 0) {
      setSearchParams(new URLSearchParams());
    } else {
      setSearchParams(new URLSearchParams({ type: nextTypes.join(",") }));
    }
  };

  const seoTitle = selectedTypes.length > 0 
    ? `${selectedTypes.join(", ")} | Shop` 
    : `Shop Collection`;
    
  return (
    <div className="pt-8 pb-24 px-6 max-w-7xl mx-auto w-full">
      <SEO 
        title={`${seoTitle} - ${settings.siteName}`}
        description={`Explore our collection of high-performance motorcycles, helmets, and accessories.`}
      />
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tighter uppercase mb-4">The Collection</h1>
          <p className="text-brand-metallic">Precision engineered gear for every riding style.</p>
          {liveInventory > 0 && (
            <div className="flex items-center gap-2 mt-4 text-[10px] uppercase tracking-widest font-bold text-brand-accent bg-brand-accent/5 border border-brand-accent/20 px-3 py-1.5 w-fit rounded-sm shadow-sm">
              <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
              Live Inventory: {liveInventory} Premium Units Available
            </div>
          )}
        </div>
        
        {/* Trust Badges */}
        <div className="flex gap-4 md:gap-8 bg-white/5 border border-white/10 px-6 py-4 rounded-sm">
          <div className="flex items-center gap-3">
            <Award size={20} className="text-brand-accent" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">ISI Certified</span>
              <span className="text-[9px] uppercase tracking-wider text-brand-metallic hidden sm:block">100% Authentic</span>
            </div>
          </div>
          <div className="w-px bg-white/10 hidden sm:block"></div>
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-brand-accent" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">Secure Payment</span>
              <span className="text-[9px] uppercase tracking-wider text-brand-metallic hidden sm:block">UPI ONLY • PHONEPE • GPAY • PAYTM</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start gap-12">
        {/* Filters Sidebar (Sticky on Desktop) */}
        <div className="w-full md:w-64 flex-shrink-0 md:sticky top-28">
          <div className="flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-widest border-b border-white/10 pb-4">
            <Filter size={18} /> Filters
          </div>

          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs uppercase tracking-widest text-brand-metallic font-bold">Product Categories</h3>
                {selectedTypes.length > 0 && (
                  <button 
                    onClick={() => {
                      setSelectedTypes([]);
                      setSearchParams(new URLSearchParams());
                    }}
                    className="text-[10px] text-brand-accent uppercase tracking-widest font-bold hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {filterTypes.slice(1).map(type => (
                  <div key={type} className="flex flex-col gap-2">
                    <button
                      onClick={() => toggleTypeFilter(type)}
                      className="flex items-center gap-3 text-sm text-left group"
                    >
                      <div className={cn(
                        "w-5 h-5 border flex items-center justify-center transition-colors rounded-sm overflow-hidden",
                        selectedTypes.includes(type) ? "bg-brand-accent border-brand-accent text-white" : "border-white/20 group-hover:border-white/50 bg-white/5"
                      )}>
                        {(() => {
                          const cat = dbCategories.find(c => c.name === type);
                          return cat?.image ? (
                            <StorageImage 
                              src={cat.image} 
                              alt={type} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            selectedTypes.includes(type) && <Check size={12} strokeWidth={4} />
                          );
                        })()}
                      </div>
                      <span className={cn("transition-colors", selectedTypes.includes(type) ? "text-white font-medium" : "text-brand-metallic group-hover:text-white/80")}>
                        {type}
                      </span>
                    </button>

                    {/* Sub-categories for Full-face */}
                    {type === "Full-face" && selectedTypes.includes("Full-face") && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="pl-7 flex flex-col gap-2 pb-2 overflow-hidden"
                      >
                        {["AGV", "SHOEI", "SHARK", "Arai"].map(brand => (
                          <button
                            key={brand}
                            onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                            className={cn(
                              "text-[10px] uppercase tracking-widest font-bold text-left py-1 transition-colors",
                              selectedBrand === brand ? "text-brand-accent" : "text-brand-metallic hover:text-white"
                            )}
                          >
                            {selectedBrand === brand && "• "}{brand}
                          </button>
                        ))}
                      </motion.div>
                    )}

                    {/* Sub-categories for Visor */}
                    {(type === "Visor" || type === "visor") && selectedTypes.includes(type) && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="pl-7 flex flex-col gap-2 pb-2 overflow-hidden"
                      >
                        {["AGV", "SHOEI", "SHARK", "Arai"].map(brand => (
                          <button
                            key={brand}
                            onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                            className={cn(
                              "text-[10px] uppercase tracking-widest font-bold text-left py-1 transition-colors",
                              selectedBrand === brand ? "text-brand-accent" : "text-brand-metallic hover:text-white"
                            )}
                          >
                            {selectedBrand === brand && "• "}{brand}
                          </button>
                        ))}
                      </motion.div>
                    )}

                    {/* Sub-categories for Accessory */}
                    {type === "Accessory" && selectedTypes.includes("Accessory") && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="pl-7 flex flex-col gap-2 pb-2 overflow-hidden"
                      >
                        {["Spoiler", "Helmet Mechanism", "Anti Fog"].map(opt => (
                          <button
                            key={opt}
                            onClick={() => setSelectedBrand(selectedBrand === opt ? null : opt)}
                            className={cn(
                              "text-[10px] uppercase tracking-widest font-bold text-left py-1 transition-colors",
                              selectedBrand === opt ? "text-brand-accent" : "text-brand-metallic hover:text-white"
                            )}
                          >
                            {selectedBrand === opt && "• "}{opt}
                          </button>
                        ))}
                      </motion.div>
                    )}

                    {/* Sub-categories for Motorcycles */}
                    {type === "Motorcycles" && selectedTypes.includes("Motorcycles") && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="pl-7 flex flex-col gap-2 pb-2 overflow-hidden"
                      >
                        {["Zx10r", "Z900", "Zx6r"].map(model => (
                          <div key={model} className="flex flex-col gap-1">
                            <button
                              onClick={() => {
                                setSelectedBrand(selectedBrand === model ? null : model);
                                setSelectedPart(null); // Clear part when model switches
                              }}
                              className={cn(
                                "text-[10px] uppercase tracking-widest font-bold text-left py-1 transition-colors",
                                selectedBrand === model ? "text-brand-accent" : "text-brand-metallic hover:text-white"
                              )}
                            >
                              {selectedBrand === model && "• "}{model}
                            </button>
                            
                            {/* Sub-sub-categories for model parts */}
                            {selectedBrand === model && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="pl-4 flex flex-col gap-1 overflow-hidden"
                              >
                                {modelParts[model].map(part => (
                                  <button
                                    key={part}
                                    onClick={() => setSelectedPart(selectedPart === part ? null : part)}
                                    className={cn(
                                      "text-[8px] uppercase tracking-[0.15em] font-medium text-left py-1 transition-colors",
                                      selectedPart === part ? "text-brand-accent italic" : "text-brand-metallic/70 hover:text-white"
                                    )}
                                  >
                                    {selectedPart === part && "└ "}{part}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-grow w-full">
          {/* Persistent Search Bar */}
          <div className="mb-10 sticky top-24 z-40 bg-brand-black/90 backdrop-blur-md py-4 -mx-4 px-4 border-b border-white/5 md:-mx-6 md:px-6">
            <div className="relative group/search max-w-2xl">
              <input
                type="text"
                placeholder="Search collection by name, description, or type..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full bg-white/5 border border-white/10 px-5 py-4 pl-12 text-sm text-white placeholder:text-brand-metallic focus:outline-none focus:border-brand-accent focus:bg-white/[0.08] transition-all rounded-sm shadow-2xl"
              />
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-metallic group-focus-within/search:text-brand-accent transition-colors" />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all group-hover:scale-110 shadow-lg"
                  title="Clear Search"
                >
                  <X size={16} />
                </button>
              )}

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-brand-gray border border-white/10 shadow-2xl z-50 py-2 divide-y divide-white/5 max-h-[60vh] overflow-y-auto"
                  >
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={`${suggestion.type}-${suggestion.text}-${idx}`}
                        onClick={() => {
                          setSearchQuery(suggestion.text);
                          setShowSuggestions(false);
                          if (suggestion.type === 'category') {
                            toggleTypeFilter(suggestion.text);
                          }
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3 group/item transition-colors"
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-sm flex items-center justify-center",
                          suggestion.type === 'category' ? "bg-brand-accent/10 text-brand-accent" : "bg-white/5 text-brand-metallic"
                        )}>
                          {suggestion.type === 'category' ? <Filter size={14} /> : <Search size={14} />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white group-hover/item:text-brand-accent transition-colors">
                            {suggestion.text}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest text-brand-metallic font-bold">
                            {suggestion.type === 'category' ? 'Category' : 'Product'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

            {filteredProducts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center p-20 bg-white/[0.02] border border-dashed border-white/10 text-center relative overflow-hidden"
              >
                {/* Decorative Background Element */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-white/5 border border-white/10 flex items-center justify-center mb-8 mx-auto rotate-45 group hover:border-brand-accent transition-colors duration-500">
                    <Search size={32} className="text-brand-metallic -rotate-45 group-hover:text-white transition-colors" />
                  </div>
                  
                  <h3 className="text-2xl font-display font-medium uppercase tracking-[0.2em] text-white mb-4">No Products Match Your Specs</h3>
                  <p className="text-brand-metallic text-xs max-w-xs mx-auto leading-relaxed mb-10 uppercase tracking-widest">
                    We couldn't find any products matching your current filters. Try relaxing your search criteria.
                  </p>
                  
                  <button 
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedTypes([]);
                      setSearchParams(new URLSearchParams());
                    }}
                    className="group relative px-8 py-4 bg-white text-black text-[10px] uppercase font-bold tracking-[0.3em] overflow-hidden transition-all hover:bg-brand-accent hover:text-white"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
                      Reset All Filters
                    </span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map((product, idx) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        idx={idx}
                        toggleWishlist={toggleWishlist}
                        isInWishlist={isInWishlist}
                        setQuickViewProduct={setQuickViewProduct}
                        addToCart={addToCart}
                        buyNow={buyNow}
                        navigate={navigate}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Load More Button */}
                {hasMore && !searchQuery && selectedTypes.length === 0 && !isQuotaExceeded && (
                  <div className="mt-16 flex justify-center">
                    <button
                      onClick={() => fetchLiveProducts(true)}
                      disabled={isFetchingMore}
                      className="group relative px-12 py-5 bg-white text-black text-[10px] uppercase font-bold tracking-[0.4em] overflow-hidden transition-all hover:bg-brand-accent hover:text-white disabled:opacity-50"
                    >
                      {isFetchingMore ? (
                        <span className="flex items-center gap-3">
                          <Loader2 size={16} className="animate-spin" />
                          Calibrating...
                        </span>
                      ) : (
                        "Load More Core Assets"
                      )}
                    </button>
                  </div>
                )}

                {isQuotaExceeded && filteredProducts.length > 0 && (
                  <div className="mt-12 p-6 border border-brand-accent/20 bg-brand-accent/5 text-center">
                    <p className="text-[10px] text-brand-accent uppercase tracking-[0.2em] font-bold">
                      MISSION DATA TEMPORARILY OFFLINE (QUOTA EXCEEDED). PLEASE RETRY LATER.
                    </p>
                  </div>
                )}
              </>
            )}
        </div>
      </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-black/90 backdrop-blur-md"
            onClick={() => setQuickViewProduct(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-brand-gray border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row shadow-2xl relative"
            >
              <button 
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 right-4 z-[110] p-2 text-brand-metallic hover:text-white bg-brand-black md:bg-transparent md:border-none border border-white/10 flex items-center justify-center"
              >
                <X size={20} />
              </button>
              
              <div className="w-full md:w-1/2 p-8 bg-white/5 flex items-center justify-center relative min-h-[300px]">
                {quickViewProduct.badge && (
                  <div className="absolute top-6 left-6 bg-brand-accent text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 z-10">
                    {quickViewProduct.badge}
                  </div>
                )}
                {quickViewProduct.image && (
                  <StorageImage 
                    src={quickViewProduct.image} 
                    alt={quickViewProduct.name} 
                    className="max-w-[90%] max-h-[90%] object-contain" 
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
              
              <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                <p className="text-brand-metallic text-[10px] uppercase tracking-widest mb-2 font-bold">{quickViewProduct.type}</p>
                <h2 className="text-2xl md:text-3xl font-display font-medium uppercase tracking-wider mb-4 text-white leading-tight">{quickViewProduct.name}</h2>
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                  <span className="text-2xl font-bold font-display tracking-tight text-white">₹{quickViewProduct.price.toLocaleString('en-IN')}</span>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star size={14} fill="currentColor" />
                    <span className="text-white text-sm font-medium">{quickViewProduct.rating}</span>
                  </div>
                </div>
                
                <p className="text-brand-metallic text-sm leading-relaxed mb-8">{quickViewProduct.description}</p>
                
                <div className="flex flex-col gap-3 mt-auto">
                  <Link 
                    to={`/product/${quickViewProduct.id}`}
                    onClick={() => setQuickViewProduct(null)}
                    className="w-full bg-white text-brand-black text-center py-4 font-bold uppercase tracking-widest text-[10px] hover:bg-brand-accent hover:text-white transition-colors"
                  >
                    View Full Details
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
