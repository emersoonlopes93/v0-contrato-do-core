'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, Filter, ArrowUpDown } from 'lucide-react';
import { MenuIfoodHeader } from './MenuIfoodHeader';
import { MenuCategoryHeader } from './MenuCategoryHeader';
import { MenuProductCard } from './MenuProductCard';
import { MenuFloatingActions } from './MenuFloatingActions';
import { BaseModal } from '@/components/modal/BaseModal';
import { ModalHeader } from '@/components/modal/ModalHeader';
import { ModalBody } from '@/components/modal/ModalBody';
import { ModalFooter } from '@/components/modal/ModalFooter';
import { toast } from '@/hooks/use-toast';
import type { 
  MenuOnlineCategoryDTO, 
  MenuOnlineProductDTO, 
  MenuOnlineModifierGroupDTO, 
} from '@/src/types/menu-online';

interface MenuIfoodViewProps {
  categories: MenuOnlineCategoryDTO[];
  products: MenuOnlineProductDTO[];
  modifierGroups: MenuOnlineModifierGroupDTO[];
  isLoading?: boolean;
  onEditProduct: (product: MenuOnlineProductDTO) => void;
  onEditCategory: (category: MenuOnlineCategoryDTO) => void;
  onNewProduct: () => void;
  onNewCategory: () => void;
  onToggleProductStatus: (product: MenuOnlineProductDTO) => Promise<void>;
  onToggleCategoryStatus: (category: MenuOnlineCategoryDTO) => Promise<void>;
  onDeleteProduct: (productId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onDuplicateProduct: (product: MenuOnlineProductDTO) => void;
  onDuplicateCategory: (category: MenuOnlineCategoryDTO) => void;
  onToggleAllProductsInCategory: (categoryId: string, enabled: boolean) => Promise<void>;
  onNewModifierGroup: () => void;
  onReorderCategories: () => void;
  onNewProductInCategory?: (categoryId: string) => void;
}

export function MenuIfoodView({
  categories,
  products,
  modifierGroups,
  isLoading = false,
  onEditProduct,
  onEditCategory,
  onNewProduct,
  onNewCategory,
  onToggleProductStatus,
  onDeleteProduct,
  onDeleteCategory,
  onDuplicateProduct,
  onDuplicateCategory,
  onToggleAllProductsInCategory,
  onNewModifierGroup,
  onReorderCategories,
  onNewProductInCategory,
}: MenuIfoodViewProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'complements'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');

  const stats = {
    categories: categories.length,
    products: products.length,
    complements: modifierGroups.length,
  };

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat) => map.set(cat.id, cat.name));
    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((product) => 
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        categoryNameById.get(product.categoryId)?.toLowerCase().includes(query),
      );
    }

    if (activeCategoryId !== 'all') {
      filtered = filtered.filter((product) => product.categoryId === activeCategoryId);
    }

    return filtered;
  }, [products, searchQuery, categoryNameById, activeCategoryId]);

  // listado por categoria renderiza diretamente via categories

  const categoryStats = useMemo(() => {
    const statsByCategory = new Map<string, { total: number; active: number; inactive: number }>();
    
    categories.forEach((category) => {
      const categoryProducts = products.filter((product) => product.categoryId === category.id);
      const active = categoryProducts.filter((product) => product.status === 'active').length;
      const inactive = categoryProducts.filter((product) => product.status === 'inactive').length;
      
      statsByCategory.set(category.id, {
        total: categoryProducts.length,
        active,
        inactive,
      });
    });

    return statsByCategory;
  }, [categories, products]);

  useEffect(() => {
    // Collapse by default for lazy render
    setExpandedCategories(new Set());
  }, [categories.length]);

  const handleToggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleToggleAllProducts = async (categoryId: string, enabled: boolean) => {
    try {
      await onToggleAllProductsInCategory(categoryId, enabled);
      toast({
        title: 'Produtos atualizados',
        description: `Todos os produtos da categoria foram ${enabled ? 'ativados' : 'desativados'}`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar produtos',
        description: error instanceof Error ? error.message : 'Falha ao atualizar produtos',
      });
    }
  };

  const handleOpenModifiers = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (product) {
      onEditProduct(product);
    }
  };

  const renderTabContent = (): React.ReactElement | null => {
    if (activeTab === 'overview') {
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Categorias</p>
                      <p className="text-2xl font-bold">{stats.categories}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={onNewCategory}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
    if (activeTab === 'products') {
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar item..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-10 pl-10 text-sm"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => {
                    setFilterCategoryId(activeCategoryId);
                    setIsFilterModalOpen(true);
                  }}
                >
                  <Filter className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="shrink-0"
                  onClick={onNewProduct}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={onReorderCategories}
              >
                <ArrowUpDown className="h-4 w-4" />
                <span>Reordenar categorias</span>
              </Button>
            </div>

          <div className="space-y-6">
            {categories
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((category) => {
                const categoryProducts = filteredProducts.filter((p) => p.categoryId === category.id);
                const categoryStatsEntry = categoryStats.get(category.id) || { total: 0, active: 0, inactive: 0 };
                const isExpanded = expandedCategories.has(category.id);
                const isCategoryInactive = category.status !== 'active';

                return (
                  <div key={category.id} className={`space-y-4 ${isCategoryInactive ? 'opacity-50' : ''}`}>
                    <MenuCategoryHeader
                      category={category}
                      isExpanded={isExpanded}
                      onExpandedChange={() => handleToggleCategoryExpanded(category.id)}
                      onToggleAllProducts={handleToggleAllProducts}
                      onEditCategory={onEditCategory}
                      onDeleteCategory={onDeleteCategory}
                      onDuplicateCategory={onDuplicateCategory}
                      productStats={categoryStatsEntry}
                    />

                    {isExpanded && (
                      <div className="space-y-3">
                        {categoryProducts.length === 0 ? (
                          <div className="text-center py-6">
                            <p className="text-muted-foreground text-sm">Categoria vazia</p>
                          </div>
                        ) : (
                          categoryProducts
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((product) => (
                              <MenuProductCard
                                key={product.id}
                                product={product}
                                onToggleStatus={onToggleProductStatus}
                                onEditProduct={onEditProduct}
                                onDeleteProduct={onDeleteProduct}
                                onDuplicateProduct={onDuplicateProduct}
                                onOpenModifiers={handleOpenModifiers}
                              />
                            ))
                        )}
                        <div className="pt-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              onNewProductInCategory
                                ? onNewProductInCategory(category.id)
                                : onNewProduct()
                            }
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Produto
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredProducts.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? 'Nenhum produto encontrado para esta busca'
                      : categories.length === 0
                      ? 'Nenhuma categoria cadastrada'
                      : 'Nenhum produto cadastrado'}
                  </p>
                  {categories.length === 0 ? (
                    <Button size="sm" className="mt-4" onClick={onNewCategory}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Categorias
                    </Button>
                  ) : (
                    <Button size="sm" className="mt-4" onClick={onNewProduct}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar primeiro produto
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
    }
    if (activeTab === 'complements') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-foreground">Complementos</h2>
              <p className="text-xs text-muted-foreground">Gestão de grupos de modificadores do cardápio.</p>
            </div>
            <Button size="sm" onClick={onNewModifierGroup}>
              <Plus className="h-4 w-4 mr-2" />
              Novo grupo
            </Button>
          </div>

          <div className="space-y-3">
            {modifierGroups.map((group) => (
              <Card key={group.id}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{group.name}</p>
                    {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
                    <p className="text-[11px] text-muted-foreground">
                      Mínimo {group.minSelect} · Máximo {group.maxSelect} · {group.isRequired ? 'Obrigatório' : 'Opcional'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {group.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {modifierGroups.length === 0 && (
              <div className="text-center py-12 text-sm text-muted-foreground">Nenhum grupo de complementos cadastrado.</div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <MenuIfoodHeader
        stats={stats}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <div className="flex-1">
        <div className="py-4 md:py-6">
          {renderTabContent()}
        </div>
      </div>

      <MenuFloatingActions />

      <BaseModal open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen} size="sm">
        <ModalHeader title="Filtros" />
        <ModalBody>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Filtrar por categoria</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFilterCategoryId('all')}
                className="px-3 py-1"
              >
                Todos
              </Button>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            className="h-9"
            onClick={() => {
              setFilterCategoryId('all');
              setActiveCategoryId('all');
              setIsFilterModalOpen(false);
            }}
          >
            Limpar
          </Button>
          <Button
            type="button"
            className="h-9"
            onClick={() => {
              setActiveCategoryId(filterCategoryId);
              setIsFilterModalOpen(false);
            }}
          >
            Aplicar filtros
          </Button>
        </ModalFooter>
      </BaseModal>
    </div>
  );
}
