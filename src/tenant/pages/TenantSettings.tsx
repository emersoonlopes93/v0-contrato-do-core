'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { withModuleGuard } from '../components/ModuleGuard';
import { useSession } from '../context/SessionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormFooterSaveBar } from '@/components/form/FormFooterSaveBar';
import { toast } from '@/hooks/use-toast';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import type { TenantSettingsDTO, TenantSettingsUpdateRequest } from '@/src/types/tenant-settings';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

async function apiRequestJson<T>(url: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
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
  const { accessToken, tenantSettings, refreshSession } = useSession();
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

  const applyToForm = (dto: TenantSettingsDTO | null) => {
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
  };

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const dto = await apiRequestJson<TenantSettingsDTO | null>('/api/v1/tenant/settings', accessToken);
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
  }, [accessToken, initialFromSession.tradeName, initialFromSession.addressCity, initialFromSession.addressState, initialFromSession.timezone, initialFromSession.isOpen]);

  async function save(): Promise<void> {
    if (!accessToken) return;
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
        isOpen,
      };

      const dto = await apiRequestJson<TenantSettingsDTO>(
        '/api/v1/tenant/settings',
        accessToken,
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

  if (!accessToken) return null;

  const showIncompleteWarning =
    settings === null ||
    normalizeText(tradeName) === null ||
    normalizeText(addressCity) === null ||
    normalizeText(addressState) === null ||
    normalizeText(timezone) === null;

  const isDirty =
    (settings !== null &&
      (tradeName !== (settings.tradeName ?? '') ||
        addressCity !== (settings.addressCity ?? '' ) ||
        addressState !== (settings.addressState ?? '' ) ||
        timezone !== (settings.timezone ?? '' ) ||
        currency !== (settings.currency ?? '' ) ||
        isOpen !== settings.isOpen)) ||
    (settings === null &&
      (tradeName !== initialFromSession.tradeName ||
        addressCity !== initialFromSession.addressCity ||
        addressState !== initialFromSession.addressState ||
        timezone !== initialFromSession.timezone ||
        isOpen !== initialFromSession.isOpen ||
        currency !== ''));

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
                <Input value={document} onChange={(e) => setDocument(e.target.value)} />
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
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
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
              <CardDescription>Base para operação, entrega e consistência</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Rua</Label>
                <Input value={addressStreet} onChange={(e) => setAddressStreet(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input value={addressComplement} onChange={(e) => setAddressComplement(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input value={addressNeighborhood} onChange={(e) => setAddressNeighborhood(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={addressCity} onChange={(e) => setAddressCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input value={addressState} onChange={(e) => setAddressState(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input value={addressZip} onChange={(e) => setAddressZip(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} />
              </div>
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
                <input
                  type="checkbox"
                  checked={isOpen}
                  onChange={(e) => setIsOpen(e.target.checked)}
                />
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
