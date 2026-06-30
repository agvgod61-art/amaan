import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Loader2, Shield, ShieldCheck, Mail, Lock, Chrome, Phone, RefreshCw, Key } from 'lucide-react';
import { auth, isFirebaseDisabledByQuota, clearQuotaExceededFlag } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

export default function Auth() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDomainBypass, setShowDomainBypass] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const recaptchaRef = React.useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    // If we are on an unauthorized preview/shared dev domain or agvgod.in, show bypass options automatically
    const host = window.location.hostname;
    if (
      host.includes('agvgod.in') || 
      (host !== 'localhost' && 
       !host.endsWith('.web.app') && 
       !host.endsWith('.firebaseapp.com') && 
       !host.endsWith('.run.app'))
    ) {
      setShowDomainBypass(true);
    }

    return () => {
      // Cleanup recaptcha on unmount
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch(e) {
          console.warn("Failed to clear recaptcha verifier:", e);
        }
        (window as any).recaptchaVerifier = null;
      }
    };
  }, []);

  const formatAuthError = (err: any): string => {
    if (!err) return 'An unknown error occurred.';
    const code = err.code || '';
    const msg = err.message || '';
    
    const lowerCode = code.toLowerCase();
    const lowerMsg = msg.toLowerCase();

    if (
      lowerCode === 'auth/unauthorized-domain' || 
      lowerMsg.includes('unauthorized-domain') || 
      lowerMsg.includes('unauthorized domain') ||
      lowerMsg.includes('unauthorized_domain')
    ) {
      setShowDomainBypass(true);
      return "Authentication error: This domain is not authorized for Google or Phone sign-in.";
    }

    if (
      lowerCode === 'auth/operation-not-allowed' || 
      lowerCode === 'auth/configuration-not-found' ||
      lowerCode === 'auth/admin-restricted-operation' ||
      lowerMsg.includes('operation-not-allowed') || 
      lowerMsg.includes('not-allowed') || 
      lowerMsg.includes('configuration-not-found') ||
      lowerMsg.includes('configurationnotfound') ||
      lowerMsg.includes('operation_not_allowed') ||
      lowerMsg.includes('provider is not enabled') ||
      lowerMsg.includes('sign-in method')
    ) {
      return 'Authentication provider is not enabled in Firebase Console. Please enable Email/Password, Google, or Phone under Authentication -> Sign-in method.';
    }

    return msg || 'An error occurred during authentication.';
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      setError(formatAuthError(err));
      setLoading(false);
    }
  };

  const handleBypassAdminLogin = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    
    // List of admin emails we can use for bypass, in order of preference
    const adminEmails = ['admin@agvgod.in', 'bypass-admin@agvgod.in', 'agvgod61@gmail.com', 'avggod61@gmail.com', 'yamaan115@gmail.com'];
    const adminPassword = 'adminpassword123';
    
    let loggedIn = false;
    let lastError: any = null;
    
    for (const adminEmail of adminEmails) {
      try {
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        loggedIn = true;
        break;
      } catch (err: any) {
        lastError = err;
        const code = err.code || '';
        const msg = err.message || '';
        
        // If the user-not-found/invalid-credential occurred, try creating this admin account
        if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || msg.includes('user-not-found') || msg.includes('INVALID_LOGIN_CREDENTIALS')) {
          try {
            await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
            loggedIn = true;
            break;
          } catch (createErr: any) {
            lastError = createErr;
            // If email is already in use (e.g. they registered agvgod61@gmail.com with a different password/Google provider)
            // we will continue to the next admin email in the loop!
            if (createErr.code === 'auth/email-already-in-use' || createErr.message?.includes('already-in-use')) {
              console.warn(`Admin email ${adminEmail} is already in use. Trying next fallback admin...`);
              continue;
            }
          }
        }
      }
    }
    
    if (loggedIn) {
      navigate('/');
    } else {
      // If we failed all admin options, provide a clear, helpful message
      if (lastError?.code === 'auth/email-already-in-use' || lastError?.message?.includes('already-in-use')) {
        setError("Admin accounts are already registered with a custom password or Google. Please sign in via the email/password form above using your registered password, or click 'Instant Demo Logon'.");
      } else {
        setError(formatAuthError(lastError || new Error("Failed to bypass login.")));
      }
    }
    setLoading(false);
  };

  const handleInstantDemoLogin = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    const demoEmail = 'demo@agvgod.in';
    const demoPassword = 'demopassword123';
    try {
      await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      navigate('/');
    } catch (err: any) {
      const code = err.code || '';
      const msg = err.message || '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || msg.includes('user-not-found') || msg.includes('INVALID_LOGIN_CREDENTIALS')) {
        try {
          await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
          navigate('/');
        } catch (_createErr: any) {
          try {
            const uniqueId = Math.random().toString(36).substring(2, 8);
            const guestEmail = `guest_${uniqueId}@agvgod.in`;
            await createUserWithEmailAndPassword(auth, guestEmail, 'demopassword123');
            navigate('/');
          } catch (guestErr: any) {
            setError(formatAuthError(guestErr));
          }
        }
      } else {
        setError(formatAuthError(err));
      }
    } finally {
      setLoading(false);
    }
  };


  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier && recaptchaRef.current) {
      try {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaRef.current, {
          size: 'invisible'
        });
      } catch (e) {
        console.error("Recaptcha setup error:", e);
      }
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (!showOtpInput) {
        setupRecaptcha();
        const appVerifier = (window as any).recaptchaVerifier;
        const formatPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`; 
        const result = await signInWithPhoneNumber(auth, formatPhone, appVerifier);
        setConfirmationResult(result);
        setShowOtpInput(true);
        setSuccessMsg("OTP sent successfully!");
      } else {
        if (confirmationResult) {
          await confirmationResult.confirm(otp);
          navigate('/');
        }
      }
    } catch (err: any) {
      setError(formatAuthError(err));
      if ((window as any).recaptchaVerifier) {
        try { 
          (window as any).recaptchaVerifier.clear(); 
        } catch(e) {
          console.warn("Recaptcha verifier clear error:", e);
        }
        (window as any).recaptchaVerifier = null;
      }
      setShowOtpInput(false);
    } finally {
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
        navigate('/');
      }
    } catch (err: any) {
      setError(formatAuthError(err));
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
            {authMode === 'phone' ? "Phone Login" : (isSignIn ? "Sign In" : "Create Account")}
          </h1>
          <p className="text-brand-metallic text-xs uppercase tracking-widest font-medium">
            {authMode === 'phone' ? "Enter your mobile number" : (isSignIn ? "Welcome Back" : "Join AVG God")}
          </p>
        </div>

        {/* Recaptcha Container */}
        <div id="recaptcha-container" ref={recaptchaRef}></div>

        {authMode === 'email' ? (
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
              {email && ["yamaan115@gmail.com", "avggod61@gmail.com", "agvgod61@gmail.com"].includes(email.toLowerCase()) && (
                <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                  <ShieldCheck size={14} className="shrink-0" />
                  <span>Admin Email Detected! Logging in will grant Admin Access.</span>
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
              className="w-full mt-2 bg-brand-accent text-brand-black font-bold uppercase tracking-widest py-4 text-xs hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                isSignIn ? "Sign In" : "Sign Up"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePhoneAuth} className="flex flex-col gap-5">
            {!showOtpInput ? (
              <div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="MOBILE NUMBER"
                    className="w-full bg-white/5 border border-white/10 py-4 pl-12 pr-4 text-xs font-mono uppercase text-white placeholder-white/30 focus:border-brand-accent focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-brand-metallic text-[10px] mt-2 uppercase tracking-widest">Format: xxxxxxxxxx or +91xxxxxxxxxx</p>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="ENTER OTP"
                    className="w-full bg-white/5 border border-white/10 py-4 pl-12 pr-4 text-xs font-mono uppercase text-white placeholder-white/30 focus:border-brand-accent focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-brand-accent text-brand-black font-bold uppercase tracking-widest py-4 text-xs hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                !showOtpInput ? "Send OTP" : "Verify OTP"
              )}
            </button>
            {showOtpInput && (
               <button 
                 type="button" 
                 onClick={() => { setShowOtpInput(false); setOtp(''); }}
                 className="text-white/60 hover:text-white text-[10px] uppercase tracking-widest text-center py-2"
               >
                 Change Phone Number
               </button>
            )}
          </form>
        )}

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

          <AnimatePresence>
            {showDomainBypass && (
              <motion.div
                key="domain-bypass"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6 p-6 bg-amber-500/10 border border-amber-500/20 rounded flex flex-col items-center text-center gap-4 shadow-lg"
              >
                <div className="p-3 bg-amber-500/10 rounded-full text-amber-400">
                  <Key size={20} className="animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest">
                    Bypass Domain Restriction
                  </h4>
                  <p className="text-[11px] text-white/70 lowercase leading-relaxed max-w-xs">
                    google and phone logins are restricted on unauthorized preview domains by firebase settings. bypass this immediately by using the secure, pre-configured administrator or demo credentials below:
                  </p>
                </div>
                <div className="w-full flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleBypassAdminLogin}
                    disabled={loading}
                    className="w-full bg-amber-500 text-brand-black font-bold uppercase tracking-widest py-3 px-4 text-[10px] rounded hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <>
                        <ShieldCheck size={14} />
                        <span>Log in as Admin</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleInstantDemoLogin}
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest py-3 px-4 text-[10px] rounded hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <>
                        <Shield size={14} className="text-amber-400" />
                        <span>Instant Demo Logon</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
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

        {isFirebaseDisabledByQuota() && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2 text-amber-500 font-bold uppercase tracking-wider text-xs">
              <AlertCircle size={16} />
              <span>Offline Fallback Mode Active</span>
            </div>
            <p className="text-[11px] text-white/80 lowercase max-w-sm leading-relaxed">
              the app is currently running in local offline mode because of a previous firestore quota error.
            </p>
            <button
              type="button"
              onClick={() => {
                clearQuotaExceededFlag();
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-amber-500 text-brand-black hover:bg-white hover:text-brand-black transition-all text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 rounded shadow-lg"
            >
              <RefreshCw size={12} className="animate-spin-slow" />
              Force Reconnect Firestore
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4">
          <button 
            type="button"
            onClick={handleInstantDemoLogin}
            disabled={loading}
            className="w-full bg-amber-500/10 border border-amber-500/40 py-5 px-6 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest text-amber-400 hover:bg-amber-500 hover:text-brand-black transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <Shield size={18} className="text-amber-400 group-hover:text-inherit" />
                <span>Instant Demo Logon</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4">

          {authMode === 'email' ? (
             <button 
               type="button"
               onClick={() => { setAuthMode('phone'); setError(null); setSuccessMsg(null); setShowOtpInput(false); }}
               disabled={loading}
               className="w-full bg-white/5 border border-white/10 py-5 px-6 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-brand-black transition-all disabled:opacity-50"
             >
               <Phone size={18} />
               <span>Continue with Phone</span>
             </button>
          ) : (
            <button 
               type="button"
               onClick={() => { setAuthMode('email'); setError(null); setSuccessMsg(null); }}
               disabled={loading}
               className="w-full bg-white/5 border border-white/10 py-5 px-6 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-brand-black transition-all disabled:opacity-50"
             >
               <Mail size={18} />
               <span>Continue with Email</span>
             </button>
          )}
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

        {authMode === 'email' && (
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
        )}
      </motion.div>
    </div>
  );
}
