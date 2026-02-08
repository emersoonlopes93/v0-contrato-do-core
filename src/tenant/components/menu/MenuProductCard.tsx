'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Star,
  Plus,
  ChevronDown,
} from 'lucide-react';
import type { MenuOnlineProductDTO } from '@/src/types/menu-online';

interface MenuProductCardProps {
  product: MenuOnlineProductDTO;
  onToggleStatus: (product: MenuOnlineProductDTO) => Promise<void>;
  onEditProduct: (product: MenuOnlineProductDTO) => void;
  onDeleteProduct: (productId: string) => void;
  onDuplicateProduct: (product: MenuOnlineProductDTO) => void;
  onAddVariation?: (productId: string) => void;
  onOpenModifiers?: (productId: string) => void;
  isDragging?: boolean;
  dragHandle?: React.ReactNode;
}

export function MenuProductCard({
  product,
  onToggleStatus,
  onEditProduct,
  onDeleteProduct,
  onDuplicateProduct,
  onAddVariation,
  onOpenModifiers,
  isDragging = false,
  dragHandle
}: MenuProductCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const hasModifiers = product.modifierGroupIds.length > 0;
  const imageUrl = product.images[0]?.url ?? '';
  const hasPromo = product.promoPrice !== null;
  const oldPrice = product.promoPrice !== null ? product.basePrice : null;
  const currentPrice = product.promoPrice ?? product.basePrice;
  const hasVariations = product.priceVariations.length > 1;

  const handleToggleStatus = async () => {
    if (isToggling) return;

    setIsToggling(true);
    try {
      await onToggleStatus(product);
    } finally {
      setIsToggling(false);
    }
  };

  const handleEdit = () => {
    onEditProduct(product);
  };

  const handleDelete = () => {
    onDeleteProduct(product.id);
  };

  const handleDuplicate = () => {
    onDuplicateProduct(product);
  };

  const handleOpenModifiers = () => {
    if (onOpenModifiers) {
      onOpenModifiers(product.id);
    }
  };

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  return (
    <div
      className={`
        group relative flex flex-col gap-4 rounded-xl border bg-card p-4
        transition-all duration-200
        ${product.status === 'active' 
          ? 'hover:border-primary/20' 
          : 'opacity-80 hover:opacity-100'
        }
        ${isDragging ? 'opacity-50 scale-95 shadow-md' : ''}
      `}
    >
      {/* Drag handle */}
      {dragHandle && (
        <div className="absolute left-2 top-4 z-10">
          {dragHandle}
        </div>
      )}

      <div className="flex gap-4">
        {/* Imagem do produto */}
        <div className="flex-shrink-0">
          <div className="h-[60px] w-[60px] overflow-hidden rounded-lg bg-muted md:h-24 md:w-24">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                Sem imagem
              </div>
            )}
          </div>
        </div>

        {/* Informações do produto */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Header: Nome + Status + Ações */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0 overflow-hidden flex-nowrap w-[calc(100%-20px)] sm:w-auto">
                <h4 className="min-w-0 truncate text-base font-semibold">{product.name}</h4>
                <div className="flex items-center gap-1 shrink-0">
                  {hasPromo && (
                    <Badge className="bg-warning-soft text-warning border-warning/40 text-[10px] px-1.5 py-0.5">
                      <Star className="mr-1 h-3 w-3" />
                      Mais pedido
                    </Badge>
                  )}
                  {hasVariations && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                      {product.priceVariations.length} variações
                    </Badge>
                  )}
                </div>
              </div>

            </div>

            {/* Status + Ações */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Switch de status */}
              <div className="flex items-center gap-1.5">
                <Switch
                  checked={product.status === 'active'}
                  onCheckedChange={handleToggleStatus}
                  disabled={isToggling}
                  aria-label="Ativar/desativar produto"
                  className="h-6 w-11"
                />
                <span className={`
                  text-xs font-medium hidden sm:inline
                  ${product.status === 'active' 
                    ? 'text-success' 
                    : 'text-muted-foreground'
                  }
                `}>
                  {product.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {/* Menu de ações */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar produto
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicar produto
                  </DropdownMenuItem>
                  {onAddVariation && (
                    <DropdownMenuItem onClick={() => onAddVariation(product.id)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar variação
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={handleToggleStatus}
                    className="text-muted-foreground"
                  >
                    {product.status === 'active' ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Ativar
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir produto
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            )}

          {/* Preço e Variações */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              {oldPrice !== null && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(oldPrice)}
                </span>
              )}
              <span className="text-lg font-semibold text-success">
                {formatPrice(currentPrice)}
              </span>
              {oldPrice !== null && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(((oldPrice - currentPrice) / oldPrice) * 100)}% OFF
                </Badge>
              )}
            </div>

            {hasModifiers && (
              <button
                onClick={handleOpenModifiers}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <span>Gerenciar complementos</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            )}

            {hasVariations && (
              <div className="flex flex-wrap gap-1">
                {product.priceVariations.slice(0, 2).map((variation, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-[10px]"
                  >
                    {variation.name}: {formatPrice(variation.price)}
                  </Badge>
                ))}
                {product.priceVariations.length > 2 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{product.priceVariations.length - 2} mais
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
