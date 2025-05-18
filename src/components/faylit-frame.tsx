"use client";

import type { FC } from 'react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
// Store icon is no longer needed as the header is removed
// import { Store } from 'lucide-react'; 
// Link is no longer needed as the header with the home link is removed
// import Link from 'next/link';

interface FaylitFrameProps {
  initialPath?: string;
}

const BASE_URL = "https://faylit.com";

const FaylitFrame: FC<FaylitFrameProps> = ({ initialPath = "" }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const buildUrl = useCallback((path: string) => {
    const cleanPath = path.replace(/^\//, ''); // Remove leading slash if present
    return `${BASE_URL}${cleanPath ? `/${cleanPath}` : ''}`;
  }, []);

  const [iframeSrc, setIframeSrc] = useState<string>(() => buildUrl(initialPath));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const newSrc = buildUrl(initialPath);
    if (iframeRef.current && iframeRef.current.src !== newSrc) {
      setIsLoading(true);
      setIframeSrc(newSrc); 
    } else if (!iframeRef.current) { 
        setIsLoading(true);
        setIframeSrc(newSrc);
    }
  }, [initialPath, buildUrl]);
  
  // handleHomeNavigation is no longer needed as the header is removed
  // const handleHomeNavigation = () => {
  //   const iframe = iframeRef.current;
  //   if (!iframe?.contentWindow) return;

  //   setIsLoading(true); 
  //   const homeUrl = buildUrl("");
  //   if (iframeSrc !== homeUrl) {
  //     setIframeSrc(homeUrl);
  //   } else {
  //       try { iframe.contentWindow.location.reload(); } catch(e) { if (iframe.src) iframe.src = iframe.src; }
  //   }
  // };

  const updateNavState = useCallback(() => {
    setIsLoading(false); 
  }, []);


  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', updateNavState);
      return () => {
        iframe.removeEventListener('load', updateNavState);
      };
    }
  }, [updateNavState]);


  useEffect(() => {
    if (iframeRef.current && iframeRef.current.src !== iframeSrc) {
      iframeRef.current.src = iframeSrc;
    }
  }, [iframeSrc]);


  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      {/* Header section has been removed */}
      <main className="flex-grow relative h-full"> {/* Ensure main takes full height */}
        {isLoading && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-background/60 z-10"
            style={{ backdropFilter: 'blur(2px)' }} 
            aria-live="polite"
            aria-busy="true"
          >
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={iframeSrc} 
          title="Faylit Store Web View"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals"
          allowFullScreen
          loading="eager" 
        />
      </main>
    </div>
  );
};

export default FaylitFrame;
