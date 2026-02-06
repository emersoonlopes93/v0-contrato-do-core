'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MenuOnlineCategoryDTO } from '@/src/types/menu-online';

interface MenuCategoryBarProps {
  categories: MenuOnlineCategoryDTO[];
  activeCategoryId?: string;
  onCategoryClick: (categoryId: string) => void;
  showAllCategory?: boolean;
  productCounts?: Record<string, number>;
}

export function MenuCategoryBar({ 
  categories, 
  activeCategoryId, 
  onCategoryClick,
  showAllCategory = true,
  productCounts,
}: MenuCategoryBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollButtons();
    container.addEventListener('scroll', checkScrollButtons);
    window.addEventListener('resize', checkScrollButtons);

    return () => {
      container.removeEventListener('scroll', checkScrollButtons);
      window.removeEventListener('resize', checkScrollButtons);
    };
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 200; // pixels
    const newScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  const allCategories = showAllCategory 
    ? [{ id: 'all', name: 'Todos', sortOrder: -1, status: 'active' as const }, ...categories]
    : categories;

  return (
    <div className="relative border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="relative">
        {/* Botões de navegação */}
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 h-8 w-8 rounded-full bg-background shadow-md"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {canScrollRight && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 h-8 w-8 rounded-full bg-background shadow-md"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Barra de categorias scrollável */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-2 overflow-x-auto px-4 py-3 md:px-6 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          {allCategories.map((category) => {
            const isActive = category.id === activeCategoryId;
            const productCount = category.id === 'all'
              ? categories.reduce<number>(
                  (total, categoryItem) =>
                    total + (productCounts?.[categoryItem.id] ?? 0),
                  0,
                )
              : productCounts?.[category.id] ?? 0;

            return (
              <button
                key={category.id}
                onClick={() => onCategoryClick(category.id)}
                className={`
                  flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium
                  whitespace-nowrap transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                  ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground'
                  }
                  ${category.status === 'inactive' ? 'opacity-60' : ''}
                `}
              >
                <span>{category.name}</span>
                <Badge 
                  variant={isActive ? 'secondary' : 'outline'} 
                  className="h-5 px-1.5 text-xs"
                >
                  {productCount}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
