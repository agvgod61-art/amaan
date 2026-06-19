import React, { useState, useEffect } from 'react';
import { getSignedImageUrl } from '../services/storageService';

interface StorageFileLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string | null;
}

export default function StorageFileLink({ href, children, ...props }: StorageFileLinkProps) {
  const [signedHref, setSignedHref] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!href) {
      setSignedHref(undefined);
      return;
    }
    
    if (href.startsWith('http') || href.startsWith('data:') || href.startsWith('blob:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      setSignedHref(href);
      return;
    }
    
    let isMounted = true;
    getSignedImageUrl(href).then(url => {
      if (isMounted) setSignedHref(url || href);
    }).catch(() => {
      if (isMounted) setSignedHref(href);
    });
    
    return () => {
      isMounted = false;
    };
  }, [href]);

  if (!href) return null;

  return (
    <a href={signedHref || '#'} {...props}>
      {children}
    </a>
  );
}
