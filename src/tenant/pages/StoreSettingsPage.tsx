'use client';

import React, { useEffect, useState } from 'react';
import { withModuleGuard } from '../components/ModuleGuard';
import { useSession } from '../context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MaskedInput } from '@/src/shared/inputs/MaskedInput';
import { FormFooterSaveBar } from '@/components/form/FormFooterSaveBar';
import { toast } from '@/hooks/use-toast';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import type {
  StoreSettingsDTO,
  StoreSettingsCreateRequest,
  StoreSettingsUpdateRequest,
  StoreSettingsAddress,
  StoreSettingsPaymentMethods,
} from '@/src/types/store-settings';
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

function parseNumber(value: string): number | { error: string } {
  const trimmed = value.trim();
  if (trimmed === '') return 0;
  const num = Number(trimmed);
  if (Number.isNaN(num)) return { error: 'Número inválido' };
  return num;
}

function buildAddress(
  street: string,
  number: string,
  neighborhood: string,
  city: string,
  state: string,
  zip: string,
): StoreSettingsAddress {
  return {
    street,
    number,
    neighborhood,
    city,
    state,
    zip,
  };
}

function buildPaymentMethods(
  cash: boolean,
  pix: boolean,
  cardEnabled: boolean,
  cardFlagsInput: string,
): StoreSettingsPaymentMethods {
  const flags = cardFlagsInput
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);

  return {
    cash,
    pix,
    card: {
      enabled: cardEnabled,
      flags,
    },
  };
}

