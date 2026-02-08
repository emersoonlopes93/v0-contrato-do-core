'use client';

import React from 'react';
import { BaseCard } from './BaseCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, ShoppingCart, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DesignerMenuImageStyle } from '@/src/types/designer-menu';

/**
 * ProductCard - Card padronizado para produtos do cardápio
 * 
 * Estrutura:
 * - Imagem (ou placeholder elegante)
 * - Nome do produto
 * - Descrição curta
 * - Preço
 * - Botão de ação
 * 
 * Variantes:
 * - public: para cardápio público (botão "Adicionar")
 * - admin: para gestão (botão "Editar")
 * - preview: para preview interno (botão "Ver detalhes")
 * 
 * Uso:
 * <ProductCard
 *   variant="public"
 *   name="Pizza Margherita"
 *   description="Molho, mussarela e manjericão"
 *   price={45.90}
 *   imageUrl="https://..."
 *   status="active"
 *   onClick={() => {}}
 * />
 */

type ProductCardProps = {
  variant?: 'public' | 'admin' | 'preview';
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  status?: string;
  currency?: string;
  priceLabel?: string;
  categoryName?: string;
  promoPrice?: number | null;
  onClick?: () => void;
  onEdit?: () => void;
  className?: string;
  showAddButton?: boolean;
  imageStyle?: DesignerMenuImageStyle;
  compact?: boolean;
};

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  } catch {
    return `R$ ${value.toFixed(2)}`;
  }
}

const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="18" fill="%239ca3af"%3ESem imagem%3C/text%3E%3C/svg%3E';

