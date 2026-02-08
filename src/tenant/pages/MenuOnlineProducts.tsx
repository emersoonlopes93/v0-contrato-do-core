'use client';

import { useState, useEffect } from 'react';
import { withModuleGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { BaseModal } from '@/components/modal/BaseModal';
import { ModalHeader } from '@/components/modal/ModalHeader';
import { ModalBody } from '@/components/modal/ModalBody';
import { ModalFooter } from '@/components/modal/ModalFooter';
import { GripVertical, Pencil, Trash2, Search, Plus, Filter, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useMenuUxMode } from '../hooks/useMenuUxMode';
import { MenuIfoodView } from '../components/menu/MenuIfoodView';
import { MenuUxFallback } from '../components/menu/MenuUxFallback';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  MenuOnlineCategoryDTO,
  MenuOnlineCreateCategoryRequest,
  MenuOnlineCreateProductRequest,
  MenuOnlineCreateModifierGroupRequest,
  MenuOnlineModifierGroupDTO,
  MenuOnlineProductDTO,
  MenuOnlineStatus,
  MenuOnlineUpdateCategoryRequest,
  MenuOnlineUpdateProductRequest,
} from '@/src/types/menu-online';

function formatCurrencyInput(value: string): string {
  // Remove tudo que não é dígito ou vírgula
  const cleanValue = value.replace(/[^\d,]/g, '');
  
  // Garante apenas uma vírgula decimal
  const parts = cleanValue.split(',');
  if (parts.length > 2) {
    parts[1] = parts[1].slice(0, 2);
  }
  
  return parts.join(',');
}

type DraftImage = { url: string; file?: File | null; progress?: number };
type DraftPriceVariation = {
  id: string;
  name: string;
  price: number;
  priceDelta?: number;
  isDefault: boolean;
  sortOrder: number;
  status: MenuOnlineStatus;
};

