import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, isQuotaError } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface SiteSettings {
  siteName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  accentColor: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  footerText: string;
}

interface SettingsContextType {
  settings: SiteSettings;
  loading: boolean;
}

const defaultSettings: SiteSettings = {
  siteName: "AVG GOD",
  heroTitle: "Premium Riding Equipment",
  heroSubtitle: "Engineered for Performance. Built for Safety.",
  heroImage: "https://images.unsplash.com/photo-1558981403-c5f91cb9c231?auto=format&fit=crop&q=80",
  accentColor: "#E22B2B",
  contactEmail: "agvgod@gmail.com",
  contactPhone: "+91 91522 45837",
  whatsappNumber: "919152245837",
  footerText: "© 2024 AVG GOD. ALL RIGHTS RESERVED."
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for real-time site settings updates
    try {
      const unsubscribe = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SiteSettings;
          
          // Auto-fix stale database fields (override 'Rider's Hub' defaults to 'AVG GOD')
          if (data.siteName === "Rider's Hub" || data.siteName === "Motogp Helmet Ranchi") {
            data.siteName = "AVG GOD";
          }
          if (data.contactEmail === "contact@ridershub.com") {
            data.contactEmail = "agvgod@gmail.com";
          }
          if (data.footerText && data.footerText.toUpperCase().includes("RIDERS HUB")) {
            data.footerText = "© 2024 AVG GOD. ALL RIGHTS RESERVED.";
          }

          setSettings({ ...defaultSettings, ...data });
          
          // Update CSS variable for theme color
          if (data.accentColor) {
            document.documentElement.style.setProperty('--brand-accent-color', data.accentColor);
          }
        }
        setLoading(false);
      }, (error) => {
        if (!isQuotaError(error)) {
          console.warn("Could not load site settings, using defaults.", error);
        } else {
          console.warn("Firestore quota exceeded while loading site settings. Using defaults.");
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Firebase settings setup skipped:", e);
      setLoading(false);
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
