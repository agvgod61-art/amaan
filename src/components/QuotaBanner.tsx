import React from "react";
import { useQuota } from "../context/QuotaContext";
import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function QuotaBanner() {
  const { isQuotaExceeded, setQuotaExceeded } = useQuota();

  const projectId = "cohesive-bulwark-pskkt";
  const firestoreDatabaseId = "ai-studio-940ddde2-ba02-4398-8a41-6ac0e8e72adf";
  const upgradeUrl = `https://console.firebase.google.com/project/${projectId}/firestore/databases/${firestoreDatabaseId}/data?openUpgradeDialog=true`;

  return (
    <AnimatePresence>
      {isQuotaExceeded && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-red-600 text-white py-3.5 px-6 z-[2000] relative overflow-hidden border-b border-red-500"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start md:items-center gap-3">
              <AlertTriangle size={20} className="flex-shrink-0 animate-pulse mt-0.5 md:mt-0 text-white" />
              <div className="space-y-0.5">
                <p className="text-xs md:text-sm font-bold uppercase tracking-[0.12em]">
                  Firestore usage quota exceeded (Free tier limit reached)
                </p>
                <p className="text-[10px] md:text-xs text-red-100 uppercase tracking-widest font-mono">
                  Your daily free read units limit has been met. The quota will reset automatically tomorrow.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <a 
                href={upgradeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-red-600 hover:bg-red-50 px-4 py-1.5 rounded text-[10px] uppercase font-bold tracking-widest transition-all shadow-sm hover:shadow active:scale-95"
              >
                Upgrade Project in Console
              </a>
              <button 
                onClick={() => setQuotaExceeded(false)}
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
