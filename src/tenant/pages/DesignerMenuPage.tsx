'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { withModuleGuard } from '@/src/tenant/components/ModuleGuard';
import { useTenant } from '@/src/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormFooterSaveBar } from '@/components/form/FormFooterSaveBar';
import type { 
  DesignerMenuConfigDTO, 
  DesignerMenuLayoutMode, 
  DesignerMenuImageStyle, 
  SafeColorPalette 
} from '@/src/types/designer-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/src/tenant/components/cards/ProductCard';

const STORAGE_KEY_PREFIX = 'designer-menu:';
const paletteOptions: SafeColorPalette[] = [
  'white',
  'black',
  'gray',
  'blue',
  'green',
  'red',
  'yellow',
  'purple',
  'pink',
  'orange',
];
const paletteLabels: Record<SafeColorPalette, string> = {
  white: 'Branco',
  black: 'Preto',
  gray: 'Cinza',
  blue: 'Azul',
  green: 'Verde',
  red: 'Vermelho',
  yellow: 'Amarelo',
  purple: 'Roxo',
  pink: 'Rosa',
  orange: 'Laranja',
};
type PaletteTone = 'base' | 'soft' | 'text' | 'foreground';

const getPaletteValue = (palette: SafeColorPalette, tone: PaletteTone): string => {
  const suffix = tone === 'base' ? '' : `-${tone}`;
  return `hsl(var(--palette-${palette}${suffix}))`;
};

const previewProducts = [
  {
    id: 'p1',
    name: 'Burger premium',
    description: 'Blend artesanal, queijo e molho especial',
    price: 34.9,
    promoPrice: 29.9,
  },
  {
    id: 'p2',
    name: 'Pizza marguerita',
    description: 'Mussarela, tomate e manjericão',
    price: 54.9,
    promoPrice: null,
  },
  {
    id: 'p3',
    name: 'Salada fresca',
    description: 'Mix de folhas, tomate e molho cítrico',
    price: 24.9,
    promoPrice: null,
  },
  {
    id: 'p4',
    name: 'Sobremesa da casa',
    description: 'Doce cremoso com frutas',
    price: 18.9,
    promoPrice: null,
  },
];

function loadConfig(tenantSlug: string): DesignerMenuConfigDTO {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${tenantSlug}`);
    if (!raw) {
      return getDefaultConfig();
    }
    const parsed = JSON.parse(raw) as { config?: DesignerMenuConfigDTO };
    if (!parsed || !parsed.config) {
      return getDefaultConfig();
    }
    
    // Merge com valores padrão para garantir que novas propriedades existam
    return {
      ...getDefaultConfig(),
      ...parsed.config,
      customIcons: parsed.config.customIcons || [],
    };
  } catch {
    return getDefaultConfig();
  }
}

function getDefaultConfig(): DesignerMenuConfigDTO {
  return {
    headerVariant: 'default',
    layoutMode: 'grid',
    showSearchBar: true,
    showAddButton: true,
    showWelcomeMessage: true,
    imageStyle: 'square',
    
    // Cores padrão
    headerTextColor: 'gray',
    headerButtonColor: 'blue',
    logoBackgroundColor: 'gray',
    groupTitleBackgroundColor: 'gray',
    welcomeBackgroundColor: 'blue',
    welcomeTextColor: 'gray',
    
    customIcons: [],
  };
}

function saveConfig(tenantSlug: string, config: DesignerMenuConfigDTO): void {
  try {
    const value = JSON.stringify({ tenantSlug, config });
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${tenantSlug}`, value);
    
    // Disparar evento para notificar outras abas/componentes
    window.dispatchEvent(new CustomEvent('designer-menu-updated', {
      detail: { tenantSlug, config }
    }));
  } catch (error) {
    console.error('Erro ao salvar configuração do designer de menu', error);
  }
}

