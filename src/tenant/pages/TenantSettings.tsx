'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { withModuleGuard } from '../components/ModuleGuard';
import { useSession } from '../context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MaskedInput } from '@/src/shared/inputs/MaskedInput';
import { FormFooterSaveBar } from '@/components/form/FormFooterSaveBar';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import type { TenantSettingsDTO, TenantSettingsUpdateRequest } from '@/src/types/tenant-settings';
import { Button } from '@/components/ui/button';
import { registerSettingsSection } from '@/src/tenant/settings/settings-registry';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

async function apiRequestJson<T>(url: string, tenantSlug: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'X-Auth-Context': 'tenant_user',
      'X-Tenant-Slug': tenantSlug,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const raw: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (isApiErrorResponse(raw)) throw new Error(raw.message);
    throw new Error('Falha na requisição');
  }

  if (!isApiSuccessResponse<T>(raw)) throw new Error('Resposta inválida');
  return raw.data;
}

function normalizeText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function normalizeNumber(value: string): number | null | { error: string } {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const num = Number(trimmed);
  if (Number.isNaN(num)) return { error: 'Número inválido' };
  return num;
}

function TenantSettingsPageContent() {
  const { tenantSlug } = useTenant();
  const { tenantSettings, refreshSession } = useSession();
  const [settings, setSettings] = useState<TenantSettingsDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const initialFromSession = useMemo(() => {
    return {
      tradeName: tenantSettings?.tradeName ?? '',
      addressCity: tenantSettings?.city ?? '',
      addressState: tenantSettings?.state ?? '',
      timezone: tenantSettings?.timezone ?? '',
      isOpen: tenantSettings?.isOpen ?? false,
      kdsEnabled: tenantSettings?.kdsEnabled ?? true,
      pdvEnabled: tenantSettings?.pdvEnabled ?? true,
      realtimeEnabled: tenantSettings?.realtimeEnabled ?? true,
      printingEnabled: tenantSettings?.printingEnabled ?? false,
    };
  }, [tenantSettings]);

  const [tradeName, setTradeName] = useState<string>('');
  const [legalName, setLegalName] = useState<string>('');
  const [document, setDocument] = useState<string>('');

  const [phone, setPhone] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  const [addressStreet, setAddressStreet] = useState<string>('');
  const [addressNumber, setAddressNumber] = useState<string>('');
  const [addressComplement, setAddressComplement] = useState<string>('');
  const [addressNeighborhood, setAddressNeighborhood] = useState<string>('');
  const [addressCity, setAddressCity] = useState<string>('');
  const [addressState, setAddressState] = useState<string>('');
  const [addressZip, setAddressZip] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');

  const [timezone, setTimezone] = useState<string>('');
  const [currency, setCurrency] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [kdsEnabled, setKdsEnabled] = useState<boolean>(true);
  const [pdvEnabled, setPdvEnabled] = useState<boolean>(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState<boolean>(true);
  const [printingEnabled, setPrintingEnabled] = useState<boolean>(false);

  const applyToForm = useCallback((dto: TenantSettingsDTO | null) => {
    if (!dto) {
      setTradeName(initialFromSession.tradeName);
      setLegalName('');
      setDocument('');
      setPhone('');
      setWhatsapp('');
      setEmail('');
      setAddressStreet('');
      setAddressNumber('');
      setAddressComplement('');
      setAddressNeighborhood('');
      setAddressCity(initialFromSession.addressCity);
      setAddressState(initialFromSession.addressState);
      setAddressZip('');
      setLatitude('');
      setLongitude('');
      setTimezone(initialFromSession.timezone);
      setCurrency('');
      setIsOpen(initialFromSession.isOpen);
      setKdsEnabled(initialFromSession.kdsEnabled);
      setPdvEnabled(initialFromSession.pdvEnabled);
      setRealtimeEnabled(initialFromSession.realtimeEnabled);
      setPrintingEnabled(initialFromSession.printingEnabled);
      return;
    }

    setTradeName(dto.tradeName ?? '');
    setLegalName(dto.legalName ?? '');
    setDocument(dto.document ?? '');
    setPhone(dto.phone ?? '');
    setWhatsapp(dto.whatsapp ?? '');
    setEmail(dto.email ?? '');
    setAddressStreet(dto.addressStreet ?? '');
    setAddressNumber(dto.addressNumber ?? '');
    setAddressComplement(dto.addressComplement ?? '');
    setAddressNeighborhood(dto.addressNeighborhood ?? '');
    setAddressCity(dto.addressCity ?? '');
    setAddressState(dto.addressState ?? '');
    setAddressZip(dto.addressZip ?? '');
    setLatitude(dto.latitude === null ? '' : String(dto.latitude));
    setLongitude(dto.longitude === null ? '' : String(dto.longitude));
    setTimezone(dto.timezone ?? '');
    setCurrency(dto.currency ?? '');
    setIsOpen(dto.isOpen);
    setKdsEnabled(dto.kdsEnabled);
    setPdvEnabled(dto.pdvEnabled);
    setRealtimeEnabled(dto.realtimeEnabled);
    setPrintingEnabled(dto.printingEnabled);
  }, [initialFromSession]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const dto = await apiRequestJson<TenantSettingsDTO | null>('/api/v1/tenant/settings', tenantSlug);
        if (cancelled) return;
        setSettings(dto);
        applyToForm(dto);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erro ao carregar configurações');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyToForm, tenantSlug]);

  async function save(): Promise<void> {
    setIsSaving(true);
    setError('');
    setSuccess('');

    const parsedLatitude = normalizeNumber(latitude);
    if (typeof parsedLatitude === 'object' && parsedLatitude !== null && 'error' in parsedLatitude) {
      setIsSaving(false);
      setError(`Latitude: ${parsedLatitude.error}`);
      return;
    }

    const parsedLongitude = normalizeNumber(longitude);
    if (typeof parsedLongitude === 'object' && parsedLongitude !== null && 'error' in parsedLongitude) {
      setIsSaving(false);
      setError(`Longitude: ${parsedLongitude.error}`);
      return;
    }

    try {
      const payload: TenantSettingsUpdateRequest = {
        tradeName: normalizeText(tradeName),
        legalName: normalizeText(legalName),
        document: normalizeText(document),
        phone: normalizeText(phone),
        whatsapp: normalizeText(whatsapp),
        email: normalizeText(email),
        addressStreet: normalizeText(addressStreet),
        addressNumber: normalizeText(addressNumber),
        addressComplement: normalizeText(addressComplement),
        addressNeighborhood: normalizeText(addressNeighborhood),
        addressCity: normalizeText(addressCity),
        addressState: normalizeText(addressState),
        addressZip: normalizeText(addressZip),
        latitude: parsedLatitude as number | null,
        longitude: parsedLongitude as number | null,
        timezone: normalizeText(timezone),
        currency: normalizeText(currency),
        kdsEnabled,
        pdvEnabled,
        realtimeEnabled,
        printingEnabled,
        isOpen,
      };

      const dto = await apiRequestJson<TenantSettingsDTO>(
        '/api/v1/tenant/settings',
        tenantSlug,
        { method: 'PUT', body: JSON.stringify(payload) },
      );
      setSettings(dto);
      applyToForm(dto);
      await refreshSession();
      setSuccess('Configurações salvas com sucesso');
      toast({
        title: 'Salvo com sucesso',
        description: 'Configurações salvas com sucesso',
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao salvar configurações';
      setError(message);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  }

  const showIncompleteWarning =
    settings === null ||
    normalizeText(tradeName) === null ||
    normalizeText(timezone) === null;

  const isDirty =
    (settings !== null &&
      (tradeName !== (settings.tradeName ?? '') ||
        timezone !== (settings.timezone ?? '' ) ||
        currency !== (settings.currency ?? '' ) ||
        isOpen !== settings.isOpen ||
        kdsEnabled !== settings.kdsEnabled ||
        pdvEnabled !== settings.pdvEnabled ||
        realtimeEnabled !== settings.realtimeEnabled ||
        printingEnabled !== settings.printingEnabled)) ||
    (settings === null &&
      (tradeName !== initialFromSession.tradeName ||
        timezone !== initialFromSession.timezone ||
        isOpen !== initialFromSession.isOpen ||
        currency !== '' ||
        kdsEnabled !== initialFromSession.kdsEnabled ||
        pdvEnabled !== initialFromSession.pdvEnabled ||
        realtimeEnabled !== initialFromSession.realtimeEnabled ||
        printingEnabled !== initialFromSession.printingEnabled));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      id="tenant-settings-form"
      className="space-y-6 pb-4"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Configurações da Loja</h1>
        <p className="text-muted-foreground">Dados operacionais do tenant</p>
      </div>

      {showIncompleteWarning && (
        <Alert>
          <AlertDescription>
            Configurações incompletas. O sistema funciona, mas alguns módulos podem exibir avisos.
          </AlertDescription>
        </Alert>
      )}

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

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Identidade da Loja</CardTitle>
              <CardDescription>Como a loja aparece para clientes e internamente</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome Fantasia</Label>
                <Input value={tradeName} onChange={(e) => setTradeName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Razão Social</Label>
                <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Documento (CPF/CNPJ)</Label>
                <MaskedInput
                  type="document"
                  value={document}
                  onChange={(raw) => setDocument(typeof raw === 'string' ? raw : String(raw))}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
              <CardDescription>Informações para suporte e comunicação</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <MaskedInput
                  type="phone"
                  value={phone}
                  onChange={(raw) => setPhone(typeof raw === 'string' ? raw : String(raw))}
                  placeholder="(11) 98765-4321"
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <MaskedInput
                  type="phone"
                  value={whatsapp}
                  onChange={(raw) => setWhatsapp(typeof raw === 'string' ? raw : String(raw))}
                  placeholder="(11) 98765-4321"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>
                Configuração de endereço foi movida para Store Settings para evitar duplicação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                onClick={() => (window.location.href = `/tenant/${tenantSlug}/store-settings`)}
              >
                Abrir Store Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status de Operação</CardTitle>
              <CardDescription>Dados usados por módulos operacionais</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Ex.: America/Sao_Paulo"
                />
              </div>
              <div className="space-y-2">
                <Label>Moeda</Label>
                <Input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="Ex.: BRL"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2">
                <div>
                  <div className="font-medium">Loja aberta</div>
                  <div className="text-sm text-muted-foreground">Usado para exibir aberto/fechado</div>
                </div>
                <Switch checked={isOpen} onCheckedChange={setIsOpen} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operação ao Vivo</CardTitle>
              <CardDescription>Ativações por tenant que afetam fluxo em tempo real</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">Tempo real</div>
                  <div className="text-sm text-muted-foreground">Atualizações automáticas entre módulos</div>
                </div>
                <Switch checked={realtimeEnabled} onCheckedChange={setRealtimeEnabled} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">KDS ativo</div>
                  <div className="text-sm text-muted-foreground">Exibição contínua para cozinha</div>
                </div>
                <Switch checked={kdsEnabled} onCheckedChange={setKdsEnabled} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">PDV ativo</div>
                  <div className="text-sm text-muted-foreground">Ponto de venda disponível</div>
                </div>
                <Switch checked={pdvEnabled} onCheckedChange={setPdvEnabled} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">Impressão automática</div>
                  <div className="text-sm text-muted-foreground">Pedidos e comprovantes</div>
                </div>
                <Switch checked={printingEnabled} onCheckedChange={setPrintingEnabled} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isDirty && (
        <FormFooterSaveBar
          isLoading={isSaving}
          primaryLabel="Salvar"
          showCancel
          cancelLabel="Cancelar"
          onCancel={() => applyToForm(settings)}
        />
      )}
    </form>
  );
}

export const TenantSettingsPage = withModuleGuard(TenantSettingsPageContent, 'settings');

registerSettingsSection({
  id: 'tenant-settings',
  title: 'Configurações Gerais',
  description: 'Dados operacionais e status da loja',
  icon: 'settings',
  category: 'system',
  order: 1,
  component: TenantSettingsPage,
});
