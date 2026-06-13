import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { isQuotaError } from "../lib/firebase";

interface QuotaContextType {
  isQuotaExceeded: boolean;
  setQuotaExceeded: (exceeded: boolean) => void;
  handlePossibleQuotaError: (error: unknown) => boolean;
}

const QuotaContext = createContext<QuotaContextType | undefined>(undefined);

export function QuotaProvider({ children }: { children: React.ReactNode }) {
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  const handlePossibleQuotaError = useCallback((error: unknown) => {
    if (isQuotaError(error)) {
      setIsQuotaExceeded(true);
      return true;
    }
    return false;
  }, []);

  // Listen for custom quota events (can be dispatched from non-React code)
  useEffect(() => {
    const handleQuotaEvent = () => setIsQuotaExceeded(true);
    window.addEventListener("firestore-quota-exceeded", handleQuotaEvent);
    return () => window.removeEventListener("firestore-quota-exceeded", handleQuotaEvent);
  }, []);

  return (
    <QuotaContext.Provider value={{ isQuotaExceeded, setQuotaExceeded: setIsQuotaExceeded, handlePossibleQuotaError }}>
      {children}
    </QuotaContext.Provider>
  );
}

export function useQuota() {
  const context = useContext(QuotaContext);
  if (context === undefined) {
    throw new Error("useQuota must be used within a QuotaProvider");
  }
  return context;
}
