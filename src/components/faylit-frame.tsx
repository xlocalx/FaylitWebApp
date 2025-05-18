
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
  const [isFirstLoad, setIsFirstLoad] = useState(true); // Track if it's the very first load

  const buildUrl = useCallback((relativePath: string) => {
    const urlObject = new URL(relativePath, BASE_URL);
    const utmParameters = {
      utm_source: 'faylit_app',
      utm_medium: 'mobile_app',
      utm_campaign: 'app_traffic',
    };
    for (const [key, value] of Object.entries(utmParameters)) {
      urlObject.searchParams.set(key, value);
    }
    return urlObject.toString();
  }, []);

  const [currentWebViewPath, setCurrentWebViewPath] = useState<string>(initialPath);
  const [iframeSrc, setIframeSrc] = useState<string>(() => buildUrl(initialPath));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const newSrc = buildUrl(initialPath);
    if (iframeRef.current && iframeRef.current.src !== newSrc) {
      setIsLoading(true);
      // isFirstLoad remains true if this is part of the initial setup
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
    setCurrentWebViewPath(path); 
    if (iframeSrc !== newUrl) {
      setIsLoading(true); // Subsequent loads will also set isLoading to true
      // isFirstLoad will be false by now, so logo screen won't show
      setIframeSrc(newUrl);
    } else if (iframeRef.current?.contentWindow) {
      try { 
        iframeRef.current.contentWindow.location.href = newUrl; 
      } catch(e) { 
        if (iframeRef.current.src && iframeRef.current.src !== newUrl) {
            iframeRef.current.src = newUrl;
        }
      }
    }
  }, [iframeSrc, buildUrl, setCurrentWebViewPath]);

  const updateNavState = useCallback(() => {
    setIsLoading(false);
    // If this was the first load, mark isFirstLoad as false
    setIsFirstLoad(prevIsFirstLoad => prevIsFirstLoad ? false : prevIsFirstLoad);
    
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        const iframeLocation = iframeRef.current.contentWindow.location;
        const iframePathname = iframeLocation.pathname;
        let path = iframePathname.startsWith('/') ? iframePathname.substring(1) : iframePathname;
        
        if (iframeLocation.origin === BASE_URL && iframePathname === '/') {
          path = '';
        }
        else if (path === '/' && initialPath === '') {
            path = '';
        }
        setCurrentWebViewPath(path);
      } catch (error) {
        console.warn('FaylitFrame: Could not update nav state from iframe.', error);
      }
    }
  }, [initialPath, buildUrl]); // buildUrl added as it's used in initialPath comparison logic indirectly via setCurrentWebViewPath

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        setTimeout(updateNavState, 100);
      };
      iframe.addEventListener('load', handleLoad);
      return () => {
        iframe.removeEventListener('load', handleLoad);
      };
    }
  }, [updateNavState]);

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.src !== iframeSrc) {
      iframeRef.current.src = iframeSrc;
    }
  }, [iframeSrc]);

  // Timer specifically for the initial logo loading screen
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading && isFirstLoad) { // Only apply 2s timeout if it's the first load showing the logo
      timer = setTimeout(() => {
        setIsLoading(false);
        setIsFirstLoad(false); // Mark first load as done
      }, 2000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isLoading, isFirstLoad]);


  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <main className={`flex-grow relative ${isLoading ? 'pb-0' : 'pb-16'}`}>
        {/* Show logo loading screen only on first launch */}
        {isLoading && isFirstLoad && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-white z-10"
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
          className={`w-full h-full border-0 ${isLoading && isFirstLoad ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`} // Hide iframe during initial logo load
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals allow-top-navigation-by-user-activation"
          allowFullScreen
          loading="eager" 
        />
      </main>
      {/* Show bottom navigation only when not loading */}
      {!isLoading && <BottomNavigation onNavigate={handleNavigation} currentPath={currentWebViewPath} />}
    </div>
  );
};

export default FaylitFrame;
    