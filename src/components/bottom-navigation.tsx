
"use client";

import type { FC } from 'react';
import { Home, ShoppingCart, Percent, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  onNavigate: (path: string) => void;
  currentPath: string;
}

const navItems = [
  { label: 'Faylit', path: '', icon: Home, testId: 'faylit-button' },
  { label: 'Sepet', path: 'cart', icon: ShoppingCart, testId: 'sepet-button' },
  { label: 'Favorilerim', path: 'account/favorite-products', icon: Heart, testId: 'favorilerim-button' },
  { label: 'İndirim', path: 'indirim', icon: Percent, testId: 'indirim-button' },
];

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
          <Button
            key={item.label}
            variant="ghost"
            className={cn(
              "flex flex-col items-center justify-center h-full flex-1 rounded-none text-xs p-1 transition-colors duration-150 ease-in-out focus-visible:ring-0 focus-visible:ring-offset-0",
              item.path === 'indirim'
                ? [
                    "bg-gradient-to-r from-red-500 via-red-600 to-red-700",
                    isActive
                      ? "text-white font-semibold"
                      : "text-white/80 hover:text-white", // Changed from text-red-200
                  ]
                : [
                    isActive
                      ? "bg-primary/20 text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-accent-foreground",
                  ]
            )}
            onClick={() => onNavigate(item.path)}
            data-testid={item.testId}
            aria-current={isActive ? "page" : undefined}
          >
            <item.icon className={cn("h-5 w-5 mb-0.5")} />
            {item.label}
          </Button>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;
