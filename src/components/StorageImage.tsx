import React, { useState, useEffect } from 'react';
import { getSignedImageUrl } from '../services/storageService';

interface StorageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
}

export default function StorageImage({ src, ...props }: StorageImageProps) {
  const [signedSrc, setSignedSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!src) {
      setSignedSrc(undefined);
      return;
    }
    
    // If it's already a full URL or data URI, use it directly
    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:')) {
      setSignedSrc(src);
      return;
    }
    
    // Otherwise, assume it's a Supabase storage path
    let isMounted = true;
    getSignedImageUrl(src).then(url => {
      if (isMounted) setSignedSrc(url || src); // fallback to src if url generation fails unexpectedly
    }).catch(() => {
      if (isMounted) setSignedSrc(src);
    });
    
    return () => {
      isMounted = false;
    };
  }, [src]);

  if (!src) return null;
  
  if (!signedSrc) {
    // Return a skeleton loader or placeholder with the same class names
    return (
      <div 
        className={`animate-pulse bg-white/10 ${props.className || ''}`} 
        style={{ width: props.width, height: props.height }} 
      />
    );
  }

  return <img src={signedSrc} {...props} />;
}
