
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
  const [permissionRequested, setPermissionRequested] = useState(false);

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
      } catch(e) { 
        if (iframeRef.current.src && iframeRef.current.src !== newUrl) {
            iframeRef.current.src = newUrl;
        }
      }
    }
  }, [iframeSrc, buildUrl, setCurrentWebViewPath]);

  const updateNavState = useCallback(() => {
    setIsLoading(false);
    // Removed isFirstLoad update from here, handled by timer/direct load
    
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
  }, [initialPath, setCurrentWebViewPath]); 

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        setTimeout(() => {
          updateNavState();
          // If this is the first load completing, also mark isFirstLoad as false.
          // This ensures the logo doesn't reappear if the iframe itself triggers a load event quickly.
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

  useEffect(() => {
    // Request notification permission after initial loading screen is done
    if (!isFirstLoad && !permissionRequested) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission().then((permission) => {
            setPermissionRequested(true); // Mark as requested for this session
            if (permission === 'granted') {
              console.log('Notification permission granted.');
              toast({
                title: "Bildirimler Etkinleştirildi",
                description: "Faylit Store'dan en son güncellemeler ve özel teklifler hakkında bildirim alacaksınız.",
              });
              // TODO: Subscribe user and send subscription to backend
            } else if (permission === 'denied') {
              console.log('Notification permission denied.');
              toast({
                title: "Bildirim İzinleri Reddedildi",
                description: "Bildirim almak isterseniz, tarayıcı ayarlarınızdan Faylit Store için izinleri daha sonra etkinleştirebilirsiniz.",
                variant: "destructive",
              });
            } else {
              console.log('Notification permission prompt dismissed.');
            }
          });
        } else {
          // Permission already granted or denied, or browser doesn't support
          setPermissionRequested(true); // Mark as "handled" for this session
          if(Notification.permission === 'granted') {
            console.log('Notification permission was already granted.');
          } else if (Notification.permission === 'denied') {
            console.log('Notification permission was already denied.');
          }
        }
      } else {
        console.log('This browser does not support desktop notification or window is not defined.');
        setPermissionRequested(true); // Mark as "handled" for this session
      }
    }
  }, [isFirstLoad, permissionRequested, toast]);


  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <main className="flex-grow relative pb-16"> 
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
    
