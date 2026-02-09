import React from 'react';
import type { DeliveryDriverDTO } from '@/src/types/delivery-drivers';
import { updateDriverLocation } from '../services/deliveryDriverAppService';

type DriverLocationState = {
  status: 'idle' | 'tracking' | 'error' | 'denied';
  lastUpdateAt: string | null;
  error: string | null;
};

type Options = {
  tenantSlug: string;
  tenantId: string;
  driverId: string;
  activeOrderId: string | null;
  accessToken: string | null;
  enabled: boolean;
  onDriverUpdate: (driver: DeliveryDriverDTO) => void;
};

export function useDriverLocation(options: Options): DriverLocationState {
  const { tenantSlug, tenantId, driverId, activeOrderId, accessToken, enabled, onDriverUpdate } = options;
  const [state, setState] = React.useState<DriverLocationState>({
    status: 'idle',
    lastUpdateAt: null,
    error: null,
  });

  const lastSentRef = React.useRef<number>(0);
  const lastCoordsRef = React.useRef<{ lat: number; lng: number } | null>(null);

  React.useEffect(() => {
    if (!enabled) {
      setState((prev) => ({ ...prev, status: 'idle' }));
      return;
    }

    if (!('geolocation' in navigator)) {
      setState({ status: 'error', lastUpdateAt: null, error: 'Geolocalização indisponível' });
      return;
    }

    const handleSuccess = async (position: GeolocationPosition) => {
      const now = Date.now();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const lastSent = lastSentRef.current;
      const lastCoords = lastCoordsRef.current;

      const elapsed = now - lastSent;
      const moved =
        !lastCoords ||
        Math.abs(lat - lastCoords.lat) > 0.0001 ||
        Math.abs(lng - lastCoords.lng) > 0.0001;

      if (elapsed < 8000 && !moved) {
        return;
      }

      lastSentRef.current = now;
      lastCoordsRef.current = { lat, lng };

      const timestamp = new Date().toISOString();
      try {
        const updated = await updateDriverLocation({
          tenantSlug,
          tenantId,
          driverId,
          latitude: lat,
          longitude: lng,
          timestamp,
          accessToken,
          activeOrderId,
        });
        onDriverUpdate(updated);
        setState({ status: 'tracking', lastUpdateAt: timestamp, error: null });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha ao atualizar localização';
        setState({ status: 'error', lastUpdateAt: null, error: message });
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      if (error.code === 1) {
        setState({ status: 'denied', lastUpdateAt: null, error: 'Permissão negada' });
        return;
      }
      setState({ status: 'error', lastUpdateAt: null, error: error.message });
    };

    const watcher = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    });

    setState((prev) => ({ ...prev, status: 'tracking' }));

    return () => {
      navigator.geolocation.clearWatch(watcher);
    };
  }, [tenantSlug, tenantId, driverId, activeOrderId, accessToken, enabled, onDriverUpdate]);

  return state;
}
