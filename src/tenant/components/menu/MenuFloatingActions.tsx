'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';
import './MenuFloatingActions.css';

interface MenuFloatingActionsProps {
  onScrollToTop?: () => void;
}

export function MenuFloatingActions({ onScrollToTop }: MenuFloatingActionsProps) {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (onScrollToTop) {
      onScrollToTop();
    }
  };

  return (
    <>
      <Button
        onClick={handleScrollToTop}
        size="icon"
        className="fixed bottom-20 right-4 z-30 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105"
      >
        <ChevronUp className="h-5 w-5 text-primary-foreground" />
      </Button>
    </>
  );
}
