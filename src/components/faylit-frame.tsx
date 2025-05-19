
"use client";

import type { FC } from 'react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import BottomNavigation from './bottom-navigation';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaylitFrameProps {
  initialPath?: string;
}

const BASE_URL = "https://faylit.com";
const DISCOUNT_CODE = "APP10";
const DISCOUNT_POPUP_LS_KEY = "faylitDiscountPopupShown";

const FaylitFrame: FC<FaylitFrameProps> = ({ initialPath = "" }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast, dismiss } = useToast();

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

  const [isDiscountPopupOpen, setIsDiscountPopupOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const popupShown = localStorage.getItem(DISCOUNT_POPUP_LS_KEY);
      if (popupShown !== 'true') {
        const timer = setTimeout(() => {
          setIsDiscountPopupOpen(true);
          localStorage.setItem(DISCOUNT_POPUP_LS_KEY, 'true');
        }, 700);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleCloseDiscountPopup = () => setIsDiscountPopupOpen(false);

  const handleCopyDiscountCode = async () => {
    if (!navigator.clipboard) {
      const { id: toastId } = toast({
        title: "Hata",
        description: "Panoya kopyalama bu tarayıcıda/ortamda desteklenmiyor.",
        variant: "destructive",
      });
      setTimeout(() => { dismiss(toastId); }, 5000);
      console.error('Clipboard API not available.');
      return;
    }

    try {
      await navigator.clipboard.writeText(DISCOUNT_CODE);
      const { id: toastId } = toast({
        title: "Kod Kopyalandı!",
        description: `${DISCOUNT_CODE} kodu panonuza kopyalandı.`,
      });
      setTimeout(() => {
        dismiss(toastId); 
      }, 4000);
    } catch (err) {
      const { id: toastId } = toast({
        title: "Hata",
        description: "Kod kopyalanamadı. Lütfen manuel olarak kopyalayın.",
        variant: "destructive",
      });
      setTimeout(() => { 
        dismiss(toastId);
      }, 5000);
      console.error('Failed to copy discount code: ', err);
    }
  };

  useEffect(() => {
    const newSrc = buildUrl(initialPath);
    if (iframeSrc !== newSrc) {
        setIsLoading(true);
        setIframeSrc(newSrc);
        setCurrentWebViewPath(initialPath); // Keep currentWebViewPath in sync with what we intend to load
    }
  }, [initialPath, buildUrl, iframeSrc]); // Removed setCurrentWebViewPath from deps, already handled


  const updateNavState = useCallback(() => {
    // This function is called after the iframe has loaded.
    // setIsLoading(false) should have already been called by iframe's onLoad.
    // If for some reason isLoading is still true, this call will correct it.
    if (isLoading) {
      setIsLoading(false);
    }

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
            const src = iframeRef.current?.src || '';
            const rawPath = src.replace(BASE_URL, '').replace(/^\//, '');
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
        console.warn('FaylitFrame: Could not read iframe contentWindow.location due to cross-origin restrictions. Falling back to last known src path without UTMs.', error);
        setCurrentWebViewPath(pathFromKnownSrc); 
      }
    } else {
       setCurrentWebViewPath(pathFromKnownSrc);
    }
  }, [isLoading, setCurrentWebViewPath]);


  const handleNavigation = useCallback((path: string) => {
    const newUrl = buildUrl(path);
    setCurrentWebViewPath(path); 
    setIsLoading(true); // Always set loading true when initiating navigation
    if (iframeSrc === newUrl) {
      // If SRC is the same, try to navigate iframe directly (e.g. for hash changes or refresh)
      if (iframeRef.current?.contentWindow) {
        try {
          iframeRef.current.contentWindow.location.href = newUrl;
          // If successful, onLoad will handle setIsLoading(false) and updateNavState
        } catch (e) {
          console.warn('FaylitFrame: Could not directly set iframe location. Reloading via src attribute.', e);
          // Fallback: Force reload by changing src, even if it's to the same URL.
          // A key change on iframe might be more robust for this.
          setIframeSrc(''); // Temporarily change src to ensure reload
          setTimeout(() => setIframeSrc(newUrl), 0);
        }
      } else {
        // If no contentWindow, just set src (should trigger load)
        setIframeSrc(newUrl);
      }
    } else {
      // If SRC is different, just set it (should trigger load)
      setIframeSrc(newUrl);
    }
  }, [iframeSrc, buildUrl, setCurrentWebViewPath]);


  // Effect to call updateNavState when the iframe's content has loaded
  // This is separate from setIsLoading, which is handled by the iframe's onLoad prop.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const handleIframeLoadEvent = () => {
        // No need to setIsLoading(false) here, iframe.onLoad does that.
        // Just update the navigation state.
        // A small delay can sometimes be beneficial for stability.
        setTimeout(updateNavState, 50);
      };

      iframe.addEventListener('load', handleIframeLoadEvent);
      return () => {
        iframe.removeEventListener('load', handleIframeLoadEvent);
      };
    }
  }, [updateNavState]); // updateNavState is memoized

  // This effect ensures that if the iframeSrc prop actually changes programmatically,
  // the iframe HTML element's src attribute is updated.
  // This might be redundant if React handles the 'src' prop update on the iframe element well.
  // However, direct manipulation can be more certain.
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.src !== iframeSrc) {
      // setIsLoading(true); // Already set by handleNavigation or initialPath effect
      iframeRef.current.src = iframeSrc;
    }
  }, [iframeSrc]);

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <main className="flex-grow relative pb-16">
        <iframe
          // Using a key derived from iframeSrc can help ensure the iframe fully reloads
          // when the src changes, which is often more reliable than just setting .src
          key={iframeSrc}
          ref={iframeRef}
          src={iframeSrc}
          title="Faylit Store Web View"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals allow-top-navigation-by-user-activation"
          allowFullScreen
          loading="eager" // Request browser to load iframe content eagerly
          onLoad={() => {
            setIsLoading(false); // Primary handler for when iframe content is loaded
            // updateNavState will be called by the separate 'load' event listener useEffect
          }}
        />
      </main>
      <BottomNavigation onNavigate={handleNavigation} currentPath={currentWebViewPath} />

      <AlertDialog open={isDiscountPopupOpen} onOpenChange={setIsDiscountPopupOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Özel İndirim Kodu!</AlertDialogTitle>
            <AlertDialogDescription>
              Uygulama kullanıcılarımıza özel %10 indirim! Alışverişlerinizde kullanabileceğiniz kod:
              <strong className="block text-2xl my-2 text-foreground">{DISCOUNT_CODE}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel onClick={handleCloseDiscountPopup}>Kapat</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleCopyDiscountCode}>
                <Copy className="mr-2 h-4 w-4" /> Kodu Kopyala
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FaylitFrame;

    