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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const STORAGE_KEY_PREFIX = 'designer-menu:';

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Designer do Cardápio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personalize o visual do cardápio público sem alterar regras de negócio.
        </p>
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

      <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Header do Cardápio</CardTitle>
              <CardDescription>
                Controle visual da área superior e barra de busca.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Estilo do header</p>
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
                <p className="text-xs text-muted-foreground">
                  Usa apenas tokens de tema e CSS variables seguros.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Busca</p>
                <div className="flex gap-2">
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
                    Exibir barra de busca
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
                    Esconder busca
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Layout dos produtos</CardTitle>
              <CardDescription>
                Defina como os cards aparecem para o cliente final.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Modo de exibição</p>
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

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-add-button">Botão "Adicionar"</Label>
                  <p className="text-xs text-muted-foreground">
                    Exibir botão de adicionar em cada item
                  </p>
                </div>
                <Switch
                  id="show-add-button"
                  checked={config.showAddButton}
                  onCheckedChange={(checked) =>
                    setConfig((prev) => ({
                      ...prev,
                      showAddButton: checked,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Controle de Cores</CardTitle>
              <CardDescription>
                Personalize as cores do cardápio com paletas seguras.
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
                      {['gray', 'blue', 'green', 'red', 'yellow', 'purple', 'pink', 'orange'].map((color) => (
                        <SelectItem key={color} value={color}>
                          {color.charAt(0).toUpperCase() + color.slice(1)}
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
                      {['blue', 'green', 'red', 'yellow', 'purple', 'pink', 'orange', 'gray'].map((color) => (
                        <SelectItem key={color} value={color}>
                          {color.charAt(0).toUpperCase() + color.slice(1)}
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
                      {['gray', 'blue', 'green', 'red', 'yellow', 'purple', 'pink', 'orange'].map((color) => (
                        <SelectItem key={color} value={color}>
                          {color.charAt(0).toUpperCase() + color.slice(1)}
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
                      {['gray', 'blue', 'green', 'red', 'yellow', 'purple', 'pink', 'orange'].map((color) => (
                        <SelectItem key={color} value={color}>
                          {color.charAt(0).toUpperCase() + color.slice(1)}
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
                      {['blue', 'green', 'red', 'yellow', 'purple', 'pink', 'orange', 'gray'].map((color) => (
                        <SelectItem key={color} value={color}>
                          {color.charAt(0).toUpperCase() + color.slice(1)}
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
                      {['gray', 'blue', 'green', 'red', 'yellow', 'purple', 'pink', 'orange'].map((color) => (
                        <SelectItem key={color} value={color}>
                          {color.charAt(0).toUpperCase() + color.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Preview simplificado</CardTitle>
            <CardDescription>
              Representação visual de alto nível do layout selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'rounded-xl border bg-background p-4',
                config.headerVariant === 'solid-primary' && 'bg-primary/5',
              )}
            >
              {/* Header Preview */}
              <div
                className={cn(
                  'rounded-lg border px-4 py-3 mb-4',
                  config.headerVariant === 'solid-primary'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background',
                )}
                style={{
                  color: config.headerVariant === 'solid-primary' ? undefined : `var(--${config.headerTextColor})`,
                  backgroundColor: config.headerVariant === 'solid-primary' 
                    ? undefined 
                    : `var(--${config.logoBackgroundColor}-100)`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div 
                    className="h-8 w-28 rounded"
                    style={{
                      backgroundColor: config.headerVariant === 'solid-primary'
                        ? 'rgba(255, 255, 255, 0.2)'
                        : `var(--${config.logoBackgroundColor}-200)`,
                    }}
                  />
                  {config.showSearchBar && (
                    <div 
                      className="h-8 flex-1 rounded-full border"
                      style={{
                        backgroundColor: config.headerVariant === 'solid-primary'
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'var(--background)',
                        borderColor: config.headerVariant === 'solid-primary'
                          ? 'rgba(255, 255, 255, 0.3)'
                          : `var(--${config.headerButtonColor}-200)`,
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Welcome Message Preview */}
              <div
                className="rounded-lg p-3 mb-4"
                style={{
                  backgroundColor: `var(--${config.welcomeBackgroundColor}-100)`,
                  color: `var(--${config.welcomeTextColor}-800)`,
                }}
              >
                <div className="text-center text-sm">
                  Mensagem de boas-vindas
                </div>
              </div>

              {/* Group Title Preview */}
              <div
                className="rounded-t-lg p-3"
                style={{
                  backgroundColor: `var(--${config.groupTitleBackgroundColor}-100)`,
                  color: `var(--${config.groupTitleBackgroundColor}-800)`,
                }}
              >
                <div className="font-medium">Categoria do Produto</div>
              </div>

              <div className="mt-4">
                <div
                  className={cn(
                    'gap-3',
                    config.layoutMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2'
                      : 'space-y-2',
                  )}
                >
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'rounded-lg border bg-background p-3',
                        config.layoutMode === 'list' && 'flex items-center gap-3',
                      )}
                    >
                      <div 
                        className={cn(
                          'bg-muted',
                          config.imageStyle === 'square' && 'h-16 w-16 rounded-lg',
                          config.imageStyle === 'rectangle' && 'h-16 w-24 rounded',
                          config.imageStyle === 'rounded' && 'h-16 w-16 rounded-2xl',
                          config.imageStyle === 'full-bleed' && 'h-16 w-16 rounded-lg',
                        )}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 rounded bg-muted" />
                        <div className="h-3 w-1/2 rounded bg-muted" />
                        <div className="flex items-center justify-between">
                          <div className="h-4 w-1/3 rounded bg-muted" />
                          {config.showAddButton && (
                            <div 
                              className="h-6 w-6 rounded-full"
                              style={{
                                backgroundColor: `var(--${config.headerButtonColor}-500)`,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
