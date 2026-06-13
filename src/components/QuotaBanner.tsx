import React from "react";
import { useQuota } from "../context/QuotaContext";
import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function QuotaBanner() {
  const { isQuotaExceeded, setQuotaExceeded } = useQuota();

  return (
    <AnimatePresence>
      {isQuotaExceeded && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-brand-accent text-white py-3 px-6 z-[2000] relative overflow-hidden"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="flex-shrink-0 animate-pulse" />
              <p className="text-[10px] md:text-sm font-bold uppercase tracking-[0.15em]">
                System Alert: Firestore usage quota exceeded. Some live features may be temporarily limited to static data.
              </p>
            </div>
            <button 
              onClick={() => setQuotaExceeded(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          {/* Scanning line animation */}
          <motion.div 
            initial={{ left: "-100%" }}
            animate={{ left: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
