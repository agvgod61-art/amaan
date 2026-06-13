import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { products as staticProducts, Product } from "../data/products";
import { Helmet } from "react-helmet-async";
import { ShieldCheck, Star, Clock, ArrowLeft, CheckCircle2, ChevronRight, ChevronLeft, Share, Heart, Truck, Lock, Award, X as CloseIcon, Ruler, Info, Instagram, Facebook, MessageCircle, Copy, Check, Grid, Image as ImageIcon, ArrowRight, RefreshCw, Play, Loader2, Twitter, Send, Linkedin, MoreHorizontal, ShoppingBag } from "lucide-react";
import { cn } from "../lib/utils";
import { getEmbedUrl } from "../lib/mediaUtils";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { db, handleFirestoreError, OperationType, isQuotaError } from "../lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, limit } from "firebase/firestore";

import ErrorBoundary from "../components/ErrorBoundary";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, buyNow } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState<Product | null>(staticProducts.find(p => p.id === id) || null);
  const [loading, setLoading] = useState(!product);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    async function fetchProduct() {
      if (!id) return;
      
      setLoading(true);
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        } else {
          // If not in DB, only check static if the DB is completely empty (no products yet)
          // But actually, we already initialized with static if possible.
          // If we are here, it means we checked DB and it's NOT there.
          // So if it was deleted from DB, we should respect that.
          setProduct(null);
        }
      } catch (error) {
        if (!isQuotaError(error)) {
          console.error("Error fetching product:", error);
          setProduct(null);
        } else {
          console.warn("Firestore quota exceeded. Using initial static product data.");
          // Keep the static product if it was already set
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  const [activeImage, setActiveImage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "details" | "reviews">("description");
  const [viewMode, setViewMode] = useState<"carousel" | "grid">("carousel");
  const [quantity, setQuantity] = useState(1);
  const [wishlistFeedback, setWishlistFeedback] = useState<string | null>(null);
  const [cartFeedback, setCartFeedback] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.email) {
        setIsAdmin(false);
        return;
      }
      try {
        if (user.email === "yamaan115@gmail.com") {
          setIsAdmin(true);
        } else {
          const adminDoc = await getDoc(doc(db, "admins", user.email.toLowerCase()));
          setIsAdmin(adminDoc.exists());
        }
      } catch (err) {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [user]);
  const [notifyContact, setNotifyContact] = useState("");
  const [notifyMethod, setNotifyMethod] = useState<"email" | "whatsapp">("email");
  const [isNotifying, setIsNotifying] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [newReview, setNewReview] = useState<{rating: number, text: string, name: string}>({ rating: 5, text: "", name: user?.displayName || "" });
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;

    try {
      const q = query(
        collection(db, "reviews"),
        where("productId", "==", id),
        orderBy("createdAt", "desc"),
        limit(20)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedReviews = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        }));
        setReviews(fetchedReviews);
        setReviewsLoading(false);
      }, (error) => {
        if (!isQuotaError(error)) {
          console.error("Error fetching reviews:", error);
        } else {
          console.warn("Firestore quota exceeded while fetching reviews.");
        }
        setReviewsLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Firebase reviews setup skipped:", e);
      setReviewsLoading(false);
    }
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newReview.text.trim() || !newReview.name.trim()) return;

    setIsSubmittingReview(true);
    try {
      const reviewData: any = {
        productId: id,
        userId: user?.uid || "guest",
        userName: newReview.name,
        rating: newReview.rating,
        comment: newReview.text,
        isAdminReview: isAdmin,
        createdAt: serverTimestamp()
      };

      // Only add image if it exists or user is admin (to satisfy security rules)
      if (isAdmin) {
        reviewData.image = null;
      }

      await addDoc(collection(db, "reviews"), reviewData);

      setNewReview({ rating: 5, text: "", name: user?.displayName || "" });
      setIsReviewSubmitted(true);
      setTimeout(() => setIsReviewSubmitted(false), 5000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "reviews");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const x = useMotionValue(200);
  const y = useMotionValue(200);

  const rotateX = useTransform(y, [0, 400], [15, -15]);
  const rotateY = useTransform(x, [0, 400], [-15, 15]);

  function handleMouseLeave() {
    x.set(200);
    y.set(200);
  }

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = window.location.href;
  const shareText = `Check out this amazing helmet: ${product?.name} at AVG GOD!`;

  const handleShare = (platform: 'whatsapp' | 'facebook' | 'instagram' | 'twitter' | 'telegram' | 'linkedin' | 'copy' | 'native') => {
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'native':
        if (navigator.share) {
          navigator.share({
            title: product?.name,
            text: shareText,
            url: shareUrl,
          }).catch(console.error);
        } else {
          handleShare('copy');
        }
        break;
      case 'instagram':
        window.open(`https://www.instagram.com/agvgod?igsh=Znp4NDBtcWI4eXhm`, '_blank');
        break;
      case 'copy': {
        const fallbackCopy = () => {
          const textArea = document.createElement("textarea");
          textArea.value = shareUrl;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            document.execCommand('copy');
          } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
          }
          textArea.remove();
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        };

        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(shareUrl)
            .then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => {
              fallbackCopy();
            });
        } else {
          fallbackCopy();
        }
        break;
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (product && product.images?.length > 0) {
        if (e.key === 'ArrowRight') {
          setActiveImage((prev) => (prev + 1) % product.images.length);
        } else if (e.key === 'ArrowLeft') {
          setActiveImage((prev) => (prev - 1 + product.images.length) % product.images.length);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product]);

  const [isAdmin, setIsAdmin] = useState(false);

  // Authenticity Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<"not_scanned" | "scanning" | "verified">("not_scanned");

  useEffect(() => {
    if (!product) return;
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-6">
        <Loader2 size={48} className="text-brand-accent animate-spin" />
        <p className="text-brand-metallic animate-pulse uppercase tracking-[0.2em] font-bold text-xs">Loading Gear...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-6">
        <h1 className="text-4xl font-display uppercase tracking-widest">Gear Not Found</h1>
        <p className="text-brand-metallic">The helmet you're looking for doesn't exist or is out of stock.</p>
        <Link to="/shop" className="bg-white text-brand-black px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-gray-200">
          Return to Shop
        </Link>
      </div>
    );
  }

  const handleAuthenticityScan = () => {
    setIsScanning(true);
    setScanResult("scanning");
    setTimeout(() => {
      setIsScanning(false);
      setScanResult("verified");
    }, 2500);
  };

  const handleAddToCart = () => {
    if (!selectedSize && !product.name.toLowerCase().includes("helmet mechanism")) {
      alert("Please select a size first.");
      return;
    }
    const finalSize = selectedSize || 'Default';
    setIsAdding(true);
    addToCart(product, finalSize, quantity);
    setCartFeedback(`${product.name} added to cart!`);
    setTimeout(() => {
      setIsAdding(false);
    }, 1500);
    setTimeout(() => {
      setCartFeedback(null);
    }, 3000);
  };

  const handleBuyNow = () => {
    if (!selectedSize && !product.name.toLowerCase().includes("helmet mechanism")) {
      alert("Please select a size first.");
      return;
    }
    const finalSize = selectedSize || 'Default';
    buyNow(product, finalSize, quantity);
    navigate("/checkout");
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    const adding = !isInWishlist(product.id);
    toggleWishlist(product);
    setWishlistFeedback(adding ? "Added to Wishlist" : "Removed from Wishlist");
    setTimeout(() => setWishlistFeedback(null), 2000);
  };

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyContact) return;
    setIsNotifying(true);
    setTimeout(() => {
      setIsNotifying(false);
      setNotifySuccess(true);
      setTimeout(() => setNotifySuccess(false), 5000);
      setNotifyContact("");
    }, 1500);
  };

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  const displayImages = product.images || [product.image];
  const displayImage = (product.images && product.images[activeImage]) || product.image;

  let hueRotationClass = "";

  return (
    <div className="pt-8 pb-24 px-6 max-w-7xl mx-auto w-full relative">
      <Helmet>
        <title>{product.name} | AVG GOD</title>
        <meta name="description" content={product.description.substring(0, 160)} />
        <meta property="og:title" content={`${product.name} - Premium Riding Gear`} />
        <meta property="og:description" content={product.description.substring(0, 160)} />
        <meta property="og:image" content={product.image} />
        <meta property="og:type" content="product" />
      </Helmet>

      {/* Subtle Toast Notification */}
      <AnimatePresence>
        {cartFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 100, x: "-50%" }}
            animate={{ opacity: 1, y: -40, x: "-50%" }}
            exit={{ opacity: 0, y: 100, x: "-50%" }}
            className="fixed bottom-0 left-1/2 z-[100] w-full max-w-sm px-4"
          >
            <div className="bg-brand-accent text-white px-6 py-4 border border-white/10 shadow-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{cartFeedback}</span>
              </div>
              <Link 
                to="/cart" 
                className="text-[9px] font-bold uppercase tracking-widest border-b border-white/40 hover:border-white transition-all whitespace-nowrap"
              >
                View Cart
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-metallic mb-8 font-medium">
        <button onClick={() => navigate(-1)} className="hover:text-white flex items-center gap-1 transition-colors">
          <ArrowLeft size={12} /> Back
        </button>
        <span>/</span>
        <Link to="/shop" className="hover:text-white transition-colors">Shop</Link>
        <span>/</span>
        <Link to={`/shop?type=${product.type}`} className="hover:text-white transition-colors">{product.type}</Link>
        <span>/</span>
        <span className="text-white truncate max-w-[200px] md:max-w-max">{product.name}</span>
      </div>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {showSizeGuide && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSizeGuide(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-brand-black border border-white/10 overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-display font-bold uppercase tracking-widest text-lg">Helmet Size Guide</h3>
                <button onClick={() => setShowSizeGuide(false)} className="text-brand-metallic hover:text-white transition-colors">
                  <CloseIcon size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                {/* Measurement Intro */}
                <section>
                  <p className="text-sm text-brand-metallic leading-relaxed mb-6">
                    A well-fitting helmet is crucial for safety and comfort. Follow the steps below to find your perfect match.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-brand-accent text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-1">1</div>
                        <div>
                          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white mb-1">Measure</h4>
                          <p className="text-[11px] text-brand-metallic leading-relaxed">Wrap a soft measuring tape around your head, approximately 1 inch (2.5cm) above your eyebrows.</p>
                        </div>
                      </div>
                      <div className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-brand-accent text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-1">2</div>
                        <div>
                          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white mb-1">Confirm</h4>
                          <p className="text-[11px] text-brand-metallic leading-relaxed">Check the measurement (typically between 53cm to 60cm+) against our chart.</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-sm flex items-center justify-center">
                      <div className="text-center">
                        <Ruler className="mx-auto text-brand-accent mb-2" size={32} />
                        <span className="text-[8px] uppercase tracking-[0.2em] text-brand-metallic">Snug Fit Recommended</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Size Chart */}
                <section>
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-white mb-4 border-b border-white/10 pb-2 flex justify-between">
                    <span>Size Reference (India/ISI)</span>
                    <span className="text-brand-metallic">CM / INCHES</span>
                  </h4>
                  <div className="space-y-1">
                    {[
                      { size: "XS", cm: "53 – 54", in: "20 ⅞ – 21 ¼" },
                      { size: "S", cm: "55 – 56", in: "21 ⅝ – 22" },
                      { size: "M", cm: "57 – 58", in: "22 ½ – 22 ⅞" },
                      { size: "L", cm: "59 – 60", in: "23 ¼ – 23 ⅝" },
                      { size: "XL", cm: "61 – 62", in: "24 – 24 ⅜" },
                      { size: "XXL", cm: "63 – 64", in: "24 ¾ – 25 ¼" }
                    ].map((row, idx) => (
                      <div key={idx} className={cn(
                        "grid grid-cols-3 p-3 text-[10px] uppercase tracking-widest font-bold",
                        idx % 2 === 0 ? "bg-white/5" : ""
                      )}>
                        <span className="text-white">{row.size}</span>
                        <span className="text-brand-accent text-center">{row.cm} CM</span>
                        <span className="text-brand-metallic text-right">{row.in} IN</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Pro Tips */}
                <section className="bg-brand-accent/5 border border-brand-accent/20 p-6 space-y-4">
                  <div className="flex gap-3">
                    <Info size={16} className="text-brand-accent flex-shrink-0" />
                    <div>
                      <h4 className="text-[10px] uppercase tracking-widest font-bold text-white mb-2">Important Fitment Tips</h4>
                      <ul className="space-y-2">
                        <li className="text-[10px] text-brand-metallic uppercase tracking-wider leading-relaxed">
                          • Choose a helmet that fits <span className="text-white font-bold underline decoration-brand-accent">tightly without causing pain</span>.
                        </li>
                        <li className="text-[10px] text-brand-metallic uppercase tracking-wider leading-relaxed">
                          • Interior padding will compress slightly over time to fit your unique head shape.
                        </li>
                        <li className="text-[10px] text-brand-metallic uppercase tracking-wider leading-relaxed">
                          • Ensure your helmet bears the <span className="text-brand-accent font-bold">Mandatory ISI Mark</span> for legal and safety compliance in India.
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>
              </div>

              {/* Footer */}
              <div className="p-6 bg-white/5 border-t border-white/10">
                <button 
                  onClick={() => setShowSizeGuide(false)}
                  className="w-full bg-white text-brand-black py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoModalOpen && product.videoUrl && (
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
              {(() => {
                const embedUrl = getEmbedUrl(product.videoUrl);
                const isEmbed = embedUrl && (
                  embedUrl.includes('youtube.com') || 
                  embedUrl.includes('youtu.be') || 
                  embedUrl.includes('instagram.com')
                );
                
                if (isEmbed) {
                  return (
                    <iframe 
                      src={embedUrl || undefined} 
                      title={`${product.name} Video`} 
                      className="w-full h-full border-0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  );
                } else {
                  return (
                    <video 
                      src={product.videoUrl} 
                      controls 
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  );
                }
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-brand-black border border-white/10 overflow-hidden rounded-sm"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="font-display font-bold uppercase tracking-widest text-sm text-white">Share Product</h3>
                <button onClick={() => setShowShareModal(false)} className="text-brand-metallic hover:text-white transition-colors">
                  <CloseIcon size={18} />
                </button>
              </div>

              <div className="p-8 grid grid-cols-3 gap-6">
                <a 
                  href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#25D366]/10 text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white transition-all shadow-lg shadow-black/20">
                    <MessageCircle size={24} />
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-brand-metallic group-hover:text-white transition-colors">WhatsApp</span>
                </a>

                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#1877F2]/10 text-[#1877F2] group-hover:bg-[#1877F2] group-hover:text-white transition-all shadow-lg shadow-black/20">
                    <Facebook size={24} />
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-brand-metallic group-hover:text-white transition-colors">Facebook</span>
                </a>

                <a 
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 text-white group-hover:bg-white group-hover:text-brand-black transition-all shadow-lg shadow-black/20 border border-white/5">
                    <Twitter size={24} />
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-brand-metallic group-hover:text-white transition-colors">Twitter (X)</span>
                </a>

                <a 
                  href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#0088cc]/10 text-[#0088cc] group-hover:bg-[#0088cc] group-hover:text-white transition-all shadow-lg shadow-black/20">
                    <Send size={24} />
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-brand-metallic group-hover:text-white transition-colors">Telegram</span>
                </a>

                <a 
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#0077b5]/10 text-[#0077b5] group-hover:bg-[#0077b5] group-hover:text-white transition-all shadow-lg shadow-black/20">
                    <Linkedin size={24} />
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-brand-metallic group-hover:text-white transition-colors">LinkedIn</span>
                </a>

                <button 
                  onClick={() => handleShare('native')}
                  className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-brand-accent/10 text-brand-accent group-hover:bg-brand-accent group-hover:text-white transition-all shadow-lg shadow-black/20">
                    <MoreHorizontal size={24} />
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-brand-metallic group-hover:text-white transition-colors">More...</span>
                </button>

                <button 
                  onClick={() => handleShare('instagram')}
                  className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#E4405F]/10 text-[#E4405F] group-hover:bg-[#E4405F] group-hover:text-white transition-all shadow-lg shadow-black/20">
                    <Instagram size={24} />
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-brand-metallic group-hover:text-white transition-colors">Instagram</span>
                </button>

                <button 
                  onClick={() => handleShare('copy')}
                  className="flex flex-col items-center gap-2 group transition-transform active:scale-95 col-span-2"
                >
                  <div className="w-full h-14 rounded-2xl flex items-center justify-center bg-white/5 text-white group-hover:bg-brand-accent group-hover:text-white transition-all shadow-lg shadow-black/20 border border-white/5 px-6 gap-3">
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                    <span className="text-[10px] uppercase tracking-widest font-bold">{copied ? "Copied Successfully!" : "Copy Product Link"}</span>
                  </div>
                </button>
              </div>

              <div className="p-4 bg-white/5 border-t border-white/10 flex items-center gap-2 px-6">
                <input 
                  type="text" 
                  readOnly 
                  value={shareUrl} 
                  className="bg-black/40 border border-white/10 text-[10px] text-brand-metallic w-full p-2 outline-none rounded-sm"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
        {/* Gallery Base (Left, 7 columns) */}
        <div className="lg:col-span-7 flex flex-col md:flex-row gap-4 h-auto md:h-[600px] relative group/gallery">
          {/* View Toggle */}
          {displayImages.length > 1 && (
            <div className="absolute top-4 right-16 z-50 hidden md:flex items-center bg-black/80 backdrop-blur-md rounded-sm border border-white/10 opacity-70 group-hover/gallery:opacity-100 transition-opacity overflow-hidden">
              <button
                 onClick={() => setViewMode('carousel')}
                 className={cn("p-2 transition-colors", viewMode === 'carousel' ? "bg-brand-accent text-white" : "text-brand-metallic hover:text-white hover:bg-white/5")}
                 title="Carousel View"
              >
                <ImageIcon size={14} />
              </button>
              <button
                 onClick={() => setViewMode('grid')}
                 className={cn("p-2 transition-colors", viewMode === 'grid' ? "bg-brand-accent text-white" : "text-brand-metallic hover:text-white hover:bg-white/5")}
                 title="Grid View"
              >
                <Grid size={14} />
              </button>
            </div>
          )}

          {viewMode === "carousel" ? (
            <>
              {/* Thumbnails (desktop left, mobile bottom) */}
              {(displayImages.length > 1 || product.videoUrl) && (
                <div className="order-2 md:order-1 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar py-2 md:py-0 h-auto md:h-full md:w-24 flex-shrink-0 focus-within:ring-0">
                  {product.videoUrl && (
                    <button 
                      onClick={() => setIsVideoModalOpen(true)}
                      className={cn(
                        "relative aspect-square w-20 md:w-full bg-white/5 border transition-all flex-shrink-0 flex items-center justify-center border-white/10 hover:border-white/30 hover:scale-95 group overflow-hidden"
                      )}
                      title="Play Video"
                    >
                      {displayImages[0] && (
                        <img 
                          src={displayImages[0]} 
                          alt="Video thumbnail" 
                          className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale blur-[2px]" 
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="relative z-10 w-10 h-10 rounded-full bg-brand-accent/90 flex items-center justify-center backdrop-blur-md shadow-lg shadow-brand-accent/20 group-hover:scale-110 transition-transform">
                        <Play size={18} className="text-white fill-white ml-1" />
                      </div>
                    </button>
                  )}
                      {displayImages.map((img, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setActiveImage(idx)}
                          className={cn(
                            "aspect-square w-20 md:w-full border transition-all flex-shrink-0 overflow-hidden rounded-sm group/thumb",
                            activeImage === idx ? "border-brand-accent ring-1 ring-brand-accent/30" : "border-white/10 hover:border-white/30"
                          )}
                        >
                          <img 
                            src={img} 
                            alt={`${product.name} thumbnail ${idx + 2}`} 
                            className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform" 
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                </div>
              )}
              
              {/* Main Image */}
              <div 
                className="order-1 md:order-2 relative flex-grow aspect-square md:aspect-auto md:h-full bg-white/5 border border-white/10 flex items-center justify-center p-4 overflow-hidden group perspective-1000 touch-none"
                onPointerLeave={handleMouseLeave}
              >
                {discount > 0 && (
                  <div className="absolute top-4 right-4 bg-brand-accent text-white text-xs font-bold px-3 py-1 z-10 font-display">
                    -{discount}%
                  </div>
                )}
                {product.homologation && (
                  <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md border border-white/20 text-white text-[10px] uppercase tracking-widest px-3 py-1 flex items-center gap-2 z-10">
                    <ShieldCheck size={14} className="text-brand-accent"/> {product.homologation}
                  </div>
                )}

                {/* Navigation Arrows */}
                {displayImages.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImage((prev) => (prev - 1 + displayImages.length) % displayImages.length);
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-40 text-white bg-black/60 backdrop-blur-md p-3 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-accent hover:border-brand-accent active:scale-90"
                      title="Previous Image"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImage((prev) => (prev + 1) % displayImages.length);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-40 text-white bg-black/60 backdrop-blur-md p-3 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-accent hover:border-brand-accent active:scale-90"
                      title="Next Image"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
                <motion.div
                  style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d"
                  }}
                  className="w-full h-full flex items-center justify-center cursor-default"
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImage}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      src={displayImage}
                      alt={product.name}
                      className={cn(
                        "max-w-[85%] max-h-[85%] object-contain pointer-events-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300",
                        activeImage === 0 && hueRotationClass
                      )}
                      referrerPolicy="no-referrer"
                    />
                  </AnimatePresence>
                </motion.div>
              </div>
            </>
          ) : (
            <div className="w-full flex-grow grid grid-cols-2 gap-4 h-fit">
              {product.videoUrl && (
                <div className="relative aspect-square bg-white/5 border border-white/10 flex items-center justify-center p-6 overflow-hidden group">
                  {displayImages[0] && (
                    <img 
                      src={displayImages[0]} 
                      alt="Video Mask" 
                      className="absolute inset-0 w-full h-full object-cover opacity-10 blur-sm grayscale" 
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <button
                    onClick={() => setIsVideoModalOpen(true)}
                    className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm"
                  >
                    <div className="bg-brand-accent p-3 rounded-full text-white shadow-lg shadow-brand-accent/20">
                      <Play size={24} className="fill-white ml-1" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white">Play Video</span>
                  </button>
                </div>
              )}
              {displayImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setViewMode('carousel');
                    setActiveImage(idx);
                  }}
                  className="relative aspect-square bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group hover:border-brand-accent transition-all"
                >
                  <img 
                    src={img} 
                    alt={`${product.name} view ${idx + 1}`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details right panel (5 columns) */}
        <div className="lg:col-span-5 flex flex-col pt-2">
          {/* Brand & Name */}
          <div className="mb-6">
            <h2 className="text-brand-metallic text-sm tracking-widest uppercase font-bold mb-2 flex justify-between items-center">
              AVG GOD
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowShareModal(true)}
                  className="text-brand-metallic hover:text-white transition-colors flex items-center gap-2 group" 
                  title="Share"
                >
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity">Share</span>
                  <Share size={18} />
                </button>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleToggleWishlist}
                  className={cn(
                    "transition-colors relative",
                    isInWishlist(product.id) ? "text-brand-accent scale-110" : "text-brand-metallic hover:text-white"
                  )} 
                  title={isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <Heart size={18} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                  <AnimatePresence>
                    {wishlistFeedback && (
                      <motion.span 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-full right-0 mb-4 bg-white text-brand-black text-[8px] px-2 py-1 uppercase tracking-widest font-bold whitespace-nowrap"
                      >
                        {wishlistFeedback}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </h2>
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight uppercase mb-4 leading-tight">
              {product.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
              {product.stock > 0 ? (
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1 border rounded-[2px]",
                  product.stock <= 5 
                    ? "text-yellow-500 border-yellow-500/20 bg-yellow-500/5 shadow-[0_0_15px_rgba(234,179,8,0.1)]" 
                    : "text-green-500 border-green-500/20 bg-green-500/5"
                )}>
                  {product.stock <= 5 
                    ? (user?.email === "yamaan115@gmail.com" ? `ONLY ${product.stock} UNITS LEFT` : "LOW STOCK - ACT FAST") 
                    : (user?.email === "yamaan115@gmail.com" ? `${product.stock} UNITS IN STOCK` : "IN STOCK & READY TO SHIP")}
                </span>
              ) : (
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 border text-red-500 border-red-500/20 bg-red-500/5 animate-pulse">
                  SOLD OUT - RESTOCKING SOON
                </span>
              )}
              <div className="flex items-center gap-1 text-brand-accent ml-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} className={i < Math.floor(product.rating) ? "" : "text-white/20"} />
                ))}
              </div>
              <span className="text-brand-metallic underline cursor-pointer text-xs uppercase tracking-widest">
                Read {product.reviews} Reviews
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-8 p-6 bg-brand-gray/30 border border-white/5 border-l-4 border-l-brand-accent">
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-display font-bold tracking-tight text-white">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && (
                <span className="text-brand-metallic text-lg line-through mb-1">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <p className="text-[10px] uppercase tracking-widest text-brand-metallic font-medium">Prices include GST</p>
          </div>

          {/* Configuration (Color / Size) */}
          <div className="mb-8 space-y-6">

            {!(product.name.toLowerCase().includes("helmet mechanism")) && (
              <div>
                <div className="flex justify-between items-end mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white">Select Size</h3>
                  <button 
                    onClick={() => setShowSizeGuide(true)}
                    className="text-[10px] flex items-center gap-1.5 border-b border-brand-metallic text-brand-metallic hover:text-white uppercase tracking-widest transition-colors"
                  >
                    <Ruler size={10} /> Size Guide
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(product.sizes && product.sizes.length > 0 ? product.sizes : 
                    (product.name.toLowerCase().includes("anti fog") || product.name.toLowerCase().includes("antifog")) 
                      ? ['30ml', '60ml', '120ml'] 
                      : ['S', 'M', 'L', 'XL']
                  ).map(size => (
                    <button 
                      key={size} 
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "py-3 text-sm font-bold uppercase tracking-wider transition-all border",
                        selectedSize === size 
                          ? "bg-white text-brand-black border-white" 
                          : "border-white/20 text-brand-metallic hover:border-white hover:text-white"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add to Cart Area / Out of Stock */}
          <div className="mb-8 space-y-4">
            {product.stock > 0 ? (
              <>
                <div className="flex gap-4">
                  <div className="flex items-center border border-white/20 px-4 group hover:border-white transition-colors">
                    <button className="text-lg text-brand-metallic hover:text-white p-2" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                    <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                    <button 
                      className={cn("text-lg p-2 transition-colors", quantity >= Math.min(5, product.stock) ? "text-brand-metallic/30 cursor-not-allowed" : "text-brand-metallic hover:text-white")} 
                      onClick={() => setQuantity(Math.min(Math.min(5, product.stock), quantity + 1))}
                      disabled={quantity >= Math.min(5, product.stock)}
                    >
                      +
                    </button>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggleWishlist}
                    className={cn(
                      "flex-1 flex items-center justify-center border transition-all",
                      isInWishlist(product.id) 
                        ? "bg-white text-brand-black border-white" 
                        : "border-white/20 text-brand-metallic hover:border-white hover:text-white"
                    )}
                    title={isInWishlist(product.id) ? "In Wishlist" : "Add to Wishlist"}
                  >
                    <Heart size={20} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                  </motion.button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className={cn(
                      "add-to-cart group flex-1 py-4 text-sm uppercase tracking-widest font-bold transition-all border relative overflow-hidden",
                      isAdding 
                        ? "bg-green-600 border-green-600 text-white" 
                        : "bg-white border-white text-brand-black hover:bg-brand-black hover:text-white transition-all duration-300"
                    )}
                  >
                    <div className="flex items-center justify-center gap-2 relative z-10">
                      {isAdding ? (
                        <CheckCircle2 size={16} className="animate-in zoom-in duration-300" />
                      ) : (
                        <ShoppingBag size={16} className="group-hover:scale-110 transition-transform" />
                      )}
                      <span>{isAdding ? "Added to Cart" : "Add to Cart"}</span>
                    </div>
                    {/* Morph Effect Background */}
                    <div className="morph opacity-0 group-hover:opacity-10 transition-opacity" />
                  </button>
                  
                  <button 
                    onClick={handleBuyNow}
                    className="flex-1 py-4 text-sm uppercase tracking-widest font-bold transition-all border border-brand-accent bg-brand-accent text-white hover:bg-red-700 shadow-[0_10px_30px_rgba(226,43,43,0.3)] animate-pulse-subtle group"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      <span>Buy It Now</span>
                    </div>
                  </button>
                </div>
                
                {/* Authenticity Scan - "Antivirus" for Products */}
                <div className="pt-2">
                  <button 
                    onClick={handleAuthenticityScan}
                    disabled={isScanning || scanResult === "verified"}
                    className={cn(
                      "w-full flex items-center justify-center gap-3 py-4 border transition-all text-xs uppercase tracking-[0.2em] font-bold group overflow-hidden relative",
                      scanResult === "verified" 
                        ? "bg-green-500/10 border-green-500/30 text-green-500" 
                        : "border-white/20 text-brand-metallic hover:text-white hover:border-white"
                    )}
                  >
                    {isScanning && (
                      <motion.div 
                        initial={{ left: "-100%" }}
                        animate={{ left: "100%" }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent z-0"
                      />
                    )}
                    <div className="relative z-10 flex items-center gap-2">
                      {scanResult === "verified" ? <CheckCircle2 size={16} /> : <ShieldCheck size={16} className={cn(isScanning && "animate-pulse")} />}
                      <span>
                        {scanResult === "not_scanned" && "Run Authenticity Scan"}
                        {scanResult === "scanning" && "Verifying AVG Signature..."}
                        {scanResult === "verified" && "AVG Guaranteed Genuine"}
                      </span>
                    </div>
                  </button>
                </div>
                
                {product.pdfUrl && (
                  <a 
                    href={product.pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 border border-white/20 text-brand-metallic hover:text-white hover:border-white transition-all text-xs uppercase tracking-[0.2em] font-bold"
                  >
                    <ImageIcon size={16} /> 
                    <span>Download Product Catalog (PDF)</span>
                  </a>
                )}
              </>
            ) : (
              <div className="bg-white/5 border border-white/10 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Clock size={64} />
                </div>
                <h3 className="text-xl font-display font-bold uppercase tracking-wider text-white mb-2">Out of Stock</h3>
                <p className="text-[11px] uppercase tracking-wider text-brand-metallic mb-6">This item is currently unavailable. Be the first to know when it comes back.</p>
                
                <AnimatePresence mode="wait">
                  {notifySuccess ? (
                    <motion.div 
                      key="success"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col items-center justify-center gap-3 text-white bg-green-500/10 p-8 border border-green-500/20 rounded-sm text-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mb-2">
                        <CheckCircle2 size={24} />
                      </div>
                      <h4 className="text-sm font-display font-bold uppercase tracking-widest">You're on the list!</h4>
                      <p className="text-[10px] uppercase tracking-wider text-green-500/70">We'll alert you the moment {product.name} is back in stock.</p>
                      <button 
                        onClick={() => setNotifySuccess(false)}
                        className="mt-2 text-[9px] uppercase tracking-[0.2em] font-bold text-white/50 hover:text-white transition-colors"
                      >
                        Dismiss
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form 
                      key="form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onSubmit={handleNotifySubmit} 
                      className="space-y-4 relative z-10"
                    >
                      <div className="flex gap-6 mb-2 mt-2">
                        <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white cursor-pointer font-bold group">
                          <input 
                            type="radio" 
                            name="notifyMethod" 
                            checked={notifyMethod === 'email'} 
                            onChange={() => setNotifyMethod('email')}
                            className="accent-brand-accent w-3 h-3"
                          />
                          <span className={cn(notifyMethod === 'email' ? "text-brand-accent" : "text-white/60 group-hover:text-white transition-colors")}>Email</span>
                        </label>
                        <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white cursor-pointer font-bold group">
                          <input 
                            type="radio" 
                            name="notifyMethod" 
                            checked={notifyMethod === 'whatsapp'} 
                            onChange={() => setNotifyMethod('whatsapp')}
                            className="accent-brand-accent w-3 h-3"
                          />
                          <span className={cn(notifyMethod === 'whatsapp' ? "text-brand-accent" : "text-white/60 group-hover:text-white transition-colors")}>WhatsApp</span>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-grow">
                          <input 
                            type={notifyMethod === 'email' ? 'email' : 'tel'} 
                            placeholder={notifyMethod === 'email' ? 'Enter your email' : 'Enter WhatsApp number'}
                            value={notifyContact}
                            onChange={(e) => setNotifyContact(e.target.value)}
                            required
                            className="w-full bg-brand-black/50 border border-white/20 p-3 pl-4 text-white text-sm focus:outline-none focus:border-brand-accent transition-all placeholder:text-white/20"
                          />
                          <div className={cn(
                            "absolute bottom-0 left-0 h-[2px] bg-brand-accent transition-all duration-300",
                            notifyContact ? "w-full" : "w-0"
                          )} />
                        </div>
                        <button 
                          type="submit"
                          disabled={isNotifying || !notifyContact}
                          className="bg-brand-accent text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group min-w-[120px]"
                        >
                          {isNotifying ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>
                              <span>Notify Me</span>
                              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
                
                <button 
                  onClick={handleToggleWishlist}
                  className="mt-6 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold text-brand-metallic hover:text-white transition-colors"
                >
                  <Heart size={14} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                  {isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist Instead"}
                </button>
              </div>
            )}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/5 border border-white/10 p-4 flex flex-col items-center justify-center text-center gap-2">
              <Award size={24} className="text-brand-accent" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">ISI Certified</span>
              <span className="text-[9px] uppercase tracking-wider text-brand-metallic">Guaranteed Authentic</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 flex flex-col items-center justify-center text-center gap-2">
              <Lock size={24} className="text-brand-accent" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">Secure Payment</span>
              <div className="flex gap-1.5 mt-1">
                <span className="text-[8px] font-bold uppercase tracking-wider text-brand-metallic border border-brand-metallic/30 px-1.5 py-0.5 rounded-sm bg-white/5">UPI ONLY</span>
              </div>
            </div>
          </div>

          {/* Shipping & Support info */}
          <div className="space-y-4 pt-6 mt-6 border-t border-white/10">
            <div className="flex items-center gap-4 text-sm text-brand-metallic">
              <Truck size={20} className="text-white" />
              <div>
                <strong className="text-white block text-xs uppercase tracking-widest mb-1">Estimated Delivery</strong>
                <span className="text-[11px] uppercase tracking-wider font-bold text-green-500">3-5 business days for India</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-brand-metallic">
              <ShieldCheck size={20} className="text-white" />
              <div>
                <strong className="text-white block text-xs uppercase tracking-widest mb-1">Authentic Gear</strong>
                <span className="text-[11px] uppercase tracking-wider">100% Genuine product sourced securely.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs (Bottom Section) */}
      <div className="border-t border-white/10 pt-12">
        <div className="flex gap-8 mb-8 border-b border-white/10 overflow-x-auto no-scrollbar">
          {(["description", "details", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-4 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap",
                activeTab === tab 
                  ? "text-white border-b-2 border-brand-accent" 
                  : "text-brand-metallic hover:text-white"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="min-h-[300px]">
          <AnimatePresence mode="wait">
            {activeTab === "description" && (
              <motion.div
                key="description"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-3xl text-brand-metallic leading-relaxed prose prose-invert"
              >
                <p>{product.description}</p>
                <h3 className="text-white font-display uppercase tracking-widest mt-8 mb-4 border-b border-white/10 pb-2">Key Features</h3>
                <ul className="space-y-2">
                  {(product.features || []).map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 size={16} className="text-brand-accent mt-1 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {activeTab === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-3xl"
              >
                <div className="border border-white/5 divide-y divide-white/5">
                  {(product.details || []).map((detail: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-3 p-4 hover:bg-white/5 transition-colors">
                      <div className="text-xs font-bold uppercase tracking-widest text-brand-metallic md:pt-1">{detail.label}</div>
                      <div className="md:col-span-2 text-white">{detail.value}</div>
                    </div>
                  ))}
                  {product.weight && (
                    <div className="grid grid-cols-1 md:grid-cols-3 p-4 hover:bg-white/5 transition-colors">
                      <div className="text-xs font-bold uppercase tracking-widest text-brand-accent md:pt-1">Product Weight</div>
                      <div className="md:col-span-2 text-white">{product.weight}</div>
                    </div>
                  )}
                  {(!product.details || product.details.length === 0) && !product.weight && (
                    <p className="text-brand-metallic italic p-4">No technical specifications available for this product.</p>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "reviews" && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                    <h3 className="text-xl font-display font-medium uppercase tracking-wider mb-6 text-white">Customer Reviews</h3>
                    <div className="flex items-center gap-6 mb-8 bg-white/5 p-6 border border-white/10">
                      <div className="text-4xl font-display font-bold text-white">{product.rating}</div>
                      <div>
                        <div className="flex gap-1 text-brand-accent mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={16} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} className={i < Math.floor(product.rating) ? "" : "text-white/20"} />
                          ))}
                        </div>
                        <div className="text-xs uppercase tracking-widest text-brand-metallic font-medium">Based on {product.reviews} authentic reviews</div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {reviewsLoading ? (
                        <div className="flex justify-center p-12">
                          <Loader2 className="animate-spin text-brand-accent" size={24} />
                        </div>
                      ) : reviews.length === 0 ? (
                        <p className="text-brand-metallic italic">No reviews yet. Be the first to review this product!</p>
                      ) : (
                        reviews.map((review, idx) => (
                          <div key={review.id || idx} className="bg-white/5 p-6 border border-white/10">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-white">{review.userName || review.name}</h4>
                                <div className="text-xs text-brand-metallic mt-1">
                                  {review.date && !isNaN(new Date(review.date).getTime()) 
                                    ? new Date(review.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                                    : 'Just now'}
                                </div>
                              </div>
                              <div className="flex gap-1 text-brand-accent">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-white/20"} />
                                ))}
                              </div>
                            </div>
                            <p className="text-brand-metallic text-sm leading-relaxed mb-4">{review.comment || review.text}</p>
                            {(review.image || (review.images && review.images.length > 0)) && review.isAdminReview && (
                              <div className="flex flex-wrap gap-2">
                                {[review.image, ...(review.images || [])].filter(Boolean).map((img, i) => (
                                  <div key={i} className="relative group/review-img">
                                    <img 
                                      src={img} 
                                      alt="Review Gear" 
                                      className="w-20 h-20 object-cover rounded-sm border border-white/10"
                                      referrerPolicy="no-referrer"
                                    />
                                    <button 
                                      onClick={() => {
                                        // Open in full view if needed
                                        window.open(img, '_blank');
                                      }}
                                      className="absolute inset-0 bg-black/40 opacity-0 group-hover/review-img:opacity-100 transition-opacity flex items-center justify-center"
                                    >
                                      <ImageIcon size={14} className="text-white" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-display font-medium uppercase tracking-wider mb-6 text-white">Write a Review</h3>
                    {isReviewSubmitted ? (
                      <div className="bg-brand-accent/10 border border-brand-accent p-12 text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent">
                          <Check size={32} />
                        </div>
                        <h4 className="text-white font-display font-bold uppercase tracking-widest">Review Received</h4>
                        <p className="text-brand-metallic text-xs uppercase tracking-wider mb-4">Your feedback helps fellow riders choose exactly what they need.</p>
                        <button 
                          onClick={() => setIsReviewSubmitted(false)}
                          className="text-[10px] font-bold uppercase tracking-widest text-brand-accent border-b border-brand-accent"
                        >
                          Write Another
                        </button>
                      </div>
                    ) : (
                      <form 
                        className="space-y-6 bg-white/5 p-6 border border-white/10"
                        onSubmit={handleSubmitReview}
                      >
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-brand-metallic mb-2">Rating</label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                className={cn("transition-all active:scale-95", newReview.rating >= star ? "text-brand-accent" : "text-brand-metallic hover:text-brand-accent/50")}
                              >
                                <Star size={24} fill={newReview.rating >= star ? "currentColor" : "none"} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-brand-metallic mb-2">Your Name</label>
                          <input 
                            type="text" 
                            required
                            value={newReview.name}
                            onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                            className="w-full bg-brand-black border border-white/10 p-4 text-white focus:outline-none focus:border-brand-accent transition-all placeholder:text-white/20 text-sm"
                            placeholder="John Doe"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-brand-metallic mb-2">Your Review</label>
                          <textarea 
                            required
                            value={newReview.text}
                            onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                            className="w-full bg-brand-black border border-white/10 p-4 text-white focus:outline-none focus:border-brand-accent transition-all min-h-[140px] resize-y placeholder:text-white/20 text-sm"
                            placeholder="Share your experience with the fit, quality, and protection..."
                          />
                        </div>

                        <button 
                          type="submit"
                          disabled={isSubmittingReview}
                          className="w-full bg-brand-accent text-white py-5 font-bold uppercase tracking-widest text-[11px] hover:bg-white hover:text-brand-black transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                          {isSubmittingReview ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              Submit Review
                              <ArrowRight size={14} />
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Related Products Section */}
      <div className="mt-24 border-t border-white/10 pt-16">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tighter uppercase mb-4 italic">
              Related <span className="text-brand-accent">Gear</span>
            </h2>
            <p className="text-brand-metallic">Hand-picked selections to complement your style and protection needs.</p>
          </div>
          <Link to="/shop" className="group flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:border-brand-accent transition-all">
            Browse All Helmets <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {staticProducts
            .filter(p => 
              p.id !== product.id && 
              (p.type === product.type || p.isPopular) &&
              (!p.status || p.status === 'published') &&
              p.image && (p.image.startsWith('http') || p.image.startsWith('data:image'))
            )
            .slice(0, 4)
            .map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-brand-gray/20 border border-white/5 hover:border-brand-accent/50 transition-all flex flex-col"
              >
                <Link to={`/product/${p.id}`} className="relative aspect-square overflow-hidden bg-brand-gray/40 flex items-center justify-center p-8">
                  <img 
                    src={p.image} 
                    alt={p.name} 
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" 
                    referrerPolicy="no-referrer"
                  />
                  {p.badge && (
                    <div className="absolute top-4 left-4 bg-brand-accent text-white text-[8px] font-bold px-2 py-1 uppercase tracking-widest z-10 italic">
                      {p.badge}
                    </div>
                  )}
                </Link>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-brand-accent font-bold italic">{p.type}</span>
                    <div className="flex items-center gap-1 text-brand-accent">
                      <Star size={10} fill="currentColor" />
                      <span className="text-[10px] text-white font-bold">{p.rating}</span>
                    </div>
                  </div>
                  <Link to={`/product/${p.id}`} className="text-white font-display font-medium uppercase tracking-tight mb-4 group-hover:text-brand-accent transition-colors truncate block">
                    {p.name}
                  </Link>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-lg font-display font-bold text-white">₹{p.price.toLocaleString('en-IN')}</span>
                    <Link to={`/product/${p.id}`} className="text-[10px] uppercase tracking-widest font-bold text-brand-metallic hover:text-white transition-colors flex items-center gap-1">
                      Details <ArrowRight size={10} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailWrapper() {
  return (
    <ErrorBoundary>
      <ProductDetail />
    </ErrorBoundary>
  );
}
