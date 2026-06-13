import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Loader2, Shield, Mail, Lock, Chrome } from 'lucide-react';
import { auth } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';

export default function Auth() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google Sign In.');
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isSignIn) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        // Firebase logs the user in immediately on signup.
        // If we want to verify email, we can sign them out and show a message.
        await signOut(auth);
        
        setIsSignIn(true);
        setPassword('');
        setSuccessMsg("Account created successfully. Please sign in or check your email to confirm.");
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
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
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest mb-2">
            {isSignIn ? "Sign In" : "Create Account"}
          </h1>
          <p className="text-brand-metallic text-xs uppercase tracking-widest font-medium">
            {isSignIn ? "Welcome Back" : "Join AVG God"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          <div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL ADDRESS"
                className="w-full bg-white/5 border border-white/10 py-4 pl-12 pr-4 text-xs font-mono uppercase text-white placeholder-white/30 focus:border-brand-accent focus:outline-none transition-colors"
              />
            </div>
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
            className="w-full mt-2 bg-brand-accent text-brand-black font-bold uppercase tracking-widest py-4 text-xs hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              isSignIn ? "Sign In" : "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                key="error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3 justify-center text-red-500 text-xs uppercase tracking-widest font-bold mt-4"
              >
                <AlertCircle size={16} className="shrink-0" />
                <span className="text-center">{error}</span>
              </motion.div>
            )}
            {successMsg && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-green-500/10 border border-green-500/20 p-4 flex items-start gap-3 justify-center text-green-500 text-xs uppercase tracking-widest font-bold mt-4"
              >
                <Shield size={16} className="shrink-0" />
                <span className="text-center">{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 py-5 px-6 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-brand-black transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <Chrome size={18} />
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignIn(!isSignIn);
              setError(null);
              setSuccessMsg(null);
            }}
            className="text-white/60 hover:text-white text-xs uppercase tracking-widest font-medium transition-colors"
          >
            {isSignIn ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
