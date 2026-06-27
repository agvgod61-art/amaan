import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db, doc, increment, setDoc, serverTimestamp } from '../lib/firebase';

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
      } catch (e) {
        console.warn("Failed to track analytics", e);
      }
    };
    
    // Do not track admin panel views
    if (!pathname.startsWith('/admin')) {
      trackVisit();
    }
  }, [pathname]);

  return null;
}
