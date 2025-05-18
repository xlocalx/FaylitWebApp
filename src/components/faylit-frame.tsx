
"use client";

import type { FC } from 'react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import BottomNavigation from './bottom-navigation';
import { useToast } from '@/hooks/use-toast';

interface FaylitFrameProps {
  initialPath?: string;
}

const BASE_URL = "https://faylit.com";

// Helper function to convert VAPID public key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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
  const [isLoading, setIsLoading] = useState(true); // True for initial load and subsequent loads

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
    
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        const iframeLocation = iframeRef.current.contentWindow.location;
        let iframePathname = iframeLocation.pathname;
        if (iframeLocation.hostname.endsWith('faylit.com') || iframeLocation.hostname === 'faylit.com') {
          // Remove leading slash if present, unless it's the only character
          let path = iframePathname.startsWith('/') ? iframePathname.substring(1) : iframePathname;
          
          // Handle root path correctly
          if (iframePathname === '/') {
            path = '';
          }
          setCurrentWebViewPath(path);
        } else {
          // If the iframe has navigated to a different domain, we might not be able to read the path
          // or we might want to reset the app's path notion.
          // For now, we'll assume it might be an external link and keep current app path or reset.
          console.warn('Navigated to external domain:', iframeLocation.origin);
        }

      } catch (error) {
        console.warn('FaylitFrame: Could not update nav state from iframe due to cross-origin restrictions or other error.', error);
        // Potentially reset currentWebViewPath or handle as an external navigation
      }
    }
  }, [setCurrentWebViewPath]); 

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        // A short delay can help ensure any client-side routing in iframe completes
        setTimeout(() => {
          updateNavState();
          if (isFirstLoad) { // Only set isFirstLoad to false after initial iframe load completes
            setIsFirstLoad(false);
          }
        }, 100); 
      };
      iframe.addEventListener('load', handleLoad);
      return () => {
        iframe.removeEventListener('load', handleLoad);
      };
    }
  }, [updateNavState, isFirstLoad]); // isFirstLoad added

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.src !== iframeSrc) {
      iframeRef.current.src = iframeSrc;
    }
  }, [iframeSrc]);

  // Timer for the initial loading screen (logo screen)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading && isFirstLoad) { // Only apply 2s timeout to the very first logo screen
      timer = setTimeout(() => {
        setIsLoading(false); // Hide loading screen
        setIsFirstLoad(false); // Mark first load as done
      }, 2000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isLoading, isFirstLoad]);


  // Request notification permission and subscribe
  useEffect(() => {
    if (!isFirstLoad && !permissionRequested && typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      const registerServiceWorkerAndSubscribe = async () => {
        try {
          const swRegistration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', swRegistration);
          
          // It's good practice to wait for the SW to be active
          await navigator.serviceWorker.ready;

          const permission = await Notification.requestPermission();
          setPermissionRequested(true); // Mark as requested regardless of outcome for this session

          if (permission === 'granted') {
            toast({
              title: "Bildirimler Etkinleştirildi",
              description: "Faylit Store'dan en son güncellemeler ve özel teklifler hakkında bildirim alacaksınız.",
            });

            const applicationServerKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!applicationServerKey) {
              console.error('VAPID public key not found. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable.');
              toast({
                title: "Bildirim Hatası",
                description: "Bildirim ayarları yapılandırılamadı (anahtar eksik).",
                variant: "destructive",
              });
              return;
            }

            const subscription = await swRegistration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(applicationServerKey),
            });
            console.log('User is subscribed:', subscription);

            await fetch('/api/subscribe', {
              method: 'POST',
              body: JSON.stringify(subscription),
              headers: {
                'Content-Type': 'application/json',
              },
            });
            console.log('Subscription sent to server.');

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
        } catch (error: any) {
          console.error('Service Worker registration or Push Subscription failed:', error);
          toast({
            title: "Bildirim Hatası",
            description: `Bildirimler ayarlanamadı: ${error.message || 'Bilinmeyen bir hata oluştu.'}`,
            variant: "destructive",
          });
        }
      };

      registerServiceWorkerAndSubscribe();

    } else if (!isFirstLoad && !permissionRequested) {
        // Handle cases where SW or PushManager not supported, or permission already handled by other means
        setPermissionRequested(true); // Mark as "handled" for this session to prevent re-prompting
        if (typeof window !== 'undefined') {
            if (!('Notification' in window)) console.log('Notifications not supported by this browser.');
            else if (!('serviceWorker' in navigator)) console.log('Service Worker not supported by this browser.');
            else if (!('PushManager' in window)) console.log('Push Manager not supported by this browser.');
            else if (Notification.permission === 'granted') console.log('Notification permission was already granted.');
            else if (Notification.permission === 'denied') console.log('Notification permission was already denied.');
        }
    }
  }, [isFirstLoad, permissionRequested, toast]);


  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <main className={`flex-grow relative ${isFirstLoad && isLoading ? 'pb-0' : 'pb-16'}`}> 
        {isLoading && isFirstLoad && ( // Show logo only on very first load
          <div 
            className="absolute inset-0 flex items-center justify-center bg-white z-30" // Higher z-index
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
