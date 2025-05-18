
"use client";

import type { FC } from 'react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
      try { 
        iframeRef.current.contentWindow.location.href = newUrl; 
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
        let path = iframeLocation.startsWith('/') ? iframeLocation.substring(1) : iframeLocation;
        
        if (path === '' && iframeRef.current.contentWindow.location.origin === BASE_URL && iframeRef.current.contentWindow.location.pathname === '/') {
            // explicitly set to empty string for homepage consistency
        } else if (path === '/' && initialPath === '') {
            // if initial path was homepage, treat '/' also as homepage
        }

        setCurrentWebViewPath(path);
      } catch (error) {
        // Cross-origin error
      }
    }
  }, [initialPath]);


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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isLoading]);


  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <main className="flex-grow relative pb-16">
        {isLoading && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-background/60 z-10"
            style={{ backdropFilter: 'blur(2px)' }} 
            aria-live="polite"
            aria-busy="true"
          >
            <div className="h-16 w-16" role="img" aria-label="Faylit Logo loading indicator">
              <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <rect width="512" height="512" rx="100" fill="white"/>
                <path d="M160 128 H384 V192 H224 V256 H352 V320 H224 V384 H160 V128 Z" fill="black"/>
              </svg>
            </div>
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
