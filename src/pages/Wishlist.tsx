import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { Star, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export default function Wishlist() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleAddToCart = (product: any) => {
    setAddingId(product.id);
    addToCart(product, "M", 1); // Default to Medium for quick add
    setTimeout(() => setAddingId(null), 1500);
  };

  if (wishlist.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-6">
        <h1 className="text-4xl font-display uppercase tracking-widest text-white">Wishlist Empty</h1>
        <p className="text-brand-metallic">Found a helmet you like? Save it here for later.</p>
        <Link to="/shop" className="bg-white text-brand-black px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-gray-200">
          Go to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-24 px-6 max-w-7xl mx-auto w-full">
      <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tighter uppercase mb-4 text-white">Your Wishlist</h1>
      <p className="text-brand-metallic mb-12 uppercase tracking-widest text-xs">{wishlist.length} Saved Helmets</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {wishlist.map((product) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={product.id}
              className="group flex flex-col border border-white/5 bg-brand-gray/30 hover:bg-brand-gray p-6 transition-all duration-300 relative"
            >
              <button 
                onClick={() => toggleWishlist(product)}
                className="absolute top-4 right-4 z-20 text-brand-metallic hover:text-white transition-colors"
                title="Remove from Wishlist"
              >
                <Trash2 size={18} />
              </button>

              <Link to={`/product/${product.id}`} className="flex-grow">
                <div className="relative aspect-square mb-6 overflow-hidden flex items-center justify-center bg-white/5 p-4 rounded-sm">
                  <span className="text-[14px] text-white/10 uppercase tracking-[0.4em] font-mono">No Preview</span>
                </div>
                <div className="flex flex-col">
                  <h3 className="font-display font-medium text-base uppercase tracking-wider mb-1 line-clamp-2 min-h-[48px]">{product.name}</h3>
                  <p className="text-brand-metallic text-[10px] mb-4 tracking-widest uppercase">{product.type}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-bold text-lg font-display tracking-tight text-white">₹{product.price.toLocaleString('en-IN')}</span>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star size={12} fill="currentColor" />
                      <span className="text-xs text-white ml-1">{product.rating}</span>
                    </div>
                  </div>
                </div>
              </Link>
              
              <div className="mt-6 flex gap-2">
                <button 
                  onClick={() => handleAddToCart(product)}
                  disabled={addingId === product.id}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
                    addingId === product.id 
                      ? "bg-green-500 border-green-500 text-white" 
                      : "bg-brand-accent border-brand-accent text-white hover:bg-red-700"
                  )}
                >
                  {addingId === product.id ? "Added" : <><ShoppingBag size={14} /> Add to Cart</>}
                </button>
                <Link 
                  to={`/product/${product.id}`}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white text-center py-3 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  View <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
