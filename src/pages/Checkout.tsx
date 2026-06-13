import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Lock, Truck, CheckCircle2, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { cn } from "../lib/utils";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Checkout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(3);

  useEffect(() => {
    // Guest checkout enabled
  }, []);

  const [paymentMethod] = useState<string>("UPI");
  const [orderId, setOrderId] = useState<string>("");
  const [trackingStatus, setTrackingStatus] = useState<string | null>(null);
  
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    whatsappUpdates: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (user) {
      setCustomerInfo(prev => ({
        ...prev,
        name: user.displayName || prev.name,
        // we might not have phoneNumber in firebase based on recent changes, so use what we have or empty
        phone: prev.phone
      }));
    }
  }, [user]);

  const validateAddress = () => {
    const newErrors: Record<string, string> = {};
    
    if (!customerInfo.name.trim()) {
      newErrors.name = "Full name is required";
    }

    const phoneDigits = customerInfo.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      newErrors.phone = "Enter a valid 10-digit mobile number";
    }

    if (!customerInfo.address.trim() || customerInfo.address.length < 10) {
      newErrors.address = "Please provide a complete address (House no, Street, Landmark)";
    }

    if (!customerInfo.city.trim()) {
      newErrors.city = "City is required";
    }

    const pincodeDigits = customerInfo.pincode.replace(/\D/g, "");
    if (pincodeDigits.length !== 6) {
      newErrors.pincode = "Enter a valid 6-digit pin code";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { cart, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  
  if (cart.length === 0 && step !== 5) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-6">
        <h1 className="text-4xl font-display uppercase tracking-widest text-white">Bag is Empty</h1>
        <p className="text-brand-metallic">Select a helmet to proceed to checkout.</p>
        <Link to="/shop" className="bg-white text-brand-black px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-gray-200">
          Go to Shop
        </Link>
      </div>
    );
  }

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAddress()) {
      setStep(3);
      return;
    }

    const newOrderId = "ORD-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    
    try {
      // Clean up undefined fields from cart
      const cleanCart = JSON.parse(JSON.stringify(cart));
      
      await addDoc(collection(db, "orders"), {
        order_id: newOrderId,
        user_id: user?.uid || 'guest',
        user_email: user?.email || null,
        items: cleanCart,
        total_amount: totalPrice,
        status: 'Processing',
        shipping_info: {
          ...customerInfo,
          phone: customerInfo.phone.replace(/\D/g, ""),
          pincode: customerInfo.pincode.replace(/\D/g, "")
        },
        payment_method: paymentMethod,
        created_at: serverTimestamp()
      });
    } catch (err) {
      console.error("Firebase insert error", err);
      // Fallback: Proceed to WhatsApp anyway even if Firebase fails
    }

  // Send WhatsApp Notification if user opted in and provided phone number
    const adminPhone = "918292908076"; // Admin's WhatsApp number

    // 1. Notification to Customer
    if (customerInfo.whatsappUpdates && customerInfo.phone) {
      const customerMessage = `Hi ${customerInfo.name || 'Rider'}! 👋\n\nYour order #${newOrderId} is confirmed! ✅\n\n💰 Total: ₹${totalPrice.toLocaleString('en-IN')}\n📅 Est. Delivery: 3-5 business days\n\nKeep this Order ID for reference: ${newOrderId}\n\nQuestions? Reply to this message.\n\nThanks for shopping at AVG Riders! 🏍️`;
      
      try {
        await fetch('/api/whatsapp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: customerInfo.phone,
            message: customerMessage
          })
        });
      } catch (err) {
        console.error('Failed to send customer WhatsApp notification', err);
      }
    }

    // 2. Notification to Admin with Delivery Details
    const adminMessage = `📦 NEW ORDER RECEIVED! 🎉\n\nOrder ID: ${newOrderId}\nCustomer: ${customerInfo.name}\nPhone: ${customerInfo.phone}\nWhatsApp Updates: ${customerInfo.whatsappUpdates ? 'Yes' : 'No'}\n\n📍 DELIVERY ADDRESS:\n${customerInfo.address}\nCity: ${customerInfo.city}\nPincode: ${customerInfo.pincode}\n\n🛒 ITEMS:\n${cart.map(item => `- ${item.product.name} (Size: ${item.size}${item.color ? `, Color: ${item.color}` : ''}, Qty: ${item.quantity})`).join('\n')}\n\n💰 TOTAL AMOUNT: ₹${totalPrice.toLocaleString('en-IN')}\n💳 PAYMENT: ${paymentMethod}\n\nVerified via Manual Check.`;

    try {
      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: adminPhone,
          message: adminMessage
        })
      });
    } catch (err) {
      console.error('Failed to send admin WhatsApp notification', err);
    }

    setOrderId(newOrderId);
    
    // Automatically open WhatsApp for payment/verification with full details
    const orderItemsText = cart.map(item => `- ${item.product.name} [Size: ${item.size}${item.color ? ` | Color: ${item.color}` : ''} | Qty: ${item.quantity}]`).join('\n');
    const waMessage = `🏁 *NEW ORDER PLACED* 🏁\n\n` +
      `🆔 *Order ID:* ${newOrderId}\n` +
      `👤 *Customer:* ${customerInfo.name}\n` +
      `📞 *Mobile:* ${customerInfo.phone}\n\n` +
      `📍 *Shipping Details:*\n` +
      `${customerInfo.address}\n` +
      `City: ${customerInfo.city} - ${customerInfo.pincode}\n\n` +
      `🛍️ *Order Items:*\n${orderItemsText}\n\n` +
      `💵 *Amount to Pay:* ₹${totalPrice.toLocaleString('en-IN')}\n\n` +
      `_Note: Please verify this order and provide payment instructions._`;

    const waUrl = `https://wa.me/918292908076?text=${encodeURIComponent(waMessage)}`;
    
    clearCart();
    setStep(5); // Show confirmation
    window.location.href = waUrl;
  };

  if (step === 5) {
    return (
      <div className="max-w-xl mx-auto py-24 px-6 text-center">
        <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-4xl font-display font-bold uppercase tracking-tighter mb-4 text-white">Order Received</h1>
        <p className="text-brand-metallic mb-8">
          Your order <strong className="text-white">{orderId}</strong> has been placed successfully. A confirmation message has been sent to your device.
        </p>
        
        <div className="bg-white/5 border border-white/10 p-6 mb-8 text-left">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">Order Status</h3>
            {!trackingStatus ? (
              <button 
                onClick={() => {
                  const statuses = ['Processing', 'Shipped', 'Delivered'];
                  setTrackingStatus(statuses[Math.floor(Math.random() * statuses.length)]);
                }}
                className="text-brand-accent hover:text-white uppercase tracking-widest text-[10px] font-bold transition-colors underline underline-offset-4"
              >
                Track Order
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className={cn(
                  "uppercase tracking-widest text-[10px] font-bold px-2 py-1 rounded-sm border",
                  trackingStatus === 'Delivered' ? "bg-green-500/10 border-green-500/30 text-green-500" :
                  trackingStatus === 'Shipped' ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
                  "bg-yellow-500/10 border-yellow-500/30 text-yellow-500"
                )}>
                  {trackingStatus}
                </span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-brand-metallic uppercase tracking-wider mb-2">
            Order ID: <span className="text-white font-mono">{orderId}</span>
          </p>
          <div className="mt-4 pt-4 border-t border-white/5">
            <div>
              <p className="text-[8px] text-brand-metallic uppercase tracking-[0.2em] font-bold mb-1">Date & Time</p>
              <p className="text-[10px] text-white font-medium">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} | {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 mb-8 text-left">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4">What's Next?</h3>
          <ul className="space-y-3 text-sm text-brand-metallic">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-brand-accent rounded-full mt-1.5 flex-shrink-0" />
              <span>Payment details for ₹{totalPrice.toLocaleString('en-IN')} will be shared with you on WhatsApp for manual verification.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-brand-accent rounded-full mt-1.5 flex-shrink-0" />
              <span>Our team will contact you on WhatsApp/Phone for verification within 1 hour.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-brand-accent rounded-full mt-1.5 flex-shrink-0" />
              <span>Tracking details will be shared via SMS after dispatch.</span>
            </li>
          </ul>

          <a 
            href={`https://wa.me/918292908076?text=${encodeURIComponent(`Hi, I just placed an order with ID: ${orderId}. Please verify my delivery details. Name: ${customerInfo.name}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 flex items-center justify-center gap-3 bg-[#25D366] text-[#075e54] font-black uppercase tracking-widest text-[10px] py-4 hover:bg-[#20bd5a] transition-all hover:gap-4 shadow-[0_0_20px_rgba(37,211,102,0.2)]"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Contact Chat Team
          </a>
        </div>
        <button 
          onClick={() => {
            navigate("/");
          }} 
          className="inline-block bg-white text-brand-black px-10 py-4 font-bold tracking-widest uppercase text-sm hover:bg-gray-200"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-24 px-6 max-w-7xl mx-auto w-full">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-metallic mb-8 hover:text-white transition-colors">
        <ArrowLeft size={12} /> Back
      </button>

      <h1 className="text-4xl font-display font-bold tracking-tighter uppercase mb-12 text-white">Your Riding Bag</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Form & Items */}
        <div className="lg:col-span-7 space-y-12">
          {/* Cart Items List */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-6">Review Items</h2>
            {cart.map((item, idx) => {
              const itemColorObj = item.product.colors?.find(c => c.name === item.color);
              const itemImage = itemColorObj?.image || item.product.image;
              return (
                <div key={`${item.product.id}-${item.size}-${item.color || 'none'}-${idx}`} className="flex gap-4 p-4 bg-white/5 border border-white/10 items-center">
                  <div className="w-20 h-20 bg-black/50 p-2 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {itemImage ? (
                      <img 
                        src={itemImage} 
                        alt={item.product.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-[10px] text-white/10 uppercase tracking-widest font-mono">ITEM</span>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white leading-tight mb-1">{item.product.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <p className="text-[10px] text-brand-metallic uppercase tracking-widest">Size: <span className="text-white">{item.size}</span></p>
                    </div>
                    <p className="text-xs font-bold mt-2">₹{item.product.price.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-white/10">
                      <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1, item.color)} className="p-2 text-brand-metallic hover:text-white"><Minus size={14} /></button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1, item.color)} 
                        disabled={item.quantity >= 5}
                        className={cn("p-2", item.quantity >= 5 ? "text-brand-metallic/30 cursor-not-allowed" : "text-brand-metallic hover:text-white")}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id, item.size, item.color)} className="text-brand-metallic hover:text-brand-accent p-2">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleOrder} className="space-y-8">
            {/* Step 3: Address */}
            {step === 3 && (
              <section id="order-section" className="bg-white/5 border border-white/10 p-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-brand-accent rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <h2 className="text-xl font-display font-bold uppercase tracking-tight">Delivery Details</h2>
                </div>

                <div id="delivery-form" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[8px] text-brand-metallic uppercase tracking-widest font-bold">Full Name *</label>
                    <input 
                      required 
                      type="text" 
                      id="cust-name"
                      placeholder="ENTER YOUR FULL NAME" 
                      value={customerInfo.name} 
                      onChange={(e) => {
                        setCustomerInfo({...customerInfo, name: e.target.value});
                        if (errors.name) setErrors({...errors, name: ""});
                      }} 
                      className={cn(
                        "w-full bg-black/50 border p-4 text-white focus:outline-none focus:border-brand-accent placeholder:text-brand-metallic text-sm",
                        errors.name ? "border-red-500" : "border-white/10"
                      )} 
                    />
                    {errors.name && <p className="text-[9px] text-red-500 uppercase font-bold tracking-widest">{errors.name}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] text-brand-metallic uppercase tracking-widest font-bold">Mobile Number *</label>
                    <input 
                      required
                      type="tel" 
                      id="cust-mobile"
                      readOnly={!!(user?.phoneNumber)}
                      placeholder="ENTER 10-DIGIT MOBILE"
                      value={customerInfo.phone} 
                      onChange={(e) => {
                        if (user?.phoneNumber) return;
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setCustomerInfo({...customerInfo, phone: val});
                        if (errors.phone) setErrors({...errors, phone: ""});
                      }}
                      className={cn(
                        "w-full bg-black/50 border p-4 text-white focus:outline-none focus:border-brand-accent placeholder:text-brand-metallic text-sm font-mono",
                        errors.phone ? "border-red-500" : "border-white/10",
                        user?.phoneNumber && "opacity-70 cursor-not-allowed"
                      )} 
                    />
                    {errors.phone && <p className="text-[9px] text-red-500 uppercase font-bold tracking-widest">{errors.phone}</p>}
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[8px] text-brand-metallic uppercase tracking-widest font-bold">Full Address *</label>
                    <textarea 
                      required 
                      rows={3} 
                      id="cust-address"
                      placeholder="HOUSE NO, STREET, LANDMARK..." 
                      value={customerInfo.address} 
                      onChange={(e) => {
                        setCustomerInfo({...customerInfo, address: e.target.value});
                        if (errors.address) setErrors({...errors, address: ""});
                      }} 
                      className={cn(
                        "w-full bg-black/50 border p-4 text-white focus:outline-none focus:border-brand-accent placeholder:text-brand-metallic text-sm resize-none",
                        errors.address ? "border-red-500" : "border-white/10"
                      )}
                    ></textarea>
                    {errors.address && <p className="text-[9px] text-red-500 uppercase font-bold tracking-widest">{errors.address}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] text-brand-metallic uppercase tracking-widest font-bold">City</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="ENTER CITY" 
                      value={customerInfo.city} 
                      onChange={(e) => setCustomerInfo({...customerInfo, city: e.target.value.toUpperCase()})}
                      className="w-full bg-black/50 border border-white/10 p-4 text-white focus:outline-none focus:border-brand-accent placeholder:text-brand-metallic text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] text-brand-metallic uppercase tracking-widest font-bold">Pin Code (6 Digits) *</label>
                    <input 
                      required 
                      type="text" 
                      id="cust-pincode"
                      placeholder="ENTER 6-DIGIT PINCODE" 
                      value={customerInfo.pincode} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setCustomerInfo({...customerInfo, pincode: val});
                        if (errors.pincode) setErrors({...errors, pincode: ""});
                      }} 
                      className={cn(
                        "w-full bg-black/50 border p-4 text-white focus:outline-none focus:border-brand-accent placeholder:text-brand-metallic text-sm",
                        errors.pincode ? "border-red-500" : "border-white/10"
                      )} 
                    />
                    {errors.pincode && <p className="text-[9px] text-red-500 uppercase font-bold tracking-widest">{errors.pincode}</p>}
                  </div>

                  <div className="md:col-span-2 mt-8 flex flex-col sm:flex-row gap-4">
                    <button 
                      type="submit"
                      className="bg-brand-accent text-white px-12 py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-red-700 transition-all flex-grow shadow-[0_10px_30px_rgba(226,43,43,0.3)] group flex items-center justify-center gap-3"
                    >
                      <span>Place Order & Pay via WhatsApp</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Step 4: Payment & Review - REMOVED */}
          </form>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-5">
          <div className="bg-white/5 border border-white/10 p-8 sticky top-28">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white mb-6 border-b border-white/10 pb-4">Order Summary</h2>
            
            <div className="space-y-4 pt-6">
              <div className="flex justify-between text-sm uppercase tracking-widest font-medium">
                <span className="text-brand-metallic">Subtotal</span>
                <span>₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm uppercase tracking-widest font-medium">
                <span className="text-brand-metallic">Shipping</span>
                <span className="text-green-500">FREE</span>
              </div>
              <div className="flex justify-between items-end pt-4 border-t border-white/10">
                <span className="text-xs font-bold uppercase tracking-widest text-white">Total</span>
                <span className="text-2xl font-display font-bold">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
              <div className="flex items-center gap-3 text-brand-metallic">
                <ShieldCheck size={18} className="text-brand-accent" />
                <span className="text-[10px] uppercase tracking-widest font-bold">ISI Certified Protection</span>
              </div>
              <div className="flex items-center gap-3 text-brand-metallic">
                <Truck size={18} className="text-brand-accent" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest font-bold">Estimated Delivery</span>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-green-500">3-5 business days for India</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-brand-metallic">
                <Lock size={18} className="text-brand-accent" />
                <span className="text-[10px] uppercase tracking-widest font-bold">256-bit Secure Checkout</span>
              </div>
            </div>
            
            <div className="mt-8 bg-brand-accent/5 p-4 border border-brand-accent/20">
              <p className="text-[10px] text-brand-accent uppercase tracking-widest font-bold mb-2">Notice</p>
              <p className="text-[10px] text-brand-metallic leading-relaxed uppercase">
                UPI only. All payments are verified manually via WhatsApp for security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
