
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

interface FaylitFrameProps {
  initialPath?: string;
}

const BASE_URL = "https://faylit.com";
const DISCOUNT_CODE = "APP10";
const DISCOUNT_POPUP_LS_KEY = "faylitDiscountPopupShown"; // localStorage key

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
    // Check localStorage to see if the popup has been shown before
    if (typeof window !== "undefined") { // Ensure localStorage is available
      const popupShown = localStorage.getItem(DISCOUNT_POPUP_LS_KEY);
      if (popupShown !== 'true') {
        // If not shown, show it after a short delay
        const timer = setTimeout(() => {
          setIsDiscountPopupOpen(true);
          localStorage.setItem(DISCOUNT_POPUP_LS_KEY, 'true'); // Mark as shown
        }, 700); // Delay to allow initial render
        return () => clearTimeout(timer);
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleCloseDiscountPopup = () => {
    setIsDiscountPopupOpen(false);
  };

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
        if (iframeRef.current.contentWindow.location.href !== newUrl) {
          iframeRef.current.contentWindow.location.href = newUrl;
        }
      } catch (e) {
         console.warn('FaylitFrame: Could not directly set iframe location due to cross-origin. Falling back to src update.', e);
        if (iframeRef.current.src && iframeRef.current.src !== newUrl) {
          setIsLoading(true);
          iframeRef.current.src = newUrl;
        }
      }
    }
  }, [iframeSrc, buildUrl, setCurrentWebViewPath]);


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
  }, [setCurrentWebViewPath]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        setTimeout(updateNavState, 150); 
      };
      iframe.addEventListener('load', handleLoad);
      // Set isLoading to false if the iframe loads quickly or is already cached
      if (iframe.contentWindow && iframe.contentWindow.document.readyState === 'complete') {
        setIsLoading(false);
      }
      return () => {
        iframe.removeEventListener('load', handleLoad);
      };
    }
  }, [updateNavState, iframeSrc]); // Added iframeSrc to re-attach listener if src changes

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.src !== iframeSrc) {
      iframeRef.current.src = iframeSrc;
    }
  }, [iframeSrc]);


  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <main className="flex-grow relative pb-16"> {/* Added pb-16 here */}
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="Faylit Store Web View"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals allow-top-navigation-by-user-activation"
          allowFullScreen
          loading="eager"
          onLoad={() => setIsLoading(false)} // Ensure isLoading is set to false on load
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
