
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
  
  const buildUrl = useCallback((relativePath: string) => {
    // relativePath is like "", "cart", "category/product", or "category/product?id=123"
    // BASE_URL acts as the base if relativePath is relative.
    const urlObject = new URL(relativePath, BASE_URL);

    const utmParameters = {
      utm_source: 'faylit_app',
      utm_medium: 'mobile_app',
      utm_campaign: 'app_traffic',
    };

    // Append UTM parameters. .set() will add or overwrite, ensuring each UTM param appears once.
    for (const [key, value] of Object.entries(utmParameters)) {
      urlObject.searchParams.set(key, value);
    }

    return urlObject.toString();
  }, []); // BASE_URL is a module-level const, so not needed in deps.

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
    // Always update currentWebViewPath to the clean path from navigation action
    setCurrentWebViewPath(path); 
    if (iframeSrc !== newUrl) {
      setIsLoading(true);
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
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        const iframeLocation = iframeRef.current.contentWindow.location;
        // Get the pathname from the iframe, which does NOT include the query string or hash.
        const iframePathname = iframeLocation.pathname;
        // Remove leading slash to match the format of `initialPath` and nav item paths
        let path = iframePathname.startsWith('/') ? iframePathname.substring(1) : iframePathname;
        
        // Normalize for homepage consistency: if iframe is at root of BASE_URL, treat as "" path.
        if (iframeLocation.origin === BASE_URL && iframePathname === '/') {
          path = '';
        }
        // This case handles if the app's initial path was homepage, and iframe navigates to '/', 
        // ensures currentWebViewPath also becomes "" for consistency.
        else if (path === '/' && initialPath === '') {
            path = '';
        }

        setCurrentWebViewPath(path);
      } catch (error) {
        // Cross-origin error or other issues accessing iframe location
        console.warn('FaylitFrame: Could not update nav state from iframe.', error);
      }
    }
  }, [initialPath]); // BASE_URL is a const.


  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        // Delay slightly to allow potential redirects within the iframe to settle
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
      <main className={`flex-grow relative ${isLoading || !currentWebViewPath && currentWebViewPath !== '' ? 'pb-0' : 'pb-16'}`}>
        {isLoading && (
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
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals allow-top-navigation-by-user-activation"
          allowFullScreen
          loading="eager" 
        />
      </main>
      {!isLoading && <BottomNavigation onNavigate={handleNavigation} currentPath={currentWebViewPath} />}
    </div>
  );
};

export default FaylitFrame;

    