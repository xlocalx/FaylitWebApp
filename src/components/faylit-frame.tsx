
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
  const [isLoading, setIsLoading] = useState(true); // Still used to manage iframe loading, but not for nav visibility

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
    setCurrentWebViewPath(path);
    if (iframeSrc !== newUrl) {
      setIsLoading(true);
      setIframeSrc(newUrl);
    } else if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.location.href = newUrl;
      } catch (e) {
        if (iframeRef.current.src && iframeRef.current.src !== newUrl) {
          setIsLoading(true);
          iframeRef.current.src = newUrl;
        }
      }
    }
  }, [iframeSrc, buildUrl]);


  const updateNavState = useCallback(() => {
    setIsLoading(false);

    let pathFromKnownSrc = '';
    if (iframeRef.current?.src) {
        try {
            const currentSrcUrl = new URL(iframeRef.current.src);
            currentSrcUrl.searchParams.delete('utm_source');
            currentSrcUrl.searchParams.delete('utm_medium');
            currentSrcUrl.searchParams.delete('utm_campaign');
            
            pathFromKnownSrc = (currentSrcUrl.pathname + currentSrcUrl.search + currentSrcUrl.hash).replace(/^\//, '');
            if (currentSrcUrl.pathname === '/' && !currentSrcUrl.search && !currentSrcUrl.hash) {
                 pathFromKnownSrc = '';
            }

        } catch (e) {
            console.warn('FaylitFrame: Could not parse iframe src URL for pathFromKnownSrc.', e);
            const rawPath = iframeRef.current.src.replace(BASE_URL, '').replace(/^\//, '');
            pathFromKnownSrc = rawPath.split('?')[0] || '';
        }
    }
    
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        const iframeLocation = iframeRef.current.contentWindow.location;
        let actualPath = (iframeLocation.pathname + iframeLocation.search + iframeLocation.hash).replace(/^\//, '');
        if (iframeLocation.pathname === '/' && !iframeLocation.search && !iframeLocation.hash) {
          actualPath = '';
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
        setTimeout(updateNavState, 150);
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
      <main className="flex-grow relative pb-16"> {/* Always apply pb-16 */}
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="Faylit Store Web View"
          className="w-full h-full border-0" 
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals allow-top-navigation-by-user-activation"
          allowFullScreen
          loading="eager"
          onLoad={() => setIsLoading(false)} // Ensure isLoading is set to false when iframe loads
        />
      </main>
      <BottomNavigation onNavigate={handleNavigation} currentPath={currentWebViewPath} /> {/* Always render BottomNavigation */}
    </div>
  );
};

export default FaylitFrame;
