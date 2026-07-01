import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Loader2, Shield, ShieldCheck, Mail, Lock } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let formattedEmail = email.trim();
    if (formattedEmail && !formattedEmail.includes('@')) {
      formattedEmail = `${formattedEmail.toLowerCase()}@agvgod.in`;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formattedEmail, password);
      const user = userCredential.user;
      
      if (user && user.email) {
        const SUPER_ADMINS = ["yamaan115@gmail.com", "avggod61@gmail.com", "agvgod61@gmail.com", "admin@agvgod.in", "bypass-admin@agvgod.in"];
        const emailLower = user.email.toLowerCase();
        let isAuthorized = SUPER_ADMINS.includes(emailLower);
        
        if (!isAuthorized) {
          try {
            const adminDoc = await getDoc(doc(db, "admins", emailLower));
            isAuthorized = adminDoc.exists();
          } catch (fsErr) {
            console.error("Failed to check admin status in firestore:", fsErr);
          }
        }

        if (!isAuthorized) {
          await auth.signOut();
          setError("ACCESS RESTRICTED: Only authorized administrators or staff are permitted to log in.");
          setLoading(false);
          return;
        }
      }
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-24 px-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-accent/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <motion.div 
        id="login-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-brand-black border border-white/5 p-8 md:p-12 shadow-2xl relative"
      >
        <div className="text-center mb-10">
          <Shield className="w-12 h-12 text-brand-accent mx-auto mb-6" />
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest mb-2 text-white">
            Admin Login
          </h1>
          <p className="text-brand-metallic text-xs uppercase tracking-widest font-medium">
            Authorized Personnel Only
          </p>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          <div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ADMIN USERNAME OR EMAIL"
                className="w-full bg-white/5 border border-white/10 py-4 pl-12 pr-4 text-xs font-mono uppercase text-white placeholder-white/30 focus:border-brand-accent focus:outline-none transition-colors"
              />
            </div>
            <p className="text-[9px] text-white/40 uppercase tracking-widest mt-2 ml-1">
              Tip: You can use your assigned administrator username (e.g., <span className="text-amber-400 font-bold">admin</span>) without domain.
            </p>
            {email && ["yamaan115@gmail.com", "avggod61@gmail.com", "agvgod61@gmail.com", "admin", "bypass-admin"].includes(email.toLowerCase()) && (
              <div className="mt-2 p-3 bg-brand-accent/10 border border-brand-accent/30 text-brand-accent rounded flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                <ShieldCheck size={14} className="shrink-0" />
                <span>Admin Account Detected</span>
              </div>
            )}
          </div>
          
          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="PASSWORD"
                className="w-full bg-white/5 border border-white/10 py-4 pl-12 pr-4 text-xs font-mono uppercase text-white placeholder-white/30 focus:border-brand-accent focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-brand-accent text-brand-black font-bold uppercase tracking-widest py-4 text-xs hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <AnimatePresence>
            {error && (
              <motion.div 
                key="error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 p-4 flex flex-col items-center gap-3 justify-center text-red-500 text-xs uppercase tracking-widest font-bold mt-4"
              >
                <div className="flex items-center gap-3 justify-center">
                  <AlertCircle size={16} className="shrink-0" />
                  <span className="text-center">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
