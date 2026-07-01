import React, { useEffect } from "react";
import { useQuota } from "../context/QuotaContext";
import { AlertTriangle, X, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { isFirebaseDisabledByQuota, clearQuotaExceededFlag } from "../lib/firebase";

export function QuotaBanner() {
  const { isQuotaExceeded, setQuotaExceeded } = useQuota();
  const [isDismissed, setIsDismissed] = React.useState(() => {
    try {
      return localStorage.getItem("agv_quota_banner_dismissed") === "true";
    } catch (err) {
      console.warn("localStorage read failed in QuotaBanner:", err);
      return false;
    }
  });

  // Check localStorage quota flag on mount
  useEffect(() => {
    if (isFirebaseDisabledByQuota() && !isDismissed) {
      setQuotaExceeded(true);
    }
  }, [setQuotaExceeded, isDismissed]);

  const projectId = "cohesive-bulwark-pskkt";
  const firestoreDatabaseId = "ai-studio-remixmotogphelme-940ddde2-ba02-4398-8a41-6ac0e8e72adf";
  const upgradeUrl = `https://console.firebase.google.com/project/${projectId}/firestore/databases/${firestoreDatabaseId}/data?openUpgradeDialog=true`;

  const handleDismiss = () => {
    try {
      localStorage.setItem("agv_quota_banner_dismissed", "true");
    } catch (err) {
      console.warn("localStorage write failed in QuotaBanner:", err);
    }
    setIsDismissed(true);
    setQuotaExceeded(false);
  };

  const handleRetry = () => {
    clearQuotaExceededFlag();
    window.location.reload();
  };

  if (isDismissed || !isQuotaExceeded) {
    return null;
  }

  return (
    <AnimatePresence>
      {isQuotaExceeded && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-amber-600 text-white py-3.5 px-6 z-[2000] relative overflow-hidden border-b border-amber-500"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start md:items-center gap-3">
              <AlertTriangle size={20} className="flex-shrink-0 animate-pulse mt-0.5 md:mt-0 text-white" />
              <div className="space-y-0.5">
                <p className="text-xs md:text-sm font-bold uppercase tracking-[0.12em]">
                  Firestore Daily Quota Exceeded — Local Offline Mode Active
                </p>
                <p className="text-[10px] md:text-xs text-amber-100 uppercase tracking-widest font-mono">
                  The daily free read limit has been reached. We've automatically enabled offline state & local storage so you can still explore the store, add items to cart, and checkout seamlessly!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={handleRetry}
                className="bg-amber-800 hover:bg-amber-900 border border-amber-500 text-white px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-widest transition-all shadow-sm flex items-center gap-1.5"
              >
                <RefreshCw size={12} />
                Retry Connection
              </button>
              <a 
                href={upgradeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-amber-700 hover:bg-amber-50 px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-widest transition-all shadow-sm hover:shadow active:scale-95"
              >
                Upgrade in Console
              </a>
              <button 
                onClick={handleDismiss}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors flex-shrink-0 text-white"
                aria-label="Dismiss banner"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          {/* Scanning line animation */}
          <motion.div 
            initial={{ left: "-100%" }}
            animate={{ left: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
