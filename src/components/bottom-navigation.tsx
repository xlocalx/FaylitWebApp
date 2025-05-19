
"use client";

import type { FC } from 'react';
import { Home, ShoppingCart, Percent, Heart } from 'lucide-react';
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
          <button
            type="button"
            key={item.label}
            className={cn(
              // Base structure and sizing for the button element
              "flex flex-col items-center justify-center h-full flex-1",
              // Visuals and interaction
              "rounded-none transition-colors duration-150 ease-in-out",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", // Standard focus for accessibility
              "overflow-hidden", // Keep this for safety, clips content if it's still too large
              "px-1 py-2", // Explicit padding: minimal horizontal, reasonable vertical
              "text-[11px] leading-tight", // Text styling
              // Conditional styling for active/inactive states
              isActive
                ? "bg-primary/20 text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
            onClick={() => onNavigate(item.path)}
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
