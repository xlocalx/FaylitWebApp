
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

  const [isDiscountPopupOpen, setIsDiscountPopupOpen] = useState(false);
  const [hasDiscountPopupBeenShown, setHasDiscountPopupBeenShown] = useState(false);

  useEffect(() => {
    // Show discount popup once on startup after a short delay
    if (!hasDiscountPopupBeenShown) {
      const timer = setTimeout(() => {
        setIsDiscountPopupOpen(true);
      }, 700); // Delay to allow initial render
      return () => clearTimeout(timer);
    }
  }, [hasDiscountPopupBeenShown]);

  const handleCloseDiscountPopup = () => {
    setIsDiscountPopupOpen(false);
    setHasDiscountPopupBeenShown(true);
  };

  const handleCopyDiscountCode = async () => {
    try {
      await navigator.clipboard.writeText(DISCOUNT_CODE);
      toast({
        title: "Kod Kopyalandı!",
        description: `${DISCOUNT_CODE} kodu panonuza kopyalandı.`,
      });
    } catch (err) {
      toast({
        title: "Hata",
        description: "Kod kopyalanamadı. Lütfen manuel olarak kopyalayın.",
        variant: "destructive",
      });
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
            // Remove UTM parameters for internal path tracking
            currentSrcUrl.searchParams.delete('utm_source');
            currentSrcUrl.searchParams.delete('utm_medium');
            currentSrcUrl.searchParams.delete('utm_campaign');
            
            pathFromKnownSrc = (currentSrcUrl.pathname + currentSrcUrl.search + currentSrcUrl.hash).replace(/^\//, '');
            if (currentSrcUrl.pathname === '/' && !currentSrcUrl.search && !currentSrcUrl.hash) {
                 pathFromKnownSrc = ''; // Handle base path correctly
            }

        } catch (e) {
            console.warn('FaylitFrame: Could not parse iframe src URL for pathFromKnownSrc.', e);
            // Fallback for unparseable URLs, try to get path before '?'
            const rawPath = iframeRef.current.src.replace(BASE_URL, '').replace(/^\//, '');
            pathFromKnownSrc = rawPath.split('?')[0] || '';
        }
    }
    
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        const iframeLocation = iframeRef.current.contentWindow.location;
        let actualPath = (iframeLocation.pathname + iframeLocation.search + iframeLocation.hash).replace(/^\//, '');
        if (iframeLocation.pathname === '/' && !iframeLocation.search && !iframeLocation.hash) {
          actualPath = ''; // Handle base path from iframe location
        }
        setCurrentWebViewPath(actualPath);
      } catch (error) {
        console.warn('FaylitFrame: Could not read iframe location due to cross-origin restrictions. Falling back to last known src path without UTMs.', error);
        setCurrentWebViewPath(pathFromKnownSrc); // Fallback to src-derived path
      }
    } else {
       // If no contentWindow, rely on the src-derived path
       setCurrentWebViewPath(pathFromKnownSrc);
    }
  }, [setCurrentWebViewPath]); // Added setCurrentWebViewPath

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        // Using a small timeout can help ensure all scripts in the iframe have potentially run
        setTimeout(updateNavState, 150);
      };
      iframe.addEventListener('load', handleLoad);
      return () => {
        iframe.removeEventListener('load', handleLoad);
      };
    }
  }, [updateNavState]);

  // Effect to update iframe src when iframeSrc state changes
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.src !== iframeSrc) {
      iframeRef.current.src = iframeSrc;
    }
  }, [iframeSrc]);


  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <main className="flex-grow relative pb-16">
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="Faylit Store Web View"
          className="w-full h-full border-0" 
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals allow-top-navigation-by-user-activation"
          allowFullScreen
          loading="eager"
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
              <strong className="block text-2xl my-2 text-primary">{DISCOUNT_CODE}</strong>
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
