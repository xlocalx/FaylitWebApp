
"use client";

import type { FC } from 'react';
import { Home, ShoppingCart, Percent, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: FC<React.SVGProps<SVGSVGElement>>;
  testId: string;
  externalLoginUrl?: string;
}

const navItems: NavItem[] = [
  { label: 'Faylit', path: '', icon: Home, testId: 'faylit-button' },
  { label: 'Sepet', path: 'cart', icon: ShoppingCart, testId: 'sepet-button' },
  {
    label: 'Favorilerim',
    path: 'account/favorite-products', // Target path in WebView after successful login & return
    icon: Heart,
    testId: 'favorilerim-button',
    externalLoginUrl: 'https://faylit.com/account/login', // URL to open in CCT
  },
  { label: 'İndirim', path: 'indirim', icon: Percent, testId: 'indirim-button' },
];

interface BottomNavigationProps {
  onNavigate: (path: string, externalLoginUrl?: string) => void;
  currentPath: string;
}

const BottomNavigation: FC<BottomNavigationProps> = ({ onNavigate, currentPath }) => {
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 h-16 border-t border-border shadow-md flex items-center justify-around z-20",
      "bg-background"
    )}>
      {navItems.map((item) => {
        const normalizedCurrentPath = currentPath.replace(/^\/|\/$/g, '');
        const normalizedItemPath = item.path.replace(/^\/|\/$/g, '');
        const isActive = normalizedCurrentPath === normalizedItemPath;

        return (
          <button
            type="button"
            key={item.label}
            className={cn(
              "flex flex-col items-center justify-center h-full flex-1",
              "transition-colors duration-150 ease-in-out",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "overflow-hidden",
              "px-1 py-2",
              "text-[11px] leading-tight",
              isActive
                ? "bg-primary/20 text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
            onClick={() => onNavigate(item.path, item.externalLoginUrl)}
            data-testid={item.testId}
            aria-current={isActive ? "page" : undefined}
          >
            <item.icon className={cn("h-5 w-5 mb-0.5")} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;
