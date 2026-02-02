'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * BaseCard - Card base reutilizável com visual padronizado
 * 
 * Características:
 * - Border radius médio (12px)
 * - Sombra suave
 * - Hover com elevação leve
 * - Mobile-first
 * - Desktop com densidade maior
 * 
 * Uso:
 * <BaseCard onClick={...}>
 *   <BaseCard.Header title="Título" description="Descrição" />
 *   <BaseCard.Content>Conteúdo</BaseCard.Content>
 *   <BaseCard.Footer>Ações</BaseCard.Footer>
 * </BaseCard>
 */

type BaseCardProps = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  hover?: boolean;
};

type BaseCardHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

type BaseCardContentProps = {
  children: React.ReactNode;
  className?: string;
};

type BaseCardFooterProps = {
  children: React.ReactNode;
  className?: string;
};

function BaseCardRoot({ children, onClick, className, hover = true }: BaseCardProps) {
  return (
    <Card
      className={cn(
        'rounded-xl transition-all duration-200',
        onClick && 'cursor-pointer',
        hover && onClick && 'hover:shadow-md hover:-translate-y-0.5',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

function BaseCardHeader({ title, description, action, className }: BaseCardHeaderProps) {
  return (
    <CardHeader className={cn('pb-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base font-semibold leading-tight">{title}</CardTitle>
          {description && <CardDescription className="mt-1 text-sm">{description}</CardDescription>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </CardHeader>
  );
}

function BaseCardContent({ children, className }: BaseCardContentProps) {
  return <CardContent className={cn('pb-3', className)}>{children}</CardContent>;
}

function BaseCardFooter({ children, className }: BaseCardFooterProps) {
  return <CardFooter className={cn('pt-3', className)}>{children}</CardFooter>;
}

export const BaseCard = Object.assign(BaseCardRoot, {
  Header: BaseCardHeader,
  Content: BaseCardContent,
  Footer: BaseCardFooter,
});
