import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Loader2, Package, Clock, ShieldCheck, AlertCircle, MapPin, CreditCard } from "lucide-react";
import { db, isQuotaError } from "../lib/firebase";
import { doc, getDoc, getDocFromCache } from "../lib/firebase";
import { cn } from "../lib/utils";

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("id") || "");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async (id: string) => {
    if (!id.trim()) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const docRef = doc(db, "orders", id.trim());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setOrder(data);
      } else {
        setError("ORDER NOT FOUND. PLEASE CHECK THE ID AND RETRY.");
      }
    } catch (err) {
      if (isQuotaError(err)) {
        console.warn("Firestore quota exceeded while tracking order. Attempting cache.");
        try {
          const docRef = doc(db, "orders", id.trim());
          const cacheSnap = await getDocFromCache(docRef);
          if (cacheSnap.exists()) {
            setOrder({ id: cacheSnap.id, ...cacheSnap.data() });
            setError("VIEWING OFFLINE TRACKING DATA (QUOTA EXCEEDED).");
          } else {
            setError("TRACKING DATABASE TEMPORARILY OFFLINE (QUOTA EXCEEDED).");
          }
        } catch (e) {
          setError("TRACKING DATABASE TEMPORARILY OFFLINE (QUOTA EXCEEDED).");
        }
      } else {
        setError("FAILED TO ACCESS TRACKING DATABASE.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    if (idFromUrl) {
      fetchOrder(idFromUrl);
    }
  }, [searchParams, fetchOrder]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderId);
  };

  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse"></div>
            <h1 className="text-[10px] text-brand-accent uppercase font-bold tracking-[0.5em]">Real-Time Logistics</h1>
          </div>
          <h2 className="text-5xl font-display font-bold uppercase tracking-tighter mb-6">Mission Tracking</h2>
          <p className="text-brand-metallic text-sm uppercase tracking-widest max-w-md mx-auto leading-relaxed">
            Enter your unique Order ID to track the current status of your shipment from our secure facility.
          </p>
        </div>

        <form onSubmit={handleTrack} className="mb-12 relative group">
          <input 
            type="text" 
            value={orderId}
            onChange={(e) => {
              setOrderId(e.target.value.toUpperCase());
              if (error) setError(null);
            }}
            placeholder="ENTER ORDER ID (E.G. ORD-XXXX)"
            className="w-full bg-white/5 border border-white/10 p-6 pr-20 text-white font-mono text-lg focus:border-brand-accent outline-none transition-all placeholder:text-white/10"
          />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 bg-brand-accent text-white px-8 flex items-center justify-center hover:bg-brand-accent/80 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}
          </button>
        </form>

        {error && (
          <div className="bg-brand-accent/5 border border-brand-accent/20 p-8 text-center animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="text-brand-accent mx-auto mb-4" size={32} />
            <p className="text-sm font-bold uppercase tracking-widest text-white">{error}</p>
          </div>
        )}

        {order && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Order Status Header */}
            <div className="bg-white/5 border border-white/10 p-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Package size={120} />
              </div>
              
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                  <div>
                    <p className="text-[10px] text-brand-metallic uppercase font-bold tracking-widest mb-2">Order Identification</p>
                    <h3 className="text-2xl font-mono font-bold text-white tracking-tight">{order.id}</h3>
                  </div>
                  <div className={cn(
                    "px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] rounded-sm border",
                    order.status === 'Processing' ? "border-yellow-500/20 bg-yellow-500/5 text-yellow-500" :
                    order.status === 'Shipped' ? "border-blue-500/20 bg-blue-500/5 text-blue-500" :
                    order.status === 'Delivered' ? "border-green-500/20 bg-green-500/5 text-green-500" :
                    "border-white/20 bg-white/5 text-white"
                  )}>
                    {order.status}
                  </div>
                </div>

                {/* Progress Visual */}
                <div className="grid grid-cols-3 gap-2 mb-12">
                  <div className={cn("h-1", (order.status === 'Processing' || order.status === 'Shipped' || order.status === 'Delivered') ? "bg-brand-accent" : "bg-white/10")}></div>
                  <div className={cn("h-1", (order.status === 'Shipped' || order.status === 'Delivered') ? "bg-brand-accent" : "bg-white/10")}></div>
                  <div className={cn("h-1", order.status === 'Delivered' ? "bg-brand-accent" : "bg-white/10")}></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                        <MapPin size={18} className="text-brand-accent" />
                      </div>
                      <div>
                        <p className="text-[9px] text-brand-metallic uppercase tracking-widest font-bold mb-1">Deployment Destination</p>
                        <p className="text-sm text-white leading-relaxed">{order.shipping_info?.address}, {order.shipping_info?.pincode}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                        <CreditCard size={18} className="text-brand-accent" />
                      </div>
                      <div>
                        <p className="text-[9px] text-brand-metallic uppercase tracking-widest font-bold mb-1">Transaction Method</p>
                        <p className="text-sm text-white font-bold">{order.payment_method}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                        <Clock size={18} className="text-brand-accent" />
                      </div>
                      <div>
                        <p className="text-[9px] text-brand-metallic uppercase tracking-widest font-bold mb-1">Mission Log Arrival</p>
                        <p className="text-sm text-white">
                          {order.created_at?.seconds 
                            ? new Date(order.created_at.seconds * 1000).toLocaleString()
                            : new Date(order.created_at).toLocaleString()
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product List */}
            <div className="bg-white/5 border border-white/10 p-10">
              <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-white mb-8 flex items-center gap-3">
                <Package size={16} className="text-brand-accent" />
                Payload Contents
              </h4>
              <div className="space-y-6">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-6 group/item pb-6 border-b border-white/5 last:border-0 last:pb-0">
                    <div className="w-16 h-16 bg-black p-2 border border-white/5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {item.product?.image ? (
                        <img 
                          src={item.product.image} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-[8px] text-white/20 uppercase tracking-widest font-mono">ITEM</span>
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-bold uppercase tracking-tight text-white mb-1">{item.product?.name}</p>
                      <p className="text-[10px] text-brand-metallic uppercase tracking-widest">
                        Configuration: {item.size} <span className="mx-2">•</span> Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-brand-metallic uppercase tracking-widest mb-1">Price</p>
                      <p className="text-sm font-mono font-bold text-white">₹{(item.product?.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-end">
                <div>
                   <p className="text-[9px] text-brand-metallic uppercase tracking-widest font-bold mb-1">Total Payload Value</p>
                   <p className="text-3xl font-display font-bold text-white">₹{order.total_amount.toLocaleString()}</p>
                </div>
                <button className="text-[10px] text-brand-accent font-bold uppercase tracking-widest border border-brand-accent/20 px-6 py-3 hover:bg-brand-accent hover:text-white transition-all">
                  Full Logistics Report
                </button>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Link to="/contact" className="text-[10px] text-brand-metallic font-bold uppercase tracking-[0.2em] border-b border-white/10 pb-1 hover:text-white hover:border-brand-accent transition-all">
                Dispute Mission Outcome? Contact Command
              </Link>
            </div>
          </div>
        )}

        {!order && !loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="bg-white/5 border border-white/10 p-8 hover:bg-white/10 transition-all">
              <ShieldCheck className="text-brand-accent mb-4" size={24} />
              <h4 className="text-sm font-bold uppercase tracking-tight mb-2">Secure Search</h4>
              <p className="text-[10px] text-brand-metallic uppercase tracking-widest leading-relaxed">
                Your data is protected by military-grade encryption. Only those with the valid ID can access status.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 hover:bg-white/10 transition-all">
              <Loader2 className="text-brand-accent mb-4" size={24} />
              <h4 className="text-sm font-bold uppercase tracking-tight mb-2">Live Updates</h4>
              <p className="text-[10px] text-brand-metallic uppercase tracking-widest leading-relaxed">
                Statuses are updated in real-time as our logistics crew processes your order.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
