'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Collapsible,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ChevronDown, 
  ChevronRight, 
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import type { MenuOnlineCategoryDTO } from '@/src/types/menu-online';

interface MenuCategoryHeaderProps {
  category: MenuOnlineCategoryDTO;
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onToggleAllProducts: (categoryId: string, enabled: boolean) => void;
  onEditCategory: (category: MenuOnlineCategoryDTO) => void;
  onDeleteCategory: (categoryId: string) => void;
  onDuplicateCategory: (category: MenuOnlineCategoryDTO) => void;
  productStats?: {
    total: number;
    active: number;
    inactive: number;
  };
}

export function MenuCategoryHeader({
  category,
  isExpanded,
  onExpandedChange,
  onToggleAllProducts,
  onEditCategory,
  onDeleteCategory,
  onDuplicateCategory,
  productStats = { total: 0, active: 0, inactive: 0 }
}: MenuCategoryHeaderProps) {
  const [masterSwitchState, setMasterSwitchState] = useState<'on' | 'off' | 'indeterminate'>('off');

  // Determinar estado do switch MASTER baseado nos produtos
  useEffect(() => {
    if (productStats.total === 0) {
      setMasterSwitchState('off');
    } else if (productStats.active === productStats.total) {
      setMasterSwitchState('on');
    } else if (productStats.active === 0) {
      setMasterSwitchState('off');
    } else {
      setMasterSwitchState('indeterminate');
    }
  }, [productStats]);

  const handleMasterSwitchChange = (checked: boolean) => {
    setMasterSwitchState(checked ? 'on' : 'off');
    onToggleAllProducts(category.id, checked);
  };

  const handleEdit = () => {
    onEditCategory(category);
  };

  const handleDelete = () => {
    onDeleteCategory(category.id);
  };

  const handleDuplicate = () => {
    onDuplicateCategory(category);
  };

  return (
    <div className="rounded-xl border bg-card">
      <Collapsible open={isExpanded} onOpenChange={onExpandedChange}>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-semibold">{category.name}</h3>

                <Badge 
                  variant={category.status === 'active' ? 'default' : 'secondary'}
                  className="shrink-0"
                >
                  {category.status === 'active' ? 'Ativa' : 'Inativa'}
                </Badge>

                <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{productStats.total} itens</span>
                  {productStats.active > 0 && (
                    <span className="text-success">• {productStats.active} ativos</span>
                  )}
                  {productStats.inactive > 0 && (
                    <span className="text-muted-foreground">• {productStats.inactive} inativos</span>
                  )}
                </div>
              </div>

              {category.description && (
                <p className="mt-1 text-sm text-muted-foreground truncate">
                  {category.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Todos
              </span>
              <Switch
                checked={masterSwitchState === 'on'}
                onCheckedChange={handleMasterSwitchChange}
                aria-label="Ativar/desativar todos os produtos"
                  className="shrink-0 border border-border data-[state=unchecked]:bg-muted"
                data-state={masterSwitchState}
              />
            </div>

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
                  <Edit className="mr-2 h-4 w-4" />
                  Editar categoria
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicar categoria
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onToggleAllProducts(category.id, category.status !== 'active')}
                  className="text-muted-foreground"
                >
                  {category.status === 'active' ? (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      Desativar todos
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Ativar todos
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir categoria
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Collapsible>
    </div>
  );
}