function MenuOnlineProductsPageContent() {
  const { accessToken } = useSession();
  const { isIfoodMode, setMode } = useMenuUxMode();
  const [categories, setCategories] = useState<MenuOnlineCategoryDTO[]>([]);
  const [modifierGroups, setModifierGroups] = useState<MenuOnlineModifierGroupDTO[]>([]);
  const [products, setProducts] = useState<MenuOnlineProductDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  const [categoryId, setCategoryId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('0');
  const [status, setStatus] = useState<MenuOnlineStatus>('active');
  const [basePrice, setBasePrice] = useState<string>('0');
  const [selectedModifierGroupIds, setSelectedModifierGroupIds] = useState<string[]>([]);
  const [images, setImages] = useState<DraftImage[]>([]);
  const [priceVariations, setPriceVariations] = useState<DraftPriceVariation[]>([]);
  const [isModifierGroupModalOpen, setIsModifierGroupModalOpen] = useState<boolean>(false);
  const [modifierGroupName, setModifierGroupName] = useState<string>('');
  const [modifierGroupDescription, setModifierGroupDescription] = useState<string>('');
  const [modifierGroupMinSelect, setModifierGroupMinSelect] = useState<string>('0');
  const [modifierGroupMaxSelect, setModifierGroupMaxSelect] = useState<string>('1');
  const [modifierGroupIsRequired, setModifierGroupIsRequired] = useState<boolean>(false);
  const [modifierGroupSortOrder, setModifierGroupSortOrder] = useState<string>('0');
  const [isSavingModifierGroup, setIsSavingModifierGroup] = useState<boolean>(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [isSavingCategory, setIsSavingCategory] = useState<boolean>(false);
  const [categoryEditingId, setCategoryEditingId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');
  const [categoryDescription, setCategoryDescription] = useState<string>('');
  const [categorySortOrder, setCategorySortOrder] = useState<string>('0');
  const [categoryStatus, setCategoryStatus] = useState<MenuOnlineStatus>('active');
  const [isReorderModalOpen, setIsReorderModalOpen] = useState<boolean>(false);
  const [isSavingCategoryOrder, setIsSavingCategoryOrder] = useState<boolean>(false);
  const [categoryOrder, setCategoryOrder] = useState<MenuOnlineCategoryDTO[]>([]);

  // Carregar dados
  const load = async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Carregar categorias
      const categoriesRes = await fetch('/api/v1/tenant/menu-online/categories', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const responseText = await categoriesRes.text();
      if (!categoriesRes.ok) {
        throw new Error(`Erro ${categoriesRes.status}: ${responseText.substring(0, 100)}`);
      }
      
      const categoriesData = JSON.parse(responseText) as ApiSuccessResponse<MenuOnlineCategoryDTO[]>;
      setCategories(categoriesData.data);

      // Carregar produtos
      const productsRes = await fetch('/api/v1/tenant/menu-online/products', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!productsRes.ok) {
        const errorData = (await productsRes.json()) as ApiErrorResponse;
        throw new Error(errorData.message || 'Erro ao carregar produtos');
      }

      const productsData = (await productsRes.json()) as ApiSuccessResponse<MenuOnlineProductDTO[]>;
      setProducts(productsData.data);

      // Carregar grupos de modificadores
      const modifiersRes = await fetch('/api/v1/tenant/menu-online/modifiers/groups', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!modifiersRes.ok) {
        const errorData = (await modifiersRes.json()) as ApiErrorResponse;
        throw new Error(errorData.message || 'Erro ao carregar complementos');
      }

      const modifiersData = (await modifiersRes.json()) as ApiSuccessResponse<MenuOnlineModifierGroupDTO[]>;
      setModifierGroups(modifiersData.data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [accessToken]);

  // Resetar formulário
  const resetForm = () => {
    setEditingId(null);
    setCategoryId('');
    setName('');
    setDescription('');
    setSortOrder('0');
    setStatus('active');
    setBasePrice('0');
    setSelectedModifierGroupIds([]);
    setImages([]);
    setPriceVariations([]);
    setError('');
    setSuccess('');
  };

  const resetCategoryForm = () => {
    setCategoryEditingId(null);
    setCategoryName('');
    setCategoryDescription('');
    setCategorySortOrder('0');
    setCategoryStatus('active');
  };

  const handleOpenCategoryReorder = () => {
    const ordered = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    setCategoryOrder(ordered);
    setIsReorderModalOpen(true);
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    setCategoryOrder((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) {
        return prev;
      }
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const handleSaveCategoryOrder = async () => {
    if (!accessToken) return;

    setIsSavingCategoryOrder(true);

    try {
      const updatedCategories: MenuOnlineCategoryDTO[] = [];

      for (let index = 0; index < categoryOrder.length; index += 1) {
        const category = categoryOrder[index];
        const payload: MenuOnlineUpdateCategoryRequest = {
          name: category.name,
          description: category.description ?? null,
          sortOrder: index,
          status: category.status,
        };

        const res = await fetch(`/api/v1/tenant/menu-online/categories/${category.id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorData = (await res.json()) as ApiErrorResponse;
          throw new Error(errorData.message || 'Erro ao salvar ordem das categorias');
        }

        const data = (await res.json()) as ApiSuccessResponse<MenuOnlineCategoryDTO>;
        updatedCategories.push(data.data);
      }

      setCategories(updatedCategories);
      setIsReorderModalOpen(false);
      toast({
        title: 'Categorias reordenadas',
        description: 'Ordem das categorias atualizada com sucesso.',
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao salvar ordem das categorias',
        variant: 'destructive',
      });
    } finally {
      setIsSavingCategoryOrder(false);
    }
  };

  // Editar produto
  const handleEditProduct = (product: MenuOnlineProductDTO) => {
    setEditingId(product.id);
    setCategoryId(product.categoryId);
    setName(product.name);
    setDescription(product.description || '');
    setSortOrder(product.sortOrder.toString());
    setStatus(product.status);
    setBasePrice(product.basePrice.toString());
    setSelectedModifierGroupIds(product.modifierGroupIds || []);
    setImages(
      (product.images || []).map(img => ({
        url: img.url,
        file: null,
        progress: undefined,
      }))
    );
    setPriceVariations(
      priceVariations.map(v => ({
        id: v.id || '',
        name: v.name,
        price: v.price,
        priceDelta: v.priceDelta,
        isDefault: v.isDefault,
        sortOrder: v.sortOrder,
        status: v.status,
      })) || []
    );
    setIsModalOpen(true);
  };

  // Editar categoria
  const handleEditCategory = (category: MenuOnlineCategoryDTO) => {
    setCategoryEditingId(category.id);
    setCategoryName(category.name);
    setCategoryDescription(category.description ?? '');
    setCategorySortOrder(category.sortOrder.toString());
    setCategoryStatus(category.status);
    setIsCategoryModalOpen(true);
  };

  // Criar novo produto
  const handleNewProduct = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Criar nova categoria
  const handleNewCategory = () => {
    resetCategoryForm();
    setIsCategoryModalOpen(true);
  };

  // Toggle status do produto
  const handleToggleStatus = async (product: MenuOnlineProductDTO) => {
    try {
      const newStatus = product.status === 'active' ? 'inactive' : 'active';
      
      const res = await fetch(`/api/v1/tenant/menu-online/products/${product.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!res.ok) {
        const errorData = (await res.json()) as ApiErrorResponse;
        throw new Error(errorData.message || 'Erro ao atualizar produto');
      }

      // Atualizar estado local
      setProducts(prev =>
        prev.map(p =>
          p.id === product.id ? { ...p, status: newStatus } : p
        )
      );

      toast({
        title: 'Produto atualizado',
        description: `Produto ${product.name} foi ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso.`,
      });

    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao atualizar produto',
        variant: 'destructive',
      });
    }
  };

  // Excluir produto
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const res = await fetch(`/api/v1/tenant/menu-online/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = (await res.json()) as ApiErrorResponse;
        throw new Error(errorData.message || 'Erro ao excluir produto');
      }

      // Atualizar estado local
      setProducts(prev => prev.filter(p => p.id !== productId));

      toast({
        title: 'Produto excluído',
        description: 'Produto foi excluído com sucesso.',
      });

    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao excluir produto',
        variant: 'destructive',
      });
    }
  };

  // Excluir categoria
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      const res = await fetch(`/api/v1/tenant/menu-online/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = (await res.json()) as ApiErrorResponse;
        throw new Error(errorData.message || 'Erro ao excluir categoria');
      }

      // Atualizar estado local
      setCategories(prev => prev.filter(c => c.id !== categoryId));

      toast({
        title: 'Categoria excluída',
        description: 'Categoria foi excluída com sucesso.',
      });

    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao excluir categoria',
        variant: 'destructive',
      });
    }
  };

  // Duplicar produto
  const handleDuplicateProduct = async (product: MenuOnlineProductDTO) => {
    try {
      const duplicateData: MenuOnlineCreateProductRequest = {
        categoryId: product.categoryId,
        name: `${product.name} (Cópia)`,
        description: product.description,
        basePrice: product.basePrice,
        status: 'inactive', // Começa inativo
        modifierGroupIds: product.modifierGroupIds,
        images: product.images,
        priceVariations: product.priceVariations || [],
      };

      const res = await fetch(`/api/v1/tenant/menu-online/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duplicateData),
      });

      if (!res.ok) {
        const errorData = (await res.json()) as ApiErrorResponse;
        throw new Error(errorData.message || 'Erro ao duplicar produto');
      }

      const newData = (await res.json()) as ApiSuccessResponse<MenuOnlineProductDTO>;
      
      // Atualizar estado local
      setProducts(prev => [...prev, newData.data]);

      toast({
        title: 'Produto duplicado',
        description: `Produto ${product.name} foi duplicado com sucesso.`,
      });

    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao duplicar produto',
        variant: 'destructive',
      });
    }
  };

  // Duplicar categoria
  const handleDuplicateCategory = async (category: MenuOnlineCategoryDTO) => {
    try {
      const duplicateData = {
        name: `${category.name} (Cópia)`,
        sortOrder: (parseInt(category.sortOrder.toString()) + 10).toString(),
        status: 'inactive', // Começa inativo
      };

      const res = await fetch(`/api/v1/tenant/menu-online/categories`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duplicateData),
      });

      if (!res.ok) {
        const errorData = (await res.json()) as ApiErrorResponse;
        throw new Error(errorData.message || 'Erro ao duplicar categoria');
      }

      const newData = (await res.json()) as ApiSuccessResponse<MenuOnlineCategoryDTO>;
      
      // Atualizar estado local
      setCategories(prev => [...prev, newData.data]);

      toast({
        title: 'Categoria duplicada',
        description: `Categoria ${category.name} foi duplicada com sucesso.`,
      });

    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao duplicar categoria',
        variant: 'destructive',
      });
    }
  };

  // Toggle todos os produtos de uma categoria
  const handleToggleAllProductsInCategory = async (categoryId: string, enabled: boolean) => {
    try {
      const categoryProducts = products.filter(p => p.categoryId === categoryId);
      
      // Atualizar cada produto
      await Promise.all(
        categoryProducts.map(async (product) => {
          const res = await fetch(`/api/v1/tenant/menu-online/products/${product.id}`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: enabled ? 'active' : 'inactive',
            }),
          });

          if (!res.ok) {
            throw new Error(`Erro ao atualizar produto ${product.name}`);
          }

          return { productId: product.id, success: true };
        })
      );

      // Atualizar estado local
      setProducts(prev =>
        prev.map(p =>
          p.categoryId === categoryId ? { ...p, status: enabled ? 'active' : 'inactive' } : p
        )
      );

      toast({
        title: enabled ? 'Produtos ativados' : 'Produtos desativados',
        description: `Todos os produtos da categoria foram ${enabled ? 'ativados' : 'desativados'}.`,
      });

    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Não foi possível alterar o status dos produtos.',
        variant: 'destructive',
      });
    }
  };

  // Salvar produto
  const handleSave = async () => {
    if (!categoryId.trim() || !name.trim()) {
      setError('Preencha os campos obrigatórios');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const productData: MenuOnlineCreateProductRequest | MenuOnlineUpdateProductRequest = {
        categoryId,
        name: name.trim(),
        description: description.trim() || undefined,
        basePrice: parseFloat(basePrice.replace(',', '.')) || 0,
        sortOrder: parseInt(sortOrder) || 0,
        status,
        modifierGroupIds: selectedModifierGroupIds,
        images: images.map(img => ({
          url: img.url,
          sortOrder: 0,
        })),
        priceVariations: priceVariations,
      };

      const isEditing = !!editingId;
      const url = isEditing
        ? `/api/v1/tenant/menu-online/products/${editingId}`
        : `/api/v1/tenant/menu-online/products`;

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!res.ok) {
        const errorData = (await res.json()) as ApiErrorResponse;
        throw new Error(errorData.message || 'Erro ao salvar produto');
      }

      const newData = (await res.json()) as ApiSuccessResponse<MenuOnlineProductDTO>;
      
      if (isEditing) {
        // Atualizar produto existente
        setProducts(prev =>
          prev.map(p => (p.id === editingId ? newData.data : p))
        );
        setSuccess('Produto atualizado com sucesso!');
      } else {
        // Adicionar novo produto
        setProducts(prev => [...prev, newData.data]);
        setSuccess('Produto criado com sucesso!');
      }

      resetForm();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar produto');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveModifierGroup = async () => {
    if (!modifierGroupName.trim()) {
      return;
    }

    setIsSavingModifierGroup(true);

    try {
      const payload: MenuOnlineCreateModifierGroupRequest = {
        name: modifierGroupName.trim(),
        description: modifierGroupDescription.trim() || undefined,
        minSelect: parseInt(modifierGroupMinSelect, 10) || 0,
        maxSelect: parseInt(modifierGroupMaxSelect, 10) || 1,
        isRequired: modifierGroupIsRequired,
        sortOrder: parseInt(modifierGroupSortOrder, 10) || 0,
        status: 'active',
      };

      const res = await fetch('/api/v1/tenant/menu-online/modifiers/groups', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = (await res.json()) as ApiErrorResponse;
        throw new Error(errorData.message || 'Erro ao criar grupo de complementos');
      }

      const data = (await res.json()) as ApiSuccessResponse<MenuOnlineModifierGroupDTO>;
      setModifierGroups((prev) => [...prev, data.data]);

      toast({
        title: 'Grupo criado',
        description: 'Grupo de complementos criado com sucesso.',
      });

      setIsModifierGroupModalOpen(false);
      setModifierGroupName('');
      setModifierGroupDescription('');
      setModifierGroupMinSelect('0');
      setModifierGroupMaxSelect('1');
      setModifierGroupIsRequired(false);
      setModifierGroupSortOrder('0');
    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao criar grupo de complementos',
        variant: 'destructive',
      });
    } finally {
      setIsSavingModifierGroup(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha o nome da categoria',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingCategory(true);

    try {
      const isEditingCategory = categoryEditingId !== null;

      const payload: MenuOnlineCreateCategoryRequest | MenuOnlineUpdateCategoryRequest = {
        name: categoryName.trim(),
        description: categoryDescription.trim() || null,
        sortOrder: parseInt(categorySortOrder, 10) || 0,
        status: categoryStatus,
      };

      const url = isEditingCategory
        ? `/api/v1/tenant/menu-online/categories/${categoryEditingId}`
        : '/api/v1/tenant/menu-online/categories';

      const method = isEditingCategory ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = (await res.json()) as ApiErrorResponse;
        throw new Error(errorData.message || 'Erro ao salvar categoria');
      }

      const data = (await res.json()) as ApiSuccessResponse<MenuOnlineCategoryDTO>;

      if (isEditingCategory) {
        setCategories((prev) => prev.map((category) => (category.id === data.data.id ? data.data : category)));
        toast({
          title: 'Categoria atualizada',
          description: 'Categoria atualizada com sucesso.',
        });
      } else {
        setCategories((prev) => [...prev, data.data]);
        toast({
          title: 'Categoria criada',
          description: 'Categoria criada com sucesso.',
        });
      }

      resetCategoryForm();
      setIsCategoryModalOpen(false);
    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao salvar categoria',
        variant: 'destructive',
      });
    } finally {
      setIsSavingCategory(false);
    }
  };

  if (!accessToken) return null;
  
  // Se estiver no modo iFood, renderizar a nova UX com fallback
  if (isIfoodMode) {
    return (
      <MenuUxFallback onRetry={() => window.location.reload()}>
        <>
          <MenuIfoodView
            categories={categories}
            products={products}
            modifierGroups={modifierGroups}
            isLoading={isLoading}
            onEditProduct={handleEditProduct}
            onEditCategory={handleEditCategory}
            onNewProduct={handleNewProduct}
            onNewCategory={handleNewCategory}
            onToggleProductStatus={handleToggleStatus}
            onToggleCategoryStatus={async (category) => {
              console.log('Toggle category:', category);
            }}
            onDeleteProduct={handleDeleteProduct}
            onDeleteCategory={handleDeleteCategory}
            onDuplicateProduct={handleDuplicateProduct}
            onDuplicateCategory={handleDuplicateCategory}
            onToggleAllProductsInCategory={handleToggleAllProductsInCategory}
            onNewModifierGroup={() => setIsModifierGroupModalOpen(true)}
            onReorderCategories={handleOpenCategoryReorder}
          />

          <BaseModal
            open={isModalOpen}
            onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open) resetForm();
            }}
            size="lg"
          >
            <ModalHeader title={editingId ? 'Editar Produto' : 'Novo Produto'} />
            <ModalBody>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSave();
                }}
                className="space-y-4"
                id="product-form"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Categoria</Label>
                    <select
                      id="categoryId"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {categories.length === 0 ? (
                        <option value="">Sem categorias</option>
                      ) : (
                        categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="h-11" />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">Preço base</Label>
                    <Input
                      id="basePrice"
                      value={basePrice}
                      onChange={(e) => setBasePrice(formatCurrencyInput(e.target.value))}
                      inputMode="decimal"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sortOrder">Ordem</Label>
                    <Input id="sortOrder" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} inputMode="numeric" className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value === 'inactive' ? 'inactive' : 'active')}
                      className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && !error && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
              </form>
            </ModalBody>
            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="product-form"
                variant="default"
                className="h-10"
                disabled={isSaving || name.trim() === '' || categoryId.trim() === ''}
              >
                {isSaving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}
              </Button>
            </ModalFooter>
          </BaseModal>

          <BaseModal
            open={isCategoryModalOpen}
            onOpenChange={(open) => {
              setIsCategoryModalOpen(open);
              if (!open) {
                resetCategoryForm();
              }
            }}
            size="md"
          >
            <ModalHeader title={categoryEditingId ? 'Editar Categoria' : 'Nova Categoria'} />
            <ModalBody>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSaveCategory();
                }}
                className="space-y-4"
                id="category-form"
              >
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Nome</Label>
                  <Input
                    id="categoryName"
                    value={categoryName}
                    onChange={(event) => setCategoryName(event.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryDescription">Descrição (opcional)</Label>
                  <Input
                    id="categoryDescription"
                    value={categoryDescription}
                    onChange={(event) => setCategoryDescription(event.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="categorySortOrder">Ordem</Label>
                    <Input
                      id="categorySortOrder"
                      value={categorySortOrder}
                      onChange={(event) => setCategorySortOrder(event.target.value)}
                      inputMode="numeric"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryStatus">Status</Label>
                    <select
                      id="categoryStatus"
                      value={categoryStatus}
                      onChange={(event) =>
                        setCategoryStatus(event.target.value === 'inactive' ? 'inactive' : 'active')
                      }
                      className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="active">Ativa</option>
                      <option value="inactive">Inativa</option>
                    </select>
                  </div>
                </div>
              </form>
            </ModalBody>
            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  resetCategoryForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="category-form"
                variant="default"
                className="h-10"
                disabled={isSavingCategory || categoryName.trim() === ''}
              >
                {isSavingCategory ? 'Salvando...' : categoryEditingId ? 'Salvar' : 'Criar'}
              </Button>
            </ModalFooter>
          </BaseModal>

          <BaseModal
            open={isModifierGroupModalOpen}
            onOpenChange={(open) => {
              setIsModifierGroupModalOpen(open);
              if (!open) {
                setModifierGroupName('');
                setModifierGroupDescription('');
                setModifierGroupMinSelect('0');
                setModifierGroupMaxSelect('1');
                setModifierGroupIsRequired(false);
                setModifierGroupSortOrder('0');
              }
            }}
            size="md"
          >
            <ModalHeader title="Novo grupo de complementos" />
            <ModalBody>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSaveModifierGroup();
                }}
                className="space-y-4"
                id="modifier-group-form"
              >
                <div className="space-y-2">
                  <Label htmlFor="modifierGroupName">Nome do grupo</Label>
                  <Input
                    id="modifierGroupName"
                    value={modifierGroupName}
                    onChange={(event) => setModifierGroupName(event.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modifierGroupDescription">Descrição (opcional)</Label>
                  <Input
                    id="modifierGroupDescription"
                    value={modifierGroupDescription}
                    onChange={(event) => setModifierGroupDescription(event.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="modifierGroupMinSelect">Mínimo de escolhas</Label>
                    <Input
                      id="modifierGroupMinSelect"
                      value={modifierGroupMinSelect}
                      onChange={(event) => setModifierGroupMinSelect(event.target.value)}
                      inputMode="numeric"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modifierGroupMaxSelect">Máximo de escolhas</Label>
                    <Input
                      id="modifierGroupMaxSelect"
                      value={modifierGroupMaxSelect}
                      onChange={(event) => setModifierGroupMaxSelect(event.target.value)}
                      inputMode="numeric"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modifierGroupSortOrder">Ordem</Label>
                    <Input
                      id="modifierGroupSortOrder"
                      value={modifierGroupSortOrder}
                      onChange={(event) => setModifierGroupSortOrder(event.target.value)}
                      inputMode="numeric"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="modifierGroupIsRequired"
                    checked={modifierGroupIsRequired}
                    onCheckedChange={setModifierGroupIsRequired}
                  />
                  <Label htmlFor="modifierGroupIsRequired" className="text-sm">
                    Obrigatório
                  </Label>
                </div>
              </form>
            </ModalBody>
            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={() => {
                  setIsModifierGroupModalOpen(false);
                  setModifierGroupName('');
                  setModifierGroupDescription('');
                  setModifierGroupMinSelect('0');
                  setModifierGroupMaxSelect('1');
                  setModifierGroupIsRequired(false);
                  setModifierGroupSortOrder('0');
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="modifier-group-form"
                variant="default"
                className="h-10"
                disabled={
                  isSavingModifierGroup || modifierGroupName.trim() === ''
                }
              >
                {isSavingModifierGroup ? 'Salvando...' : 'Criar grupo'}
              </Button>
            </ModalFooter>
          </BaseModal>
        </>
      </MenuUxFallback>
    );
  }

  // UX Classic (original)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Cardápio</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
            <EyeOff className="h-4 w-4 text-muted-foreground" />
            <Switch
              checked={isIfoodMode}
              onCheckedChange={(checked) => setMode(checked ? 'ifood' : 'classic')}
              aria-label="Modo UX iFood"
            />
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium">iFood</span>
          </div>
          <Button
            variant="default"
            className="h-9"
            onClick={handleNewProduct}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Barra de busca */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm" onClick={handleNewCategory}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </div>
      </div>

      {/* Lista de produtos */}
      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma categoria encontrada.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Crie categorias para organizar seus produtos.
            </p>
            <Button className="mt-4" onClick={handleNewCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Categoria
            </Button>
          </div>
        ) : (
          categories
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((category) => {
              const categoryProducts = products.filter(
                (product) => product.categoryId === category.id
              );
              console.log(`Produtos da categoria ${category.name}:`, categoryProducts);
              const activeCount = categoryProducts.filter(
                (product) => product.status === 'active'
              ).length;

              return (
                <Card key={category.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-4 border-b">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{category.name}</h3>
                        <Badge variant="secondary">
                          {categoryProducts.length} produtos
                        </Badge>
                        <Badge
                          variant={activeCount === categoryProducts.length ? 'default' : 'secondary'}
                        >
                          {activeCount} ativos
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="divide-y">
                      {categoryProducts.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-muted-foreground">
                            Nenhum produto nesta categoria.
                          </p>
                          <Button
                            className="mt-4"
                            size="sm"
                            onClick={handleNewProduct}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Produto
                          </Button>
                        </div>
                      ) : (
                        categoryProducts
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{product.name}</h4>
                                    <Badge
                                      variant={
                                        product.status === 'active' ? 'default' : 'secondary'
                                      }
                                    >
                                      {product.status === 'active' ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                  </div>
                                  {product.description && (
                                    <p className="text-sm text-muted-foreground">
                                      {product.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={product.status === 'active'}
                                  onCheckedChange={() => handleToggleStatus(product)}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditProduct(product)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteProduct(product.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>

      <BaseModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) resetForm();
        }}
        size="lg"
      >
        <ModalHeader title={editingId ? 'Editar Produto' : 'Novo Produto'} />
        <ModalBody>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
            className="space-y-4"
            id="product-form"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="categoryId">Categoria</Label>
                <select
                  id="categoryId"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {categories.length === 0 ? (
                    <option value="">Sem categorias</option>
                  ) : (
                    categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="h-11" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Preço base</Label>
                <Input
                  id="basePrice"
                  value={basePrice}
                  onChange={(e) => setBasePrice(formatCurrencyInput(e.target.value))}
                  inputMode="decimal"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Ordem</Label>
                <Input id="sortOrder" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} inputMode="numeric" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value === 'inactive' ? 'inactive' : 'active')}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && !error && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </form>
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={() => {
              setIsModalOpen(false);
              resetForm();
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="product-form"
            variant="default"
            className="h-10"
            disabled={isSaving || name.trim() === '' || categoryId.trim() === ''}
          >
            {isSaving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}
          </Button>
        </ModalFooter>
      </BaseModal>

      <BaseModal
        open={isCategoryModalOpen}
        onOpenChange={(open) => {
          setIsCategoryModalOpen(open);
          if (!open) {
            resetCategoryForm();
          }
        }}
        size="md"
      >
        <ModalHeader title={categoryEditingId ? 'Editar Categoria' : 'Nova Categoria'} />
        <ModalBody>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSaveCategory();
            }}
            className="space-y-4"
            id="category-form"
          >
            <div className="space-y-2">
              <Label htmlFor="categoryName">Nome</Label>
              <Input
                id="categoryName"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Descrição (opcional)</Label>
              <Input
                id="categoryDescription"
                value={categoryDescription}
                onChange={(event) => setCategoryDescription(event.target.value)}
                className="h-11"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="categorySortOrder">Ordem</Label>
                <Input
                  id="categorySortOrder"
                  value={categorySortOrder}
                  onChange={(event) => setCategorySortOrder(event.target.value)}
                  inputMode="numeric"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryStatus">Status</Label>
                <select
                  id="categoryStatus"
                  value={categoryStatus}
                  onChange={(event) =>
                    setCategoryStatus(event.target.value === 'inactive' ? 'inactive' : 'active')
                  }
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="active">Ativa</option>
                  <option value="inactive">Inativa</option>
                </select>
              </div>
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={() => {
              setIsCategoryModalOpen(false);
              resetCategoryForm();
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="category-form"
            variant="default"
            className="h-10"
            disabled={isSavingCategory || categoryName.trim() === ''}
          >
            {isSavingCategory ? 'Salvando...' : categoryEditingId ? 'Salvar' : 'Criar'}
          </Button>
        </ModalFooter>
      </BaseModal>

      <BaseModal
        open={isReorderModalOpen}
        onOpenChange={(open) => {
          setIsReorderModalOpen(open);
        }}
        size="sm"
      >
        <ModalHeader title="Reordenar categorias" />
        <ModalBody>
          <div className="space-y-2">
            {categoryOrder.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-6">
                Nenhuma categoria disponível.
              </div>
            ) : (
              categoryOrder.map((category, index) => (
                <div key={category.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <span className="text-sm font-medium">{category.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      disabled={index === 0}
                      onClick={() => moveCategory(index, 'up')}
                    >
                      Subir
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      disabled={index === categoryOrder.length - 1}
                      onClick={() => moveCategory(index, 'down')}
                    >
                      Descer
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={() => setIsReorderModalOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="default"
            className="h-10"
            onClick={() => void handleSaveCategoryOrder()}
            disabled={isSavingCategoryOrder || categoryOrder.length === 0}
          >
            {isSavingCategoryOrder ? 'Salvando...' : 'Salvar'}
          </Button>
        </ModalFooter>
      </BaseModal>
    </div>
  );
}

export const MenuOnlineProductsPage = withModuleGuard(MenuOnlineProductsPageContent, 'menu-online');
