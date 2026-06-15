import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, Clock, ShieldCheck, Search, ChevronRight, Loader2, AlertCircle, ShoppingBag, ChevronDown, ChevronUp, MapPin, CreditCard } from "lucide-react";
import { db, handleFirestoreError, OperationType, isQuotaError } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy, limit, getDocsFromCache } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export default function OrderHistory() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      // If not logged in, we can't show history, but we could allow "Track by ID"
      // For now, let's redirect to login for a secure Portal experience
      navigate("/auth?redirect=/order-history");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.email) return;
      
      setLoading(true);
      setError(null);
      const ordersPath = "orders";
      
      try {
        // Query by email to find all orders associated with this rider
        const q = query(
          collection(db, ordersPath),
          where("user_email", "==", user.email),
          orderBy("created_at", "desc"),
          limit(20)
        );
        
        const querySnapshot = await getDocs(q);
        const ordersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setOrders(ordersData);
      } catch (err: any) {
        if (isQuotaError(err)) {
          console.warn("Quota exceeded in OrderHistory. Attempting cache fallback.");
          try {
            const q = query(
              collection(db, ordersPath),
              where("user_email", "==", user.email),
              orderBy("created_at", "desc"),
              limit(20)
            );
            const cacheSnap = await getDocsFromCache(q);
            if (!cacheSnap.empty) {
              setOrders(cacheSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
              setError("VIEWING OFFLINE ORDER HISTORY (QUOTA EXCEEDED).");
            } else {
              setError("MISSION DATA TEMPORARILY OFFLINE (QUOTA EXCEEDED). PLEASE RETRY LATER.");
            }
          } catch (e) {
            setError("MISSION DATA TEMPORARILY OFFLINE (QUOTA EXCEEDED). PLEASE RETRY LATER.");
          }
          setLoading(false);
          return;
        }
        
        console.error("Error fetching orders:", err);
        // If it's an index error, we might need to handle it or provide a fallback
        if (err.message?.includes("index")) {
          // Fallback query if index isn't ready
          const qSimple = query(
            collection(db, ordersPath),
            where("user_email", "==", user.email)
          );
          const qSnapSimple = await getDocs(qSimple);
          setOrders(qSnapSimple.docs.map(d => ({ id: d.id, ...d.data() })));
        } else {
          setError("FAILED TO RETRIEVE ORDER DATA");
          handleFirestoreError(err, OperationType.LIST, ordersPath);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-brand-accent mx-auto mb-4" size={32} />
          <p className="text-[10px] text-brand-metallic uppercase tracking-[0.3em] font-bold animate-pulse">Scanning Neural Engine...</p>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 bg-brand-accent rounded-full"></div>
              <h1 className="text-[10px] text-brand-accent uppercase font-bold tracking-[0.4em]">Rider Portal</h1>
            </div>
            <h2 className="text-5xl font-display font-bold uppercase tracking-tighter">Order History</h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <p className="text-[9px] text-brand-metallic uppercase tracking-widest leading-none">Logged in as</p>
               <p className="text-xs font-bold text-white lowercase mt-1">{user?.email}</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
               <ShieldCheck size={18} className="text-brand-accent" />
             </div>
          </div>
        </div>

        {/* Search and Navigation */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-metallic group-focus-within:text-brand-accent transition-colors" size={18} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (error) setError(null);
              }}
              placeholder="SEARCH MISSIONS BY ORDER ID..."
              className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-white text-xs font-bold uppercase tracking-widest focus:border-brand-accent outline-none transition-all"
            />
          </div>
          <Link 
            to="/track" 
            className="bg-white/5 border border-white/10 px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <Package size={16} />
            Global Tracking
          </Link>
        </div>

        {error ? (
          <div className="bg-brand-accent/5 border border-brand-accent/20 p-8 text-center rounded-sm">
            <AlertCircle className="text-brand-accent mx-auto mb-4" size={32} />
            <p className="text-sm font-bold uppercase tracking-widest text-white mb-2">{error}</p>
            <p className="text-xs text-brand-metallic uppercase tracking-widest">Please try again later or contact squadron support.</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white/5 border border-white/10 p-20 text-center rounded-sm">
             <ShoppingBag className="text-brand-metallic/20 mx-auto mb-6" size={64} />
             <h3 className="text-xl font-display font-bold uppercase tracking-tight mb-4">No Missions Recorded</h3>
             <p className="text-brand-metallic text-sm uppercase tracking-widest mb-8">You haven't placed any orders yet.</p>
             <Link 
               to="/shop" 
               className="inline-block bg-brand-accent text-white px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-brand-accent/80 transition-all shadow-[0_0_30px_rgba(255,51,51,0.2)]"
             >
               Browse Helmets
             </Link>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white/5 border border-white/10 p-20 text-center rounded-sm">
             <Search className="text-brand-metallic/20 mx-auto mb-6" size={64} />
             <h3 className="text-xl font-display font-bold uppercase tracking-tight mb-4">No Matches Found</h3>
             <p className="text-brand-metallic text-sm uppercase tracking-widest mb-8">Adjust your search term and try again.</p>
             <button onClick={() => setSearchTerm("")} className="text-xs font-bold uppercase tracking-widest text-brand-accent border-b border-brand-accent pb-1">Show All Missions</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {filteredOrders?.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                
                return (
                  <div 
                    key={order.id} 
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    className={cn(
                      "group bg-white/5 border border-white/10 p-6 md:p-8 hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden",
                      isExpanded && "border-brand-accent/50 bg-white/[0.07]"
                    )}
                  >
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-4">
                           <span className={cn(
                             "text-[10px] font-mono px-2 py-1 font-bold uppercase transition-colors",
                             isExpanded ? "bg-brand-accent text-white" : "bg-brand-accent/10 text-brand-accent"
                           )}>{order.id}</span>
                           <div className="flex items-center gap-2 text-[9px] text-brand-metallic uppercase font-bold tracking-widest">
                              <Clock size={12} />
                              {order.created_at?.seconds 
                                ? new Date(order.created_at.seconds * 1000).toLocaleDateString()
                                : new Date(order.created_at).toLocaleDateString()
                              }
                           </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                           <div className={cn(
                             "px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full border",
                             order.status === 'Processing' ? "border-yellow-500/20 bg-yellow-500/5 text-yellow-500" :
                             order.status === 'Shipped' ? "border-blue-500/20 bg-blue-500/5 text-blue-500" :
                             order.status === 'Delivered' ? "border-green-500/20 bg-green-500/5 text-green-500" :
                             "border-red-500/20 bg-red-500/5 text-red-500"
                           )}>
                             {order.status}
                           </div>
                           <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full border border-white/10 bg-white/5 text-brand-metallic">
                             {order.payment_method}
                           </div>
                        </div>
                      </div>

                      <div className="flex flex-row items-center justify-between w-full md:w-auto gap-8">
                        <div className="text-left md:text-right">
                          <p className="text-[10px] text-brand-metallic uppercase tracking-widest mb-1">Total Amount</p>
                          <p className="text-2xl font-display font-bold">₹{order.total_amount.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/5 p-2 rounded-sm text-brand-metallic group-hover:text-brand-accent transition-colors">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <div className="mt-8 pt-8 border-t border-white/5 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-6">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-accent mb-4">Payload Contents</h4>
                                <div className="space-y-4">
                                  {order.items?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-4 text-white p-3 bg-white/5 border border-white/5">
                                      <div className="w-12 h-12 bg-black border border-white/10 flex items-center justify-center overflow-hidden">
                                        {item.product?.image ? (
                                          <img 
                                            src={item.product.image} 
                                            alt={item.product.name} 
                                            className="w-full h-full object-cover" 
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <span className="text-[8px] text-white/20 uppercase tracking-tighter">PKG</span>
                                        )}
                                      </div>
                                      <div className="flex-grow">
                                        <p className="text-sm font-bold uppercase tracking-tight">{item.product?.name}</p>
                                        <p className="text-[9px] text-brand-metallic font-mono uppercase mt-1">[{item.size}] x{item.quantity}</p>
                                      </div>
                                      <p className="text-sm font-mono font-bold">₹{(item.product?.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-6 md:border-l border-white/5 md:pl-8">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-accent mb-4">Mission Intelligence</h4>
                                <div className="space-y-4">
                                  <div className="flex items-start gap-4">
                                    <MapPin size={16} className="text-brand-accent mt-1" />
                                    <div>
                                      <p className="text-[9px] text-brand-metallic uppercase tracking-widest font-bold mb-1">Destination Address</p>
                                      <p className="text-sm text-white leading-relaxed">{order.shipping_info?.address}, {order.shipping_info?.pincode}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-4">
                                    <CreditCard size={16} className="text-brand-accent mt-1" />
                                    <div>
                                      <p className="text-[9px] text-brand-metallic uppercase tracking-widest font-bold mb-1">Payment Strategy</p>
                                      <p className="text-sm text-white">{order.payment_method}</p>
                                    </div>
                                  </div>
                                  <div className="pt-4 flex gap-4">
                                    <Link 
                                      to={`/track?id=${order.id}`}
                                      className="flex-grow bg-white/[0.03] border border-white/10 hover:border-brand-accent/50 text-white text-[9px] font-bold uppercase tracking-widest p-4 text-center transition-all flex items-center justify-center gap-2"
                                    >
                                      <ShieldCheck size={14} className="text-brand-accent" />
                                      Live Tracking Docs
                                    </Link>
                                    <a 
                                      href={`https://wa.me/918292908076?text=Regarding mission ${order.id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="bg-brand-accent/10 border border-brand-accent/20 hover:bg-brand-accent text-brand-accent hover:text-white p-4 transition-all"
                                    >
                                      <ChevronRight size={18} />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-20 border-t border-white/5 pt-12 text-center">
           <p className="text-[10px] text-brand-metallic uppercase tracking-[0.3em] font-bold mb-6">Need Immediate Assistance?</p>
           <Link 
             to="/contact" 
             className="text-xs font-bold uppercase tracking-widest border-b border-brand-accent pb-1 hover:text-brand-accent transition-colors"
           >
             Contact Command Center
           </Link>
        </div>
      </div>
    </div>
  );
}
