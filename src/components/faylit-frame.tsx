"use client";

import type { FC } from 'react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, HomeIcon, RefreshCw, Loader2, Store } from 'lucide-react';
import Link from 'next/link';

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
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false); 

  useEffect(() => {
    const newSrc = buildUrl(initialPath);
    // Only update and set loading if the source is genuinely different
    // This prevents reloads if initialPath prop re-renders but value is same
    if (iframeRef.current && iframeRef.current.src !== newSrc) {
      setIsLoading(true);
      setIframeSrc(newSrc); // This will trigger the next useEffect to update iframe.src
    } else if (!iframeRef.current) { // Initial mount, iframe not yet available
        setIsLoading(true);
        setIframeSrc(newSrc);
    }
  }, [initialPath, buildUrl]);
  
  const handleNavigation = (action: 'back' | 'forward' | 'refresh' | 'home') => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    setIsLoading(true); 

    switch (action) {
      case 'back':
        iframe.contentWindow.history.back();
        break;
      case 'forward':
        iframe.contentWindow.history.forward();
        break;
      case 'refresh':
        try {
          iframe.contentWindow.location.reload();
        } catch (e) {
          if (iframe.src) iframe.src = iframe.src; // Fallback
        }
        break;
      case 'home':
        const homeUrl = buildUrl("");
        if (iframeSrc !== homeUrl) {
          setIframeSrc(homeUrl);
        } else {
           try { iframe.contentWindow.location.reload(); } catch(e) { if (iframe.src) iframe.src = iframe.src; }
        }
        break;
    }
  };

  const updateNavState = useCallback(() => {
    setIsLoading(false); 
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        setCanGoBack(iframeRef.current.contentWindow.history.length > 1);
        // A more robust check for canGoForward is not feasible cross-origin.
        // We enable it optimistically; the browser handles actual forward capability.
        setCanGoForward(true); 
      } catch (e) {
        console.warn("Could not access iframe history:", e);
        setCanGoBack(false);
        setCanGoForward(false);
      }
    }
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
      <header className="p-3 border-b border-border shadow-sm bg-background sticky top-0 z-20 shrink-0">
        <div className="container mx-auto flex items-center justify-between max-w-full px-4">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md p-1 -m-1" 
            onClick={(e) => { 
              e.preventDefault(); 
              handleNavigation('home'); 
            }}
            aria-label="Faylit Store Homepage"
          >
             <Store className="h-7 w-7" />
             <h1 className="text-xl font-semibold tracking-tight">Faylit Store</h1>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleNavigation('back')} aria-label="Go back" disabled={!canGoBack || isLoading} className="disabled:opacity-50">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleNavigation('forward')} aria-label="Go forward" disabled={!canGoForward || isLoading} className="disabled:opacity-50"> 
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleNavigation('refresh')} aria-label="Refresh page" disabled={isLoading} className="disabled:opacity-50">
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleNavigation('home')} aria-label="Go to homepage" disabled={isLoading} className="disabled:opacity-50">
              <HomeIcon className="h-5 w-5" />
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-grow relative">
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
          src={iframeSrc} // Set initial src, subsequent changes via useEffect
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
