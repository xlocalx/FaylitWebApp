
import type { Metadata, Viewport } from 'next';
import { Geist_Sans as Geist, Geist_Mono } from 'next/font/local'; // Corrected import for local Geist fonts
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'], // Added subset
  src: [ // Assuming standard installation paths for next/font/local
    { path: '../../node_modules/geist/dist/fonts/geist-sans/Geist-UltraLight.woff2', weight: '200', style: 'normal' },
    { path: '../../node_modules/geist/dist/fonts/geist-sans/Geist-Light.woff2', weight: '300', style: 'normal' },
    { path: '../../node_modules/geist/dist/fonts/geist-sans/Geist-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../node_modules/geist/dist/fonts/geist-sans/Geist-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../../node_modules/geist/dist/fonts/geist-sans/Geist-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../../node_modules/geist/dist/fonts/geist-sans/Geist-Black.woff2', weight: '800', style: 'normal' },
    { path: '../../node_modules/geist/dist/fonts/geist-sans/Geist-UltraBlack.woff2', weight: '900', style: 'normal' },
  ],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'], // Added subset
  src: [ // Assuming standard installation paths for next/font/local
    { path: '../../node_modules/geist/dist/fonts/geist-mono/GeistMono-UltraLight.woff2', weight: '200', style: 'normal' },
    { path: '../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Light.woff2', weight: '300', style: 'normal' },
    { path: '../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../node_modules/geist/dist/fonts/geist-mono/GeistMono-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Black.woff2', weight: '800', style: 'normal' },
    { path: '../../node_modules/geist/dist/fonts/geist-mono/GeistMono-UltraBlack.woff2', weight: '900', style: 'normal' },
  ],
});

export const metadata: Metadata = {
  title: {
    default: 'Faylit E-Mağaza - Sokak Modası, Giyim',
    template: '%s | Faylit',
  },
  description: 'Faylit - Sokak Modası, Giyim. En trend sokak giyim ürünleri, aksesuarlar ve daha fazlasını Faylit E-Mağaza\'da keşfedin.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col h-full`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
