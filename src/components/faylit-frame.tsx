
"use client";

import type { FC } from 'react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import BottomNavigation from './bottom-navigation';
import { useToast } from '@/hooks/use-toast';

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
  const [isLoading, setIsLoading] = useState(true); // For iframe content loading

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
        const currentSrcUrl = new URL(iframeRef.current.src);
        pathFromKnownSrc = currentSrcUrl.pathname.startsWith('/') ? currentSrcUrl.pathname.substring(1) : currentSrcUrl.pathname;
        if (currentSrcUrl.pathname === '/') {
            pathFromKnownSrc = '';
        }
        currentSrcUrl.searchParams.delete('utm_source');
        currentSrcUrl.searchParams.delete('utm_medium');
        currentSrcUrl.searchParams.delete('utm_campaign');
        pathFromKnownSrc = (currentSrcUrl.pathname + currentSrcUrl.search + currentSrcUrl.hash).replace(/^\//, '');
    }
    
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        const iframeLocation = iframeRef.current.contentWindow.location;
        let actualPath = (iframeLocation.pathname + iframeLocation.search + iframeLocation.hash).replace(/^\//, '');
         if (iframeLocation.pathname === '/') {
          actualPath = (iframeLocation.search + iframeLocation.hash).replace(/^\//, '');
        }
        setCurrentWebViewPath(actualPath);
        // Fallback if path seems empty but shouldn't be (e.g. initial load is just "/")
        if(actualPath === '' && iframeRef.current.src.includes(BASE_URL) && new URL(iframeRef.current.src).pathname !== '/') {
            setCurrentWebViewPath(pathFromKnownSrc);
        }

      } catch (error) {
        console.warn('FaylitFrame: Could not read iframe location due to cross-origin restrictions. Falling back to last known src path.', error);
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

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <main className={`flex-grow relative ${isLoading ? 'pb-0' : 'pb-16'}`}>
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="Faylit Store Web View"
          className={`w-full h-full border-0 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
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
