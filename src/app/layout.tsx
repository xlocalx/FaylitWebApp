
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Faylit E-Mağaza - Sokak Modası, Giyim',
    template: '%s | Faylit',
  },
  description: 'Faylit - Sokak Modası, Giyim. En trend sokak giyim ürünleri, aksesuarlar ve daha fazlasını Faylit E-Mağaza\'da keşfedin.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
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
