import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, isQuotaError, isFirebaseDisabledByQuota } from '../lib/firebase';
import { doc, onSnapshot, getDoc } from '../lib/firebase';

interface SiteSettings {
  siteName: string;
  logoImage?: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  accentColor: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  address?: string;
  footerText: string;
  siteAccess?: "public" | "members" | "maintenance";
}

interface SettingsContextType {
  settings: SiteSettings;
  loading: boolean;
}

const defaultSettings: SiteSettings = {
  siteName: "AGV GOD",
  logoImage: "",
  heroTitle: "Premium Riding Equipment",
  heroSubtitle: "Engineered for Performance. Built for Safety.",
  heroImage: "https://images.unsplash.com/photo-1558981403-c5f91cb9c231?auto=format&fit=crop&q=80",
  accentColor: "#E22B2B",
  contactEmail: "agvgod@gmail.com",
  contactPhone: "+91 91522 45837",
  whatsappNumber: "919152245837",
  address: "Ranchi, Jharkhand, India",
  footerText: "© 2024 AGV GOD. ALL RIGHTS RESERVED.",
  siteAccess: "public"
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fallback to ensure we don't get stuck loading forever
    const loadingTimeout = window.setTimeout(() => setLoading(false), 3000);

    const fetchSettings = async () => {
      if (isFirebaseDisabledByQuota()) {
        console.log("Firebase disabled by quota, using default site settings.");
        clearTimeout(loadingTimeout);
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as SiteSettings;
          
          setSettings({ ...defaultSettings, ...data });
          
          // Update CSS variable for theme color
          if (data.accentColor) {
            document.documentElement.style.setProperty('--brand-accent-color', data.accentColor);
          }
        }
      } catch (error) {
        if (!isQuotaError(error)) {
          console.warn("Could not load site settings, using defaults.", error);
        } else {
          console.warn("Firestore quota exceeded while loading site settings. Using defaults.");
        }
      } finally {
        clearTimeout(loadingTimeout);
        setLoading(false);
      }
    };

    fetchSettings();
    
    return () => clearTimeout(loadingTimeout);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