function DesignerMenuPageContent() {
  const { tenantSlug } = useTenant();
  const [config, setConfig] = useState<DesignerMenuConfigDTO>(() =>
    loadConfig(tenantSlug),
  );
  const [initialConfig, setInitialConfig] = useState<DesignerMenuConfigDTO>(config);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    const loaded = loadConfig(tenantSlug);
    setConfig(loaded);
    setInitialConfig(loaded);
  }, [tenantSlug]);

  const hasChanges = useMemo(() => {
    return (
      config.headerVariant !== initialConfig.headerVariant ||
      config.layoutMode !== initialConfig.layoutMode ||
      config.showSearchBar !== initialConfig.showSearchBar ||
      config.showAddButton !== initialConfig.showAddButton ||
      config.showWelcomeMessage !== initialConfig.showWelcomeMessage ||
      config.imageStyle !== initialConfig.imageStyle ||
      config.headerTextColor !== initialConfig.headerTextColor ||
      config.headerButtonColor !== initialConfig.headerButtonColor ||
      config.logoBackgroundColor !== initialConfig.logoBackgroundColor ||
      config.groupTitleBackgroundColor !== initialConfig.groupTitleBackgroundColor ||
      config.welcomeBackgroundColor !== initialConfig.welcomeBackgroundColor ||
      config.welcomeTextColor !== initialConfig.welcomeTextColor ||
      JSON.stringify(config.customIcons) !== JSON.stringify(initialConfig.customIcons)
    );
  }, [config, initialConfig]);

  const resetToInitial = useCallback(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);
    try {
      saveConfig(tenantSlug, config);
      setInitialConfig(config);
      setSaveSuccess(true);
      // Mostrar feedback visual de sucesso
      setTimeout(() => {
        setIsSaving(false);
        setSaveSuccess(false);
      }, 2000);
    } catch {
      setError('Não foi possível salvar o layout. Tente novamente.');
      setIsSaving(false);
    }
  }, [tenantSlug, config]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  }, [handleSave]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Designer do Cardápio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personalize o visual do cardápio público sem alterar regras de negócio.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setConfig(getDefaultConfig())}
        >
          Restaurar padrão
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {saveSuccess && (
        <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
          <AlertDescription>Layout salvo com sucesso!</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estrutura do Cardápio</CardTitle>
              <CardDescription>
                Header, busca e mensagem de boas-vindas organizados para o cliente final.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Header do cardápio</p>
                <Tabs
                  value={config.headerVariant}
                  onValueChange={(value) =>
                    setConfig((prev) => ({
                      ...prev,
                      headerVariant: value === 'solid-primary' ? 'solid-primary' : 'default',
                    }))
                  }
                >
                  <TabsList>
                    <TabsTrigger value="default">Padrão</TabsTrigger>
                    <TabsTrigger value="solid-primary">Bloco em destaque</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Busca</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={config.showSearchBar ? 'default' : 'outline'}
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        showSearchBar: true,
                      }))
                    }
                  >
                    Exibir
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!config.showSearchBar ? 'default' : 'outline'}
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        showSearchBar: false,
                      }))
                    }
                  >
                    Ocultar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Mensagem de boas-vindas</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={config.showWelcomeMessage ? 'default' : 'outline'}
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        showWelcomeMessage: true,
                      }))
                    }
                  >
                    Exibir
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!config.showWelcomeMessage ? 'default' : 'outline'}
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        showWelcomeMessage: false,
                      }))
                    }
                  >
                    Ocultar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Layout dos Produtos</CardTitle>
              <CardDescription>
                Escolha o layout e o estilo visual dos cards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Layout dos cards</p>
                <Tabs
                  value={config.layoutMode}
                  onValueChange={(value) =>
                    setConfig((prev) => ({
                      ...prev,
                      layoutMode: value as DesignerMenuLayoutMode,
                    }))
                  }
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="grid">Grade padrão</TabsTrigger>
                    <TabsTrigger value="compact">Compacto</TabsTrigger>
                    <TabsTrigger value="list">Lista</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Estilo das imagens</p>
                <Select
                  value={config.imageStyle}
                  onValueChange={(value) =>
                    setConfig((prev) => ({
                      ...prev,
                      imageStyle: value as DesignerMenuImageStyle,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estilo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="square">Quadrado</SelectItem>
                    <SelectItem value="rectangle">Retangular</SelectItem>
                    <SelectItem value="rounded">Arredondado</SelectItem>
                    <SelectItem value="full-bleed">Full bleed (premium)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
              <CardDescription>
                Configure se o cliente vê o botão de adicionar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium text-foreground">Botão "Adicionar"</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={config.showAddButton ? 'default' : 'outline'}
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      showAddButton: true,
                    }))
                  }
                >
                  Exibir
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={!config.showAddButton ? 'default' : 'outline'}
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      showAddButton: false,
                    }))
                  }
                >
                  Não exibir
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cores & Estilo Visual</CardTitle>
              <CardDescription>
                Paletas seguras e consistentes para todo o cardápio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="header-text-color">Texto do cabeçalho</Label>
                  <Select
                    value={config.headerTextColor}
                    onValueChange={(value) =>
                      setConfig((prev) => ({
                        ...prev,
                        headerTextColor: value as SafeColorPalette,
                      }))
                    }
                  >
                    <SelectTrigger id="header-text-color">
                      <SelectValue placeholder="Cor do texto" />
                    </SelectTrigger>
                    <SelectContent>
                      {paletteOptions.map((color) => (
                        <SelectItem key={color} value={color}>
                          {paletteLabels[color]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="header-button-color">Botões do cabeçalho</Label>
                  <Select
                    value={config.headerButtonColor}
                    onValueChange={(value) =>
                      setConfig((prev) => ({
                        ...prev,
                        headerButtonColor: value as SafeColorPalette,
                      }))
                    }
                  >
                    <SelectTrigger id="header-button-color">
                      <SelectValue placeholder="Cor dos botões" />
                    </SelectTrigger>
                    <SelectContent>
                      {paletteOptions.map((color) => (
                        <SelectItem key={color} value={color}>
                          {paletteLabels[color]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo-bg-color">Fundo do logo</Label>
                  <Select
                    value={config.logoBackgroundColor}
                    onValueChange={(value) =>
                      setConfig((prev) => ({
                        ...prev,
                        logoBackgroundColor: value as SafeColorPalette,
                      }))
                    }
                  >
                    <SelectTrigger id="logo-bg-color">
                      <SelectValue placeholder="Fundo do logo" />
                    </SelectTrigger>
                    <SelectContent>
                      {paletteOptions.map((color) => (
                        <SelectItem key={color} value={color}>
                          {paletteLabels[color]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group-title-bg-color">Fundo dos títulos</Label>
                  <Select
                    value={config.groupTitleBackgroundColor}
                    onValueChange={(value) =>
                      setConfig((prev) => ({
                        ...prev,
                        groupTitleBackgroundColor: value as SafeColorPalette,
                      }))
                    }
                  >
                    <SelectTrigger id="group-title-bg-color">
                      <SelectValue placeholder="Fundo dos títulos" />
                    </SelectTrigger>
                    <SelectContent>
                      {paletteOptions.map((color) => (
                        <SelectItem key={color} value={color}>
                          {paletteLabels[color]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcome-bg-color">Fundo da mensagem</Label>
                  <Select
                    value={config.welcomeBackgroundColor}
                    onValueChange={(value) =>
                      setConfig((prev) => ({
                        ...prev,
                        welcomeBackgroundColor: value as SafeColorPalette,
                      }))
                    }
                  >
                    <SelectTrigger id="welcome-bg-color">
                      <SelectValue placeholder="Fundo da mensagem" />
                    </SelectTrigger>
                    <SelectContent>
                      {paletteOptions.map((color) => (
                        <SelectItem key={color} value={color}>
                          {paletteLabels[color]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcome-text-color">Texto da mensagem</Label>
                  <Select
                    value={config.welcomeTextColor}
                    onValueChange={(value) =>
                      setConfig((prev) => ({
                        ...prev,
                        welcomeTextColor: value as SafeColorPalette,
                      }))
                    }
                  >
                    <SelectTrigger id="welcome-text-color">
                      <SelectValue placeholder="Texto da mensagem" />
                    </SelectTrigger>
                    <SelectContent>
                      {paletteOptions.map((color) => (
                        <SelectItem key={color} value={color}>
                          {paletteLabels[color]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ícones Personalizados</CardTitle>
              <CardDescription>
                Adicione ícones SVG ou PNG para atalhos do cardápio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <svg
                      className="h-6 w-6 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upload de ícones em breve
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Suporte para SVG e PNG com normalização automática
                  </p>
                </div>
                
                {config.customIcons.length > 0 && (
                  <div className="space-y-2">
                    <Label>Ícones configurados</Label>
                    <div className="grid gap-2">
                      {config.customIcons.map((icon) => (
                        <div
                          key={icon.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={icon.url}
                              alt={icon.name}
                              className="h-8 w-8 object-contain"
                            />
                            <div>
                              <p className="text-sm font-medium">{icon.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {icon.fileType.toUpperCase()} • {icon.width}x{icon.height}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 md:sticky md:top-6 self-start">
          <Card>
            <CardHeader>
              <CardTitle>Preview em Tempo Real</CardTitle>
              <CardDescription>
                Visualização fiel do cardápio público conforme você ajusta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border bg-background">
                <div
                  className={cn(
                    'rounded-2xl border-b px-4 py-4',
                    config.headerVariant === 'solid-primary' && 'bg-primary',
                  )}
                  style={{
                    color: getPaletteValue(
                      config.headerTextColor,
                      config.headerVariant === 'solid-primary' ? 'foreground' : 'text',
                    ),
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: getPaletteValue(config.logoBackgroundColor, 'soft'),
                        color: getPaletteValue(config.logoBackgroundColor, 'text'),
                      }}
                    >
                      <span className="text-xs font-semibold">Logo</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-semibold leading-tight">Restaurante Exemplo</div>
                      <div className="text-xs">Centro · Cidade</div>
                    </div>
                  </div>

                  {config.showSearchBar && (
                    <div className="mt-3">
                      <div
                        className="h-10 w-full rounded-full border px-3 text-xs"
                        style={{
                          borderColor: getPaletteValue(config.headerButtonColor, 'base'),
                        }}
                      >
                        Buscar no cardápio
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex gap-2 overflow-hidden">
                    {['Combos', 'Bebidas', 'Sobremesas'].map((label, index) => (
                      <div
                        key={label}
                        className="rounded-full border px-3 py-1 text-[11px] font-semibold"
                        style={
                          index === 0
                            ? {
                                backgroundColor: getPaletteValue(config.headerButtonColor, 'base'),
                                color: getPaletteValue(config.headerButtonColor, 'foreground'),
                                borderColor: getPaletteValue(config.headerButtonColor, 'base'),
                              }
                            : {
                                backgroundColor: getPaletteValue(config.headerButtonColor, 'soft'),
                                color: getPaletteValue(config.headerButtonColor, 'text'),
                                borderColor: getPaletteValue(config.headerButtonColor, 'base'),
                              }
                        }
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                </div>

                {config.showWelcomeMessage && (
                  <div className="px-4 pt-4">
                    <div
                      className="rounded-xl px-4 py-3 text-center text-sm font-medium"
                      style={{
                        backgroundColor: getPaletteValue(config.welcomeBackgroundColor, 'soft'),
                        color: getPaletteValue(config.welcomeTextColor, 'text'),
                      }}
                    >
                      Bem-vindo ao nosso cardápio!
                    </div>
                  </div>
                )}

                <div className="px-4 py-4 space-y-4">
                  <div
                    className="flex items-center justify-between gap-2 rounded-xl px-3 py-2"
                    style={{
                      backgroundColor: getPaletteValue(config.groupTitleBackgroundColor, 'soft'),
                      color: getPaletteValue(config.groupTitleBackgroundColor, 'text'),
                    }}
                  >
                    <span className="text-sm font-semibold">Categoria em destaque</span>
                    <span className="text-xs">4 itens</span>
                  </div>

                  <div
                    className={
                      config.layoutMode === 'list'
                        ? 'space-y-3'
                        : config.layoutMode === 'compact'
                        ? 'grid grid-cols-2 gap-3'
                        : 'grid grid-cols-1 gap-3 md:grid-cols-2'
                    }
                  >
                    {previewProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        variant="public"
                        name={product.name}
                        description={product.description}
                        price={product.price}
                        promoPrice={product.promoPrice}
                        imageUrl={null}
                        currency="BRL"
                        showAddButton={config.showAddButton}
                        imageStyle={config.imageStyle}
                        compact={config.layoutMode === 'compact'}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {hasChanges && (
        <FormFooterSaveBar
          isLoading={isSaving}
          primaryLabel="Salvar layout"
          showCancel
          cancelLabel="Cancelar"
          onCancel={resetToInitial}
        />
      )}
    </form>
  );
}

export const DesignerMenuPage = withModuleGuard(DesignerMenuPageContent, 'designer-menu');
