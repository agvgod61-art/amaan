import React, { useState, useEffect } from 'react';
import { getSignedImageUrl } from '../services/storageService';

interface StorageVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src?: string | null;
}

export default function StorageVideo({ src, ...props }: StorageVideoProps) {
  const [signedSrc, setSignedSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!src) {
      setSignedSrc(undefined);
      return;
    }
    
    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:')) {
      setSignedSrc(src);
      return;
    }
    
    let isMounted = true;
    getSignedImageUrl(src).then(url => {
      if (isMounted) setSignedSrc(url || src);
    }).catch(() => {
      if (isMounted) setSignedSrc(src);
    });
    
    return () => {
      isMounted = false;
    };
  }, [src]);

  if (!src) return null;
  
  if (!signedSrc) {
    return (
      <div 
        className={`animate-pulse bg-white/10 ${props.className || ''}`} 
        style={{ width: props.width || '100%', height: props.height || '100%' }} 
      />
    );
  }

  return <video src={signedSrc} {...props} />;
}
