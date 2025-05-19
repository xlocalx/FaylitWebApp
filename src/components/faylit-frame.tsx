
"use client";

import type { FC } from 'react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import BottomNavigation from './bottom-navigation'; // Adjusted path
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
    const finalUrl = urlObject.toString();
    console.log('[FaylitFrame] Building URL for iframe:', finalUrl);
    return finalUrl;
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
    setIsLoading(true);
    setIframeSrc(buildUrl(initialPath));
    setCurrentWebViewPath(initialPath);
    const newAppPath = initialPath ? `/${initialPath.replace(/^\//, '')}` : '/';
    if (typeof window !== "undefined" && window.location.pathname !== newAppPath) {
      window.history.replaceState(null, '', newAppPath);
    }
  }, [initialPath, buildUrl]);


  const updateNavState = useCallback(() => {
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
        const newAppPath = actualPath ? `/${actualPath.replace(/^\//, '')}` : '/';
        if (typeof window !== "undefined" && window.location.pathname !== newAppPath) {
          window.history.pushState(null, '', newAppPath);
        }

      } catch (error) {
        console.warn('FaylitFrame: Could not read iframe contentWindow.location due to cross-origin restrictions. Falling back to last known src path without UTMs.', error);
        setCurrentWebViewPath(pathFromKnownSrc); 
         const newAppPath = pathFromKnownSrc ? `/${pathFromKnownSrc.replace(/^\//, '')}` : '/';
         if (typeof window !== "undefined" && window.location.pathname !== newAppPath) {
            window.history.pushState(null, '', newAppPath);
        }
      }
    } else {
       setCurrentWebViewPath(pathFromKnownSrc);
       const newAppPath = pathFromKnownSrc ? `/${pathFromKnownSrc.replace(/^\//, '')}` : '/';
       if (typeof window !== "undefined" && window.location.pathname !== newAppPath) {
          window.history.pushState(null, '', newAppPath);
      }
    }
  }, [setCurrentWebViewPath]);


  const handleNavigation = useCallback((path: string) => {
    const newUrl = buildUrl(path);
    setCurrentWebViewPath(path); 
    setIsLoading(true); 
    setIframeSrc(newUrl);
    const newAppPath = path ? `/${path.replace(/^\//, '')}` : '/';
    if (typeof window !== "undefined") {
      window.history.pushState(null, '', newAppPath);
    }
  }, [buildUrl]);

  useEffect(() => {
    const iframe = iframeRef.current;
    const handleIframeLoadEvent = () => {
      setIsLoading(false); 
      setTimeout(updateNavState, 50); 
    };

    if (iframe) {
      iframe.addEventListener('load', handleIframeLoadEvent);
      return () => {
        if (iframe) {
          iframe.removeEventListener('load', handleIframeLoadEvent);
        }
      };
    }
  }, [updateNavState, iframeSrc]); 

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <main className="flex-grow relative pb-16">
        <iframe
          key={iframeSrc}
          ref={iframeRef}
          src={iframeSrc}
          title="Faylit Store Web View"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals allow-top-navigation-by-user-activation"
          allowFullScreen
          loading="eager"
          allow="attribution-reporting; browsing-topics;"
          onLoad={() => setIsLoading(false)} 
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

    