'use client';

import React from 'react';
import { BaseCard } from './BaseCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, ShoppingCart, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}: ProductCardProps) {
  const isPublic = variant === 'public';
  const isAdmin = variant === 'admin';
  const isPreview = variant === 'preview';

  const hasPromo = promoPrice !== null && promoPrice !== undefined && promoPrice < price;
  const displayPrice = hasPromo ? promoPrice : price;

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
      {/* Imagem */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={imageUrl || FALLBACK_IMAGE}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
        />
        {hasPromo && (
          <Badge className="absolute right-2 top-2 bg-red-500 text-white">Promoção</Badge>
        )}
        {status === 'inactive' && (
          <Badge variant="secondary" className="absolute left-2 top-2">
            Inativo
          </Badge>
        )}
      </div>

      {/* Conteúdo */}
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

      {/* Ações */}
      <BaseCard.Footer className="border-t">
        {isPublic && (
          <Button className="w-full gap-2" onClick={onClick}>
            <ShoppingCart className="h-4 w-4" />
            Adicionar
          </Button>
        )}
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
