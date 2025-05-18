
"use client";

import type { FC } from 'react';
import { Home, ShoppingCart, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  onNavigate: (path: string) => void;
  currentPath: string;
}

const navItems = [
  { label: 'Faylit', path: '', icon: Home, testId: 'faylit-button' },
  { label: 'Sepet', path: 'cart', icon: ShoppingCart, testId: 'sepet-button' },
  { label: 'İndirim', path: 'indirim', icon: Percent, testId: 'indirim-button' },
];

const BottomNavigation: FC<BottomNavigationProps> = ({ onNavigate, currentPath }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border shadow-md flex items-center justify-around z-20">
      {navItems.map((item) => {
        // Normalize currentPath for comparison (e.g., remove leading/trailing slashes)
        const normalizedCurrentPath = currentPath.replace(/^\/|\/$/g, '');
        const normalizedItemPath = item.path.replace(/^\/|\/$/g, '');
        const isActive = normalizedCurrentPath === normalizedItemPath;

        return (
          <Button
            key={item.label}
            variant="ghost"
            className={cn(
              "flex flex-col items-center justify-center h-full w-1/3 rounded-none text-xs p-1",
              isActive ? "text-primary font-semibold" : "text-muted-foreground"
            )}
            onClick={() => onNavigate(item.path)}
            data-testid={item.testId}
            aria-current={isActive ? "page" : undefined}
          >
            <item.icon className={cn("h-5 w-5 mb-0.5", isActive ? "text-primary" : "")} />
            {item.label}
          </Button>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;