function StoreSettingsPageContent() {
  const { tenantSlug } = useTenant();
  useSession();
  const [settings, setSettings] = useState<StoreSettingsDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [primaryColor, setPrimaryColor] = useState<string>('');

  const [addressStreet, setAddressStreet] = useState<string>('');
  const [addressNumber, setAddressNumber] = useState<string>('');
  const [addressNeighborhood, setAddressNeighborhood] = useState<string>('');
  const [addressCity, setAddressCity] = useState<string>('');
  const [addressState, setAddressState] = useState<string>('');
  const [addressZip, setAddressZip] = useState<string>('');

  const [deliveryEnabled, setDeliveryEnabled] = useState<boolean>(false);
  const [pickupEnabled, setPickupEnabled] = useState<boolean>(false);
  const [dineInEnabled, setDineInEnabled] = useState<boolean>(false);

  const [minimumOrder, setMinimumOrder] = useState<string>('0');
  const [deliveryFee, setDeliveryFee] = useState<string>('0');
  const [averagePrepTimeMinutes, setAveragePrepTimeMinutes] = useState<string>('15');

  const [paymentCash, setPaymentCash] = useState<boolean>(false);
  const [paymentPix, setPaymentPix] = useState<boolean>(false);
  const [paymentCardEnabled, setPaymentCardEnabled] = useState<boolean>(false);
  const [paymentCardFlags, setPaymentCardFlags] = useState<string>('');

  const applyToForm = (dto: StoreSettingsDTO | null) => {
    if (!dto) {
      setName('');
      setSlug('');
      setLogoUrl('');
      setPrimaryColor('');
      setAddressStreet('');
      setAddressNumber('');
      setAddressNeighborhood('');
      setAddressCity('');
      setAddressState('');
      setAddressZip('');
      setDeliveryEnabled(false);
      setPickupEnabled(false);
      setDineInEnabled(false);
      setMinimumOrder('0');
      setDeliveryFee('0');
      setAveragePrepTimeMinutes('15');
      setPaymentCash(false);
      setPaymentPix(false);
      setPaymentCardEnabled(false);
      setPaymentCardFlags('');
      return;
    }

    setName(dto.name);
    setSlug(dto.slug);
    setLogoUrl(dto.logoUrl ?? '');
    setPrimaryColor(dto.primaryColor ?? '');
    setAddressStreet(dto.address.street);
    setAddressNumber(dto.address.number);
    setAddressNeighborhood(dto.address.neighborhood);
    setAddressCity(dto.address.city);
    setAddressState(dto.address.state);
    setAddressZip(dto.address.zip);
    setDeliveryEnabled(dto.deliveryEnabled);
    setPickupEnabled(dto.pickupEnabled);
    setDineInEnabled(dto.dineInEnabled);
    setMinimumOrder(String(dto.minimumOrder));
    setDeliveryFee(String(dto.deliveryFee));
    setAveragePrepTimeMinutes(String(dto.averagePrepTimeMinutes));
    setPaymentCash(dto.paymentMethods.cash);
    setPaymentPix(dto.paymentMethods.pix);
    setPaymentCardEnabled(dto.paymentMethods.card.enabled);
    setPaymentCardFlags(dto.paymentMethods.card.flags.join(', '));
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const dto = await apiRequestJson<StoreSettingsDTO | null>('/api/v1/store-settings', tenantSlug);
        if (cancelled) return;
        setSettings(dto);
        applyToForm(dto);
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : 'Erro ao carregar configurações da loja';
        setError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  async function save(): Promise<void> {
    setIsSaving(true);
    setError('');
    setSuccess('');

    const parsedMinimumOrder = parseNumber(minimumOrder);
    if (typeof parsedMinimumOrder === 'object' && 'error' in parsedMinimumOrder) {
      setIsSaving(false);
      setError(`Valor mínimo do pedido: ${parsedMinimumOrder.error}`);
      return;
    }

    const parsedDeliveryFee = parseNumber(deliveryFee);
    if (typeof parsedDeliveryFee === 'object' && 'error' in parsedDeliveryFee) {
      setIsSaving(false);
      setError(`Taxa de entrega: ${parsedDeliveryFee.error}`);
      return;
    }

    const parsedAveragePrepTime = parseNumber(averagePrepTimeMinutes);
    if (typeof parsedAveragePrepTime === 'object' && 'error' in parsedAveragePrepTime) {
      setIsSaving(false);
      setError(`Tempo médio de preparo: ${parsedAveragePrepTime.error}`);
      return;
    }

    try {
      const address = buildAddress(
        addressStreet,
        addressNumber,
        addressNeighborhood,
        addressCity,
        addressState,
        addressZip,
      );

      const paymentMethods = buildPaymentMethods(
        paymentCash,
        paymentPix,
        paymentCardEnabled,
        paymentCardFlags,
      );

      if (settings === null) {
        const payloadCreate: StoreSettingsCreateRequest = {
          name,
          slug,
          logoUrl: logoUrl === '' ? undefined : logoUrl,
          primaryColor: primaryColor === '' ? undefined : primaryColor,
          address,
          openingHours: {
            mon: { isOpen: true, opensAt: '09:00', closesAt: '18:00' },
            tue: { isOpen: true, opensAt: '09:00', closesAt: '18:00' },
            wed: { isOpen: true, opensAt: '09:00', closesAt: '18:00' },
            thu: { isOpen: true, opensAt: '09:00', closesAt: '18:00' },
            fri: { isOpen: true, opensAt: '09:00', closesAt: '18:00' },
            sat: { isOpen: true, opensAt: '09:00', closesAt: '18:00' },
            sun: { isOpen: true, opensAt: '09:00', closesAt: '18:00' },
          },
          deliveryEnabled,
          pickupEnabled,
          dineInEnabled,
          minimumOrder: parsedMinimumOrder,
          deliveryFee: parsedDeliveryFee,
          averagePrepTimeMinutes: parsedAveragePrepTime,
          paymentMethods,
        };

        const created = await apiRequestJson<StoreSettingsDTO>('/api/v1/store-settings', tenantSlug, {
          method: 'POST',
          body: JSON.stringify(payloadCreate),
        });

        setSettings(created);
        applyToForm(created);
        setSuccess('Configurações criadas com sucesso');
        toast({
          title: 'Salvo com sucesso',
          description: 'Configurações da loja criadas com sucesso',
        });
        return;
      }

      const payloadUpdate: StoreSettingsUpdateRequest = {
        name,
        slug,
        logoUrl: logoUrl === '' ? null : logoUrl,
        primaryColor: primaryColor === '' ? null : primaryColor,
        address,
        deliveryEnabled,
        pickupEnabled,
        dineInEnabled,
        minimumOrder: parsedMinimumOrder,
        deliveryFee: parsedDeliveryFee,
        averagePrepTimeMinutes: parsedAveragePrepTime,
        paymentMethods,
      };

      const updated = await apiRequestJson<StoreSettingsDTO>('/api/v1/store-settings', tenantSlug, {
        method: 'PATCH',
        body: JSON.stringify(payloadUpdate),
      });

      if (updated) {
        setSettings(updated);
        applyToForm(updated);
      }

      setSuccess('Configurações salvas com sucesso');
      toast({
        title: 'Salvo com sucesso',
        description: 'Configurações da loja salvas com sucesso',
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao salvar configurações da loja';
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

  const hasAnyOperation = deliveryEnabled || pickupEnabled || dineInEnabled;
  const hasAnyPayment = paymentCash || paymentPix || paymentCardEnabled;

  const isDirty = settings === null
    ? name !== '' ||
      slug !== '' ||
      logoUrl !== '' ||
      primaryColor !== '' ||
      addressStreet !== '' ||
      addressNumber !== '' ||
      addressNeighborhood !== '' ||
      addressCity !== '' ||
      addressState !== '' ||
      addressZip !== '' ||
      hasAnyOperation ||
      hasAnyPayment ||
      minimumOrder.trim() !== '0' ||
      deliveryFee.trim() !== '0' ||
      averagePrepTimeMinutes.trim() !== '15'
    : name !== settings.name ||
      slug !== settings.slug ||
      logoUrl !== (settings.logoUrl ?? '') ||
      primaryColor !== (settings.primaryColor ?? '') ||
      addressStreet !== settings.address.street ||
      addressNumber !== settings.address.number ||
      addressNeighborhood !== settings.address.neighborhood ||
      addressCity !== settings.address.city ||
      addressState !== settings.address.state ||
      addressZip !== settings.address.zip ||
      deliveryEnabled !== settings.deliveryEnabled ||
      pickupEnabled !== settings.pickupEnabled ||
      dineInEnabled !== settings.dineInEnabled ||
      minimumOrder.trim() !== String(settings.minimumOrder) ||
      deliveryFee.trim() !== String(settings.deliveryFee) ||
      averagePrepTimeMinutes.trim() !== String(settings.averagePrepTimeMinutes) ||
      paymentCash !== settings.paymentMethods.cash ||
      paymentPix !== settings.paymentMethods.pix ||
      paymentCardEnabled !== settings.paymentMethods.card.enabled ||
      paymentCardFlags !== settings.paymentMethods.card.flags.join(', ');

  const showIncompleteWarning =
    name.trim() === '' ||
    slug.trim() === '' ||
    addressStreet.trim() === '' ||
    addressNumber.trim() === '' ||
    addressNeighborhood.trim() === '' ||
    addressCity.trim() === '' ||
    addressState.trim() === '' ||
    addressZip.trim() === '' ||
    !hasAnyOperation ||
    !hasAnyPayment;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      id="store-settings-form"
      className="space-y-6 pb-4"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Configurações da Loja</h1>
        <p className="text-muted-foreground">
          Dados usados para liberar o cardápio público e operação básica
        </p>
      </div>

      {showIncompleteWarning && (
        <Alert>
          <AlertDescription>
            Configurações incompletas. Preencha os dados e habilite operação e pagamento
            para liberar o cardápio público.
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
              <CardDescription>Como a loja aparece para clientes</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome da Loja</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Slug público</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cor primária</Label>
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="Ex.: #FF0000"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>Usado para entrega e contexto de operação</CardDescription>
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
                <Label>Bairro</Label>
                <Input
                  value={addressNeighborhood}
                  onChange={(e) => setAddressNeighborhood(e.target.value)}
                />
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
                <MaskedInput
                  type="cep"
                  value={addressZip}
                  onChange={(raw) => setAddressZip(typeof raw === 'string' ? raw : String(raw))}
                  placeholder="00000-000"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operação</CardTitle>
              <CardDescription>Tipos de atendimento oferecidos</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <label className="flex items-center justify-between rounded-lg border p-3">
                <span className="mr-4">
                  <span className="block font-medium">Delivery</span>
                  <span className="block text-sm text-muted-foreground">
                    Entrega para o endereço do cliente
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={deliveryEnabled}
                  onChange={(e) => setDeliveryEnabled(e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border p-3">
                <span className="mr-4">
                  <span className="block font-medium">Retirada</span>
                  <span className="block text-sm text-muted-foreground">
                    Cliente retira no balcão
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={pickupEnabled}
                  onChange={(e) => setPickupEnabled(e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border p-3">
                <span className="mr-4">
                  <span className="block font-medium">Consumo local</span>
                  <span className="block text-sm text-muted-foreground">
                    Atendimento em mesas
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={dineInEnabled}
                  onChange={(e) => setDineInEnabled(e.target.checked)}
                />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regras de Pedido</CardTitle>
              <CardDescription>Valores usados no checkout público</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Valor mínimo do pedido</Label>
                <MaskedInput
                  type="currency"
                  value={minimumOrder}
                  onChange={(raw) => {
                    const cents = typeof raw === 'number' ? raw : Number(String(raw).replace(/\D/g, ''));
                    setMinimumOrder(String(Math.round(cents)));
                  }}
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Taxa de entrega</Label>
                <MaskedInput
                  type="currency"
                  value={deliveryFee}
                  onChange={(raw) => {
                    const cents = typeof raw === 'number' ? raw : Number(String(raw).replace(/\D/g, ''));
                    setDeliveryFee(String(Math.round(cents)));
                  }}
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Tempo médio de preparo (min)</Label>
                <Input
                  value={averagePrepTimeMinutes}
                  onChange={(e) => setAveragePrepTimeMinutes(e.target.value)}
                  placeholder="Ex.: 15"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Formas de Pagamento</CardTitle>
              <CardDescription>Ao menos uma forma precisa estar habilitada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="flex items-center justify-between rounded-lg border p-3">
                  <span className="mr-4">
                    <span className="block font-medium">Dinheiro</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={paymentCash}
                    onChange={(e) => setPaymentCash(e.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between rounded-lg border p-3">
                  <span className="mr-4">
                    <span className="block font-medium">Pix</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={paymentPix}
                    onChange={(e) => setPaymentPix(e.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between rounded-lg border p-3">
                  <span className="mr-4">
                    <span className="block font-medium">Cartão</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={paymentCardEnabled}
                    onChange={(e) => setPaymentCardEnabled(e.target.checked)}
                  />
                </label>
              </div>

              <div className="space-y-2">
                <Label>Bandeiras de cartão</Label>
                <Input
                  value={paymentCardFlags}
                  onChange={(e) => setPaymentCardFlags(e.target.value)}
                  placeholder="Ex.: VISA, MasterCard"
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

export const StoreSettingsPage = withModuleGuard(StoreSettingsPageContent, 'store-settings');

registerSettingsSection({
  id: 'store-settings',
  title: 'Loja e Operação',
  description: 'Dados da loja, endereço, operação e pagamentos',
  icon: 'store',
  category: 'store',
  order: 2,
  component: StoreSettingsPage,
});
