
"use client";

import type { FC } from 'react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import BottomNavigation from './bottom-navigation'; // Ensured correct casing
import { useToast } from '@/hooks/use-toast'; // Ensured correct casing

interface FaylitFrameProps {
  initialPath?: string;
}

const BASE_URL = "https://faylit.com";

const FaylitFrame: FC<FaylitFrameProps> = ({ initialPath = "" }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

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
    setCurrentWebViewPath(path); // Update current path immediately for better UX
    if (iframeSrc !== newUrl) {
      setIsLoading(true);
      setIframeSrc(newUrl);
    } else if (iframeRef.current?.contentWindow) {
      // If URL is the same, try to force navigation or reload.
      // This handles cases where user clicks current nav item.
      try {
        iframeRef.current.contentWindow.location.href = newUrl;
         // If it's truly the same page, a reload might be desired,
         // but for now, just setting href should be fine.
      } catch (e) {
        // Fallback if direct navigation fails (e.g., cross-origin issue though less likely with same-origin path changes)
        if (iframeRef.current.src && iframeRef.current.src !== newUrl) {
          setIsLoading(true);
          iframeRef.current.src = newUrl;
        }
      }
    }
  }, [iframeSrc, buildUrl, currentWebViewPath]);


  const updateNavState = useCallback(() => {
    setIsLoading(false);

    let pathFromKnownSrc = '';
    if (iframeRef.current?.src) {
        try {
            const currentSrcUrl = new URL(iframeRef.current.src);
            // Clean UTM parameters for internal state tracking
            currentSrcUrl.searchParams.delete('utm_source');
            currentSrcUrl.searchParams.delete('utm_medium');
            currentSrcUrl.searchParams.delete('utm_campaign');
            
            pathFromKnownSrc = (currentSrcUrl.pathname + currentSrcUrl.search + currentSrcUrl.hash).replace(/^\//, '');
            if (currentSrcUrl.pathname === '/' && !currentSrcUrl.search && !currentSrcUrl.hash) {
                 pathFromKnownSrc = ''; // Ensure root path is empty string
            }

        } catch (e) {
            console.warn('FaylitFrame: Could not parse iframe src URL for pathFromKnownSrc.', e);
            // Fallback to raw pathname if URL parsing fails
            const rawPath = iframeRef.current.src.replace(BASE_URL, '').replace(/^\//, '');
            pathFromKnownSrc = rawPath.split('?')[0] || ''; // Basic attempt to get path before query
        }
    }
    
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        const iframeLocation = iframeRef.current.contentWindow.location;
        let actualPath = (iframeLocation.pathname + iframeLocation.search + iframeLocation.hash).replace(/^\//, '');
        if (iframeLocation.pathname === '/' && !iframeLocation.search && !iframeLocation.hash) {
          actualPath = ''; // Ensure root path is empty string
        }
        
        setCurrentWebViewPath(actualPath);

      } catch (error) {
        console.warn('FaylitFrame: Could not read iframe location due to cross-origin restrictions. Falling back to last known src path without UTMs.', error);
        setCurrentWebViewPath(pathFromKnownSrc);
      }
    } else {
       setCurrentWebViewPath(pathFromKnownSrc);
    }
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        // Using a timeout can help ensure that the iframe's content window location is settled
        setTimeout(updateNavState, 150); // Slightly increased timeout
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


  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <main className={`flex-grow relative ${!isLoading ? 'pb-16' : 'pb-0'}`}>
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="Faylit Store Web View"
          className="w-full h-full border-0" // Removed conditional opacity and transition
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
