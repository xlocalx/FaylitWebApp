
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
    
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        const iframeLocation = iframeRef.current.contentWindow.location;
        let iframePathname = iframeLocation.pathname;
        if (iframeLocation.hostname.endsWith('faylit.com') || iframeLocation.hostname === 'faylit.com') {
          let path = iframePathname.startsWith('/') ? iframePathname.substring(1) : iframePathname;
          if (iframePathname === '/') {
            path = '';
          }
          setCurrentWebViewPath(path);
        } else {
          const intendedUrl = new URL(iframeRef.current.src);
          let intendedPath = intendedUrl.pathname.startsWith('/') ? intendedUrl.pathname.substring(1) : intendedUrl.pathname;
           if (intendedUrl.pathname === '/') {
            intendedPath = '';
          }
          setCurrentWebViewPath(intendedPath);
        }
      } catch (error) {
        console.warn('FaylitFrame: Could not update nav state from iframe due to cross-origin restrictions or other error.', error);
         if (iframeRef.current?.src) {
            const currentSrcUrl = new URL(iframeRef.current.src);
            let fallbackPath = currentSrcUrl.pathname.startsWith('/') ? currentSrcUrl.pathname.substring(1) : currentSrcUrl.pathname;
            if (currentSrcUrl.pathname === '/') {
              fallbackPath = '';
            }
            setCurrentWebViewPath(fallbackPath);
        }
      }
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

  useEffect(() => {
    if (!isFirstLoad && !permissionRequested && typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      const registerServiceWorkerAndSubscribe = async () => {
        try {
          console.log('Attempting to register Service Worker...');
          const swRegistration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', swRegistration);
          
          await navigator.serviceWorker.ready;
          console.log('Service Worker active and ready.');

          const permission = await Notification.requestPermission();
          setPermissionRequested(true); 

          if (permission === 'granted') {
            toast({
              title: "Bildirimler Etkinleştirildi",
              description: "Faylit Store'dan en son güncellemeler ve özel teklifler hakkında bildirim alacaksınız.",
            });

            const applicationServerKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
            console.log('Attempting to subscribe with VAPID public key string (raw):', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
            console.log('Attempting to subscribe with VAPID public key string (trimmed):', applicationServerKey);


            if (!applicationServerKey) {
              console.error('VAPID public key not found. Ensure NEXT_PUBLIC_VAPID_PUBLIC_KEY is set in .env.local, the server was restarted, and the key is correctly prefixed for client-side access.');
              toast({
                title: "Bildirim Yapılandırma Hatası",
                description: "VAPID public key bulunamadı. Lütfen yönetici ile iletişime geçin. (Detaylar konsolda)",
                variant: "destructive",
              });
              return;
            }

            let convertedVapidKey;
            try {
              convertedVapidKey = urlBase64ToUint8Array(applicationServerKey);
              console.log('Converted VAPID key (Uint8Array). Length:', convertedVapidKey.length);
            } catch (conversionError: any) {
              console.error('Failed to convert VAPID public key to Uint8Array:', conversionError);
              console.error('Original VAPID public key string was:', applicationServerKey);
              toast({
                title: "Bildirim Anahtar Hatası",
                description: `VAPID genel anahtarı dönüştürülemedi: ${conversionError.message}. (Detaylar konsolda)`,
                variant: "destructive",
              });
              return;
            }
            
            console.log('ServiceWorkerRegistration object:', swRegistration);
            console.log('PushManager object:', swRegistration.pushManager);

            const subscription = await swRegistration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedVapidKey,
            });
            console.log('User is subscribed:', subscription);

            const response = await fetch('/api/subscribe', {
              method: 'POST',
              body: JSON.stringify(subscription),
              headers: {
                'Content-Type': 'application/json',
              },
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to send subscription to server:', response.status, errorData);
                toast({
                    title: "Abonelik Gönderilemedi",
                    description: `Sunucu aboneliği kaydedemedi: ${errorData.message || response.statusText} (Detaylar konsolda)`,
                    variant: "destructive",
                });
            } else {
                console.log('Subscription sent to server successfully.');
            }

          } else if (permission === 'denied') {
            console.log('Notification permission denied by user.');
            toast({
              title: "Bildirim İzinleri Reddedildi",
              description: "Bildirim almak isterseniz, tarayıcı ayarlarınızdan Faylit Store için izinleri daha sonra etkinleştirebilirsiniz.",
              variant: "destructive",
            });
          } else {
            console.log('Notification permission prompt dismissed by user.');
          }
        } catch (error: any) {
          console.error('Service Worker registration or Push Subscription failed dramatically:', error);
          if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
          } else {
            console.error('Caught non-Error object:', error);
          }
          console.error('VAPID public key used for subscription attempt (trimmed):', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim());
          const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.';
          toast({
            title: "Bildirim Hatası",
            description: `Bildirimler ayarlanamadı: ${errorMessage} (Detaylar konsolda.)`,
            variant: "destructive",
          });
        }
      };

      registerServiceWorkerAndSubscribe();

    } else if (!isFirstLoad && !permissionRequested) {
        setPermissionRequested(true); 
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
