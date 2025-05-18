
"use client";

import type { FC } from 'react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import BottomNavigation from './bottom-navigation';

interface FaylitFrameProps {
  initialPath?: string;
}

const BASE_URL = "https://faylit.com";

const FaylitFrame: FC<FaylitFrameProps> = ({ initialPath = "" }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const buildUrl = useCallback((path: string) => {
    const cleanPath = path.replace(/^\//, ''); 
    return `${BASE_URL}${cleanPath ? `/${cleanPath}` : ''}`;
  }, []);

  const [currentWebViewPath, setCurrentWebViewPath] = useState<string>(initialPath);
  const [iframeSrc, setIframeSrc] = useState<string>(() => buildUrl(initialPath));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const newSrc = buildUrl(initialPath);
    if (iframeRef.current && iframeRef.current.src !== newSrc) {
      setIsLoading(true);
      setIframeSrc(newSrc);
      setCurrentWebViewPath(initialPath);
    } else if (!iframeRef.current) { 
        setIsLoading(true);
        setIframeSrc(newSrc);
        setCurrentWebViewPath(initialPath);
    }
  }, [initialPath, buildUrl]);
  
  const handleNavigation = useCallback((path: string) => {
    const newUrl = buildUrl(path);
    if (iframeSrc !== newUrl) {
      setIsLoading(true);
      setIframeSrc(newUrl);
      setCurrentWebViewPath(path);
    } else if (iframeRef.current?.contentWindow) {
      // If it's the same URL, consider a reload, though Faylit might handle this internally
      try { 
        iframeRef.current.contentWindow.location.href = newUrl; // Force navigation
        // iframeRef.current.contentWindow.location.reload(); // Alternative: reload
      } catch(e) { 
        if (iframeRef.current.src) iframeRef.current.src = newUrl; 
      }
    }
  }, [iframeSrc, buildUrl]);

  const updateNavState = useCallback(() => {
    setIsLoading(false); 
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        const iframeLocation = iframeRef.current.contentWindow.location.pathname;
        // Remove leading slash and base URL part if necessary, 
        // assuming faylit.com paths are relative to root
        let path = iframeLocation.startsWith('/') ? iframeLocation.substring(1) : iframeLocation;
        
        // If on faylit.com/ (homepage), path might be empty or '/'
        if (path === '' && iframeRef.current.contentWindow.location.origin === BASE_URL && iframeRef.current.contentWindow.location.pathname === '/') {
            // explicitly set to empty string for homepage consistency
        } else if (path === '/' && initialPath === '') {
            // if initial path was homepage, treat '/' also as homepage
        }

        setCurrentWebViewPath(path);
      } catch (error) {
        // Cross-origin error, cannot access iframe location.
        // console.warn("Cannot access iframe location:", error);
        // We might not be able to update currentWebViewPath accurately in this case.
        // Keep the one set by handleNavigation or initialPath.
      }
    }
  }, [initialPath]);


  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', updateNavState);
      // It might also be useful to listen to hash changes or other navigation events within the iframe if possible
      // However, due to cross-origin restrictions, direct event listening inside iframe is limited.
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
      <main className="flex-grow relative pb-16"> {/* Added pb-16 for bottom nav space */}
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
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals allow-top-navigation-by-user-activation"
          allowFullScreen
          loading="eager" 
        />
      </main>
      <BottomNavigation onNavigate={handleNavigation} currentPath={currentWebViewPath} />
    </div>
  );
};

export default FaylitFrame;