export function ProductCard({
  variant = 'public',
  name,
  description,
  price,
  imageUrl,
  status,
  currency = 'BRL',
  priceLabel,
  categoryName,
  promoPrice,
  onClick,
  onEdit,
  className,
  showAddButton,
  imageStyle,
  compact,
}: ProductCardProps) {
  const isPublic = variant === 'public';
  const isAdmin = variant === 'admin';
  const isPreview = variant === 'preview';

  const hasPromo = promoPrice !== null && promoPrice !== undefined && promoPrice < price;
  const displayPrice = hasPromo ? promoPrice : price;

  const effectiveShowAddButton = !isPublic ? false : showAddButton !== false;
  const isCompact = compact === true;
  const isFullBleed = imageStyle === 'full-bleed';

  const publicImageWrapperClass =
    imageStyle === 'rectangle'
      ? cn(
          'relative flex-shrink-0 overflow-hidden rounded-lg bg-muted',
          isCompact ? 'h-16 w-20 md:h-28 md:w-full' : 'h-20 w-28 md:h-32 md:w-full',
        )
      : imageStyle === 'rounded'
      ? cn(
          'relative flex-shrink-0 overflow-hidden rounded-2xl bg-muted',
          isCompact ? 'h-16 w-16 md:h-28 md:w-full' : 'h-20 w-20 md:h-40 md:w-full',
        )
      : imageStyle === 'full-bleed'
      ? cn(
          'relative w-full flex-shrink-0 overflow-hidden rounded-none bg-muted',
          isCompact ? 'h-32 md:h-40' : 'h-40 md:h-56',
        )
      : cn(
          'relative flex-shrink-0 overflow-hidden rounded-lg bg-muted',
          isCompact ? 'h-16 w-16 md:h-28 md:w-full' : 'h-20 w-20 md:h-40 md:w-full',
        );

  if (isPublic) {
    if (isFullBleed) {
      return (
        <BaseCard
          onClick={onClick}
          hover
          className={cn('overflow-hidden', status === 'inactive' && 'opacity-60', className)}
        >
          <div className={cn('relative', isCompact ? 'h-40' : 'h-48 md:h-56')}>
            <img
              src={imageUrl || FALLBACK_IMAGE}
              alt={name}
              className="h-full w-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(to top, hsl(var(--overlay-strong) / 0.85), hsl(var(--overlay-strong) / 0.55), hsl(var(--overlay-strong) / 0.05))',
              }}
            />
            {hasPromo && (
              <Badge className="absolute right-3 top-3 bg-danger text-[10px] text-danger-foreground">
                Promo
              </Badge>
            )}
            {status === 'inactive' && (
              <Badge variant="secondary" className="absolute left-3 top-3 text-[10px]">
                Indisponível
              </Badge>
            )}
            <div
              className="absolute inset-x-0 bottom-0 space-y-3 px-4 pb-4"
              style={{ color: 'hsl(var(--overlay-foreground))' }}
            >
              <div className="space-y-1">
                <h3 className={cn('line-clamp-2 font-semibold leading-tight', isCompact ? 'text-sm' : 'text-base')}>
                  {name}
                </h3>
                {description && (
                  <p
                    className="line-clamp-2 text-xs"
                    style={{ color: 'hsl(var(--overlay-foreground-muted))' }}
                  >
                    {description}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  {hasPromo && (
                    <span
                      className="text-xs line-through"
                      style={{ color: 'hsl(var(--overlay-foreground-muted))' }}
                    >
                      {formatCurrency(price, currency)}
                    </span>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className={cn('font-semibold', isCompact ? 'text-sm' : 'text-lg')}>
                      {formatCurrency(displayPrice, currency)}
                    </span>
                    {priceLabel && (
                      <span
                        className="text-[11px]"
                        style={{ color: 'hsl(var(--overlay-foreground-muted))' }}
                      >
                        / {priceLabel}
                      </span>
                    )}
                  </div>
                </div>
                {effectiveShowAddButton && (
                  <Button
                    type="button"
                    className="h-9 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (onClick) {
                        onClick();
                      }
                    }}
                  >
                    Adicionar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </BaseCard>
      );
    }

    return (
      <BaseCard
        onClick={onClick}
        hover
        className={cn('flex h-full flex-col overflow-hidden', status === 'inactive' && 'opacity-60', className)}
      >
        <div className={cn('flex flex-1 gap-3 md:flex-col', isCompact ? 'px-2 pt-2' : 'px-3 pt-3')}>
          <div className={publicImageWrapperClass}>
            <img
              src={imageUrl || FALLBACK_IMAGE}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-200"
            />
            {hasPromo && (
              <Badge className="absolute right-1.5 top-1.5 bg-danger text-[10px] text-danger-foreground">
                Promo
              </Badge>
            )}
            {status === 'inactive' && (
              <Badge variant="secondary" className="absolute left-1.5 top-1.5 text-[10px]">
                Indisponível
              </Badge>
            )}
          </div>
          <div className={cn('flex min-w-0 flex-1 flex-col justify-between', isCompact ? 'py-1' : 'py-1.5 md:py-2.5')}>
            <div className="space-y-1">
              <h3 className={cn('line-clamp-2 font-semibold leading-snug text-foreground', isCompact ? 'text-xs' : 'text-sm md:text-base')}>
                {name}
              </h3>
              {description && (
                <p className={cn('line-clamp-1 text-muted-foreground', isCompact ? 'text-[11px]' : 'text-xs')}>
                  {description}
                </p>
              )}
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div className="flex flex-col leading-none">
                {hasPromo && (
                  <span className={cn('text-muted-foreground line-through', isCompact ? 'text-[11px]' : 'text-xs')}>
                    {formatCurrency(price, currency)}
                  </span>
                )}
                <div className="flex items-baseline gap-1">
                  <span className={cn('font-semibold text-foreground', isCompact ? 'text-sm' : 'text-base md:text-lg')}>
                    {formatCurrency(displayPrice, currency)}
                  </span>
                  {priceLabel && (
                    <span className="text-[11px] text-muted-foreground">/ {priceLabel}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {effectiveShowAddButton && (
          <BaseCard.Footer className={cn('border-t', isCompact ? 'px-2 pb-2 pt-2' : 'px-3 pb-3 pt-2')}>
            <Button
              type="button"
              className={cn(
                'w-full gap-2 rounded-full font-medium',
                isCompact ? 'h-10 text-xs' : 'h-11 text-sm',
              )}
              onClick={(event) => {
                event.stopPropagation();
                if (onClick) {
                  onClick();
                }
              }}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Adicionar</span>
            </Button>
          </BaseCard.Footer>
        )}
      </BaseCard>
    );
  }

  return (
    <BaseCard
      onClick={isAdmin ? undefined : onClick}
      hover={!isAdmin}
      className={cn(
        'overflow-hidden',
        status === 'inactive' && 'opacity-60',
        !isAdmin && 'hover:border-primary/50',
        className,
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={imageUrl || FALLBACK_IMAGE}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
        />
        {hasPromo && (
          <Badge className="absolute right-2 top-2 bg-danger text-danger-foreground">
            Promoção
          </Badge>
        )}
        {status === 'inactive' && (
          <Badge variant="secondary" className="absolute left-2 top-2">
            Inativo
          </Badge>
        )}
      </div>

      <BaseCard.Header
        title={
          <div className="space-y-1">
            <h3 className="text-lg font-semibold leading-tight">{name}</h3>
            {categoryName && <p className="text-xs text-muted-foreground">{categoryName}</p>}
          </div>
        }
      />

      <BaseCard.Content className="space-y-3">
        {description && (
          <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}

        <div className="flex items-baseline gap-2">
          {hasPromo && (
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(price, currency)}
            </span>
          )}
          <span className="text-2xl font-bold text-foreground">
            {formatCurrency(displayPrice, currency)}
          </span>
          {priceLabel && (
            <span className="text-xs text-muted-foreground">/ {priceLabel}</span>
          )}
        </div>
      </BaseCard.Content>

      <BaseCard.Footer className="border-t">
        {isPreview && (
          <Button variant="outline" className="w-full gap-2" onClick={onClick}>
            <Eye className="h-4 w-4" />
            Ver detalhes
          </Button>
        )}
        {isAdmin && (
          <div className="flex w-full gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={onEdit}>
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={onClick}>
              <Eye className="h-4 w-4" />
              Visualizar
            </Button>
          </div>
        )}
      </BaseCard.Footer>
    </BaseCard>
  );
}
