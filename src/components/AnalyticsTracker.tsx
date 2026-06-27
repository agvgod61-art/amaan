import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, increment, setDoc, serverTimestamp } from 'firebase/firestore';

export function AnalyticsTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    const trackVisit = async () => {
      // Mark visitor if not marked in this session
      let isNewVisitor = false;
      if (!sessionStorage.getItem('session_visited')) {
        sessionStorage.setItem('session_visited', 'true');
        isNewVisitor = true;
      }

      try {
        // We track total views and unique visits (by session)
        const statRef = doc(db, 'analytics', 'traffic');
        const updateData: Record<string, any> = {
          totalViews: increment(1),
          lastVisit: serverTimestamp()
        };
        if (isNewVisitor) {
          updateData.uniqueVisits = increment(1);
        }
        await setDoc(statRef, updateData, { merge: true });
      } catch (e: any) {
        if (e && (e.code === 'permission-denied' || e.message?.includes('permission') || e.message?.includes('Permission'))) {
          console.warn("Analytics tracking is currently offline due to Firebase Firestore Security Rules permissions. Please copy and paste the updated firestore.rules to your Firebase Console.");
        } else {
          console.warn("Failed to track analytics:", e);
        }
      }
    };
    
    // Do not track admin panel views
    if (!pathname.startsWith('/admin')) {
      trackVisit();
    }
  }, [pathname]);

  return null;
}
