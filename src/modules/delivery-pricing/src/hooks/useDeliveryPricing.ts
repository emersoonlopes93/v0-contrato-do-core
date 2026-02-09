import React from 'react';
import type {
  DeliveryPricingPreviewDTO,
  DeliveryPricingPreviewRequest,
  DeliveryPricingSettingsCreateRequest,
  DeliveryPricingSettingsDTO,
  DeliveryPricingSettingsUpdateRequest,
} from '@/src/types/delivery-pricing';
import {
  createDeliveryPricing,
  fetchDeliveryPricing,
  previewDeliveryPricing,
  updateDeliveryPricing,
} from '../repositories/deliveryPricingApiRepository';

type State = {
  settings: DeliveryPricingSettingsDTO | null;
  loading: boolean;
  error: string | null;
  preview: DeliveryPricingPreviewDTO | null;
  previewLoading: boolean;
  save: (input: DeliveryPricingSettingsCreateRequest) => Promise<void>;
  update: (input: DeliveryPricingSettingsUpdateRequest) => Promise<void>;
  simulate: (input: DeliveryPricingPreviewRequest) => Promise<void>;
  reload: () => Promise<void>;
};

export function useDeliveryPricing(accessToken: string | null): State {
  const [settings, setSettings] = React.useState<DeliveryPricingSettingsDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<DeliveryPricingPreviewDTO | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDeliveryPricing(accessToken);
      setSettings(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro ao carregar precificação';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = React.useCallback(
    async (input: DeliveryPricingSettingsCreateRequest) => {
      if (!accessToken) return;
      const data = await createDeliveryPricing(accessToken, input);
      setSettings(data);
    },
    [accessToken],
  );

  const update = React.useCallback(
    async (input: DeliveryPricingSettingsUpdateRequest) => {
      if (!accessToken) return;
      const data = await updateDeliveryPricing(accessToken, input);
      if (data) setSettings(data);
    },
    [accessToken],
  );

  const simulate = React.useCallback(
    async (input: DeliveryPricingPreviewRequest) => {
      if (!accessToken) return;
      setPreviewLoading(true);
      try {
        const data = await previewDeliveryPricing(accessToken, input);
        setPreview(data);
      } finally {
        setPreviewLoading(false);
      }
    },
    [accessToken],
  );

  return {
    settings,
    loading,
    error,
    preview,
    previewLoading,
    save,
    update,
    simulate,
    reload: load,
  };
}
