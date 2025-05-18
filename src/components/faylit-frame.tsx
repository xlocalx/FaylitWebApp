
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
  const [isFirstLoad, setIsFirstLoad] = useState(true);
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
    setCurrentWebViewPath(path);
    if (iframeSrc !== newUrl) {
      setIsLoading(true);
      setIframeSrc(newUrl);
    } else if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.location.href = newUrl;
      } catch (e) {
        if (iframeRef.current.src && iframeRef.current.src !== newUrl) {
          iframeRef.current.src = newUrl;
        }
      }
    }
  }, [iframeSrc, buildUrl, setCurrentWebViewPath]);

  const updateNavState = useCallback(() => {
    setIsLoading(false);

    let pathFromKnownSrc = '';
    if (iframeRef.current?.src) {
        const currentSrcUrl = new URL(iframeRef.current.src);
        pathFromKnownSrc = currentSrcUrl.pathname.startsWith('/') ? currentSrcUrl.pathname.substring(1) : currentSrcUrl.pathname;
        if (currentSrcUrl.pathname === '/') {
            pathFromKnownSrc = '';
        }
    }

    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        // Attempt to read the iframe's actual current location.
        // This will fail if the iframe's content is from a different origin (e.g., faylit.com)
        // than the parent app (e.g., firebase-studio domain).
        const iframeLocation = iframeRef.current.contentWindow.location;
        let actualPath = iframeLocation.pathname.startsWith('/') ? iframeLocation.pathname.substring(1) : iframeLocation.pathname;
        if (iframeLocation.pathname === '/') {
          actualPath = '';
        }
        setCurrentWebViewPath(actualPath);
      } catch (error) {
        console.warn('FaylitFrame: Could not read iframe location due to cross-origin restrictions. Falling back to last known src path.', error);
        // Fallback to the path derived from the iframe's src attribute,
        // which is the URL last set by this application.
        setCurrentWebViewPath(pathFromKnownSrc);
      }
    } else {
       // If no contentWindow (e.g., iframe not fully initialized or failed to load), also fallback.
       setCurrentWebViewPath(pathFromKnownSrc);
    }
  }, [setCurrentWebViewPath]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        setTimeout(() => {
          updateNavState();
          if (isFirstLoad) {
            setIsFirstLoad(false);
          }
        }, 100);
      };
      iframe.addEventListener('load', handleLoad);
      return () => {
        iframe.removeEventListener('load', handleLoad);
      };
    }
  }, [updateNavState, isFirstLoad]);

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.src !== iframeSrc) {
      iframeRef.current.src = iframeSrc;
    }
  }, [iframeSrc]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading && isFirstLoad) {
      timer = setTimeout(() => {
        setIsLoading(false);
        setIsFirstLoad(false); 
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
      <main className="flex-grow relative pb-16">
        {isLoading && isFirstLoad && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-white z-30"
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
          className={`w-full h-full border-0 ${isLoading && isFirstLoad ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
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
