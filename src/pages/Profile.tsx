import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, LogOut, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Package, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";

export default function Profile() {
  const { user, loading: authLoading, logout, updateName, changeEmail, resetPassword } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.email) return;
      if (user.email === "yamaan115@gmail.com") {
        setIsAdmin(true);
        return;
      }
      try {
        const { db } = await import("../lib/firebase");
        const { doc, getDoc } = await import("../lib/firebase");
        const adminDoc = await getDoc(doc(db, "admins", user.email.toLowerCase()));
        setIsAdmin(adminDoc.exists());
      } catch (err) {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      if (name !== user?.displayName) {
        await updateName(name);
      }
      if (email !== user?.email) {
        await changeEmail(email);
      }
      setStatus('success');
      setMessage("Profile updated successfully. A confirmation email was sent if you changed your email.");
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setStatus('loading');
    try {
      await resetPassword(user.email);
      setStatus('success');
      setMessage("Password reset email sent!");
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-brand-accent" /></div>;
  if (!user) return null;

  const isGoogleUser = user.providerData && user.providerData.some((p: any) => p.providerId === 'google.com');

  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-display font-bold uppercase tracking-tighter">Account</h1>
            <p className="text-brand-metallic text-xs uppercase tracking-widest mt-2">Manage your credentials</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-brand-accent text-[10px] font-bold uppercase tracking-widest border border-brand-accent/20 px-4 py-2 hover:bg-brand-accent/10 transition-all"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>

        <div className="space-y-8">
          <div className="bg-white/5 border border-white/10 p-8">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Display Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-metallic" size={18} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black border border-white/10 p-4 pl-12 text-white text-sm focus:border-brand-accent outline-none transition-all"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-metallic" size={18} />
                  <input 
                    disabled={isGoogleUser}
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "w-full bg-black border border-white/10 p-4 pl-12 text-white text-sm outline-none transition-all",
                      isGoogleUser ? "opacity-50 cursor-not-allowed" : "focus:border-brand-accent"
                    )}
                    placeholder="Enter your email"
                  />
                </div>
                {isGoogleUser && (
                  <p className="text-[9px] text-brand-metallic mt-2 uppercase tracking-widest">
                    Linked to Google Search. Email cannot be changed here.
                  </p>
                )}
              </div>

              {status === 'success' && (
                <div className="bg-green-500/10 border border-green-500/20 p-4 flex items-center gap-3 text-green-500">
                  <CheckCircle2 size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{message}</span>
                </div>
              )}

              {status === 'error' && (
                <div className="bg-brand-accent/10 border border-brand-accent/20 p-4 flex items-center gap-3 text-brand-accent">
                  <AlertCircle size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{message}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={status === 'loading' || (name === user?.displayName && email === user?.email)}
                className="w-full bg-white text-black py-4 text-xs font-bold uppercase tracking-widest hover:bg-brand-accent hover:text-white transition-all disabled:opacity-50"
              >
                {status === 'loading' ? <Loader2 className="animate-spin mx-auto" /> : "Save Changes"}
              </button>
            </form>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 flex items-center justify-between">
            <div>
              <h3 className="text-white text-sm font-bold uppercase tracking-tight">Order History</h3>
              <p className="text-[10px] text-brand-metallic uppercase tracking-widest mt-1">Track your active missions and deliveries</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate('/order-history')}
                className="flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest bg-white/10 px-6 py-3 hover:bg-white/20 transition-all"
              >
                <Package size={14} />
                My History
              </button>
              <button 
                onClick={() => navigate('/track')}
                className="flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest bg-brand-accent/20 border border-brand-accent/30 px-6 py-3 hover:bg-brand-accent transition-all"
              >
                <Search size={14} />
                Track ID
              </button>
            </div>
          </div>

          {!isGoogleUser && (
            <div className="bg-white/5 border border-white/10 p-8 flex items-center justify-between">
              <div>
                <h3 className="text-white text-sm font-bold uppercase tracking-tight">Security</h3>
                <p className="text-[10px] text-brand-metallic uppercase tracking-widest mt-1">Want to change your password?</p>
              </div>
              <button 
                onClick={handleResetPassword}
                className="flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest bg-white/10 px-6 py-3 hover:bg-white/20 transition-all"
              >
                <Lock size={14} />
                Send Reset Link
              </button>
            </div>
          )}

          {isAdmin && (
            <div className="bg-brand-accent/5 border border-brand-accent/20 p-8 flex items-center justify-between">
              <div>
                <h3 className="text-brand-accent text-sm font-bold uppercase tracking-tight">Admin Access</h3>
                <p className="text-[10px] text-brand-metallic uppercase tracking-widest mt-1">You have authorized command access</p>
              </div>
              <button 
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest bg-brand-accent px-6 py-3 hover:bg-brand-accent/80 transition-all shadow-[0_0_20px_rgba(255,51,51,0.2)]"
              >
                <ShieldCheck size={14} />
                Enter Console
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
