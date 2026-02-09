'use client';

import React from 'react';
import { useParams } from 'react-router-dom';
import type {
  ClientTrackingMapConfig,
  ClientTrackingSnapshot,
} from '@/src/types/client-tracking';
import type {
  GoogleMapInstance,
  GoogleMarkerInstance,
  GoogleMapsNamespace,
} from '@/src/types/delivery-tracking';
import { isGoogleMapsNamespace } from '@/src/types/delivery-tracking';
import { useClientTracking } from '../hooks/useClientTracking';
import { useClientTrackingMapConfig } from '../hooks/useClientTrackingMapConfig';
import { formatEta } from '../providers/trackingUiProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type PublicWhiteLabelConfig = {
  tenantId: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor?: string;
  theme?: 'light' | 'dark';
};

function applyPublicWhiteLabelToDOM(config: PublicWhiteLabelConfig): void {
  const root = document.documentElement;
  const currentTheme = config.theme === 'dark' ? 'dark' : 'light';

  root.classList.remove('light', 'dark');
  root.classList.add(currentTheme);

  root.style.removeProperty('--tenant-primary');
  root.style.removeProperty('--tenant-primary-foreground');
  root.style.removeProperty('--tenant-secondary');
  root.style.removeProperty('--tenant-background');
  root.style.removeProperty('--tenant-ring');

  root.style.setProperty('--tenant-background', config.backgroundColor ?? '0 0% 100%');
  root.style.setProperty('--tenant-primary', config.primaryColor);
  root.style.setProperty('--tenant-secondary', config.secondaryColor);
  root.style.setProperty('--tenant-ring', config.primaryColor);
  root.style.setProperty('--tenant-primary-foreground', '0 0% 100%');
}

function getGoogleNamespace(): GoogleMapsNamespace | null {
  if (typeof window === 'undefined') return null;
  const candidate = (window as { google?: unknown }).google;
  if (!candidate || !isGoogleMapsNamespace(candidate)) return null;
  return candidate;
}

function hasCoordinates(
  point: { latitude: number | null; longitude: number | null } | null,
): point is { latitude: number; longitude: number } {
  return !!point && typeof point.latitude === 'number' && typeof point.longitude === 'number';
}

function getCenter(snapshot: ClientTrackingSnapshot | null): { lat: number; lng: number } {
  if (!snapshot) return { lat: 0, lng: 0 };
  if (hasCoordinates(snapshot.customer)) {
    return { lat: snapshot.customer.latitude, lng: snapshot.customer.longitude };
  }
  if (hasCoordinates(snapshot.restaurant)) {
    return { lat: snapshot.restaurant.latitude, lng: snapshot.restaurant.longitude };
  }
  return { lat: 0, lng: 0 };
}

type MapProps = {
  snapshot: ClientTrackingSnapshot | null;
  mapConfig: ClientTrackingMapConfig | null;
};

function ClientTrackingMap(props: MapProps) {
  const { snapshot, mapConfig } = props;
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [maps, setMaps] = React.useState<GoogleMapsNamespace | null>(null);
  const [map, setMap] = React.useState<GoogleMapInstance | null>(null);
  const scriptStatusRef = React.useRef<'idle' | 'loading' | 'ready'>('idle');

  React.useEffect(() => {
    if (maps) return;
    if (!mapConfig?.googleMapsScript) return;
    if (typeof window === 'undefined') return;
    const namespace = getGoogleNamespace();
    if (namespace) {
      setMaps(namespace);
      return;
    }
    if (scriptStatusRef.current !== 'idle') return;
    scriptStatusRef.current = 'loading';
    const existing = document.querySelector('script[data-google-maps="client-tracking"]');
    if (existing) {
      scriptStatusRef.current = 'ready';
      const loaded = getGoogleNamespace();
      if (loaded) setMaps(loaded);
      return;
    }
    const script = document.createElement('script');
    script.dataset.googleMaps = 'client-tracking';
    script.text = mapConfig.googleMapsScript;
    script.onerror = () => {
      scriptStatusRef.current = 'idle';
    };
    document.body.appendChild(script);
    scriptStatusRef.current = 'ready';
    const loaded = getGoogleNamespace();
    if (loaded) setMaps(loaded);
  }, [mapConfig, maps]);

  React.useEffect(() => {
    if (!maps) return;
    if (map) return;
    const container = containerRef.current;
    if (!container) return;
    const center = getCenter(snapshot);
    const instance = new maps.maps.Map(container, {
      center,
      zoom: 14,
      disableDefaultUI: true,
      gestureHandling: 'greedy',
      mapId: mapConfig?.googleMapsMapId ?? undefined,
    });
    setMap(instance);
  }, [maps, map, snapshot, mapConfig?.googleMapsMapId]);

  React.useEffect(() => {
    if (!maps) return;
    if (!map) return;
    if (!snapshot) return;

    const markers: GoogleMarkerInstance[] = [];
    const bounds = new maps.maps.LatLngBounds();
    let hasPoints = false;

    if (hasCoordinates(snapshot.restaurant)) {
      const position = {
        lat: snapshot.restaurant.latitude,
        lng: snapshot.restaurant.longitude,
      };
      const marker = new maps.maps.Marker({
        map,
        position,
        title: snapshot.restaurant.label ?? 'Restaurante',
      });
      markers.push(marker);
      bounds.extend(position);
      hasPoints = true;
    }

    if (hasCoordinates(snapshot.customer)) {
      const position = {
        lat: snapshot.customer.latitude,
        lng: snapshot.customer.longitude,
      };
      const marker = new maps.maps.Marker({
        map,
        position,
        title: snapshot.customer.label ?? 'Cliente',
      });
      markers.push(marker);
      bounds.extend(position);
      hasPoints = true;
    }

    if (
      snapshot.driver &&
      typeof snapshot.driver.latitude === 'number' &&
      typeof snapshot.driver.longitude === 'number'
    ) {
      const position = {
        lat: snapshot.driver.latitude,
        lng: snapshot.driver.longitude,
      };
      const marker = new maps.maps.Marker({
        map,
        position,
        title: 'Entregador',
      });
      markers.push(marker);
      bounds.extend(position);
      hasPoints = true;
    }

    if (!hasPoints) {
      map.setCenter(getCenter(snapshot));
      map.setZoom(14);
    } else {
      map.fitBounds(bounds, 80);
    }

    return () => {
      markers.forEach((marker) => {
        marker.setMap(null);
      });
    };
  }, [maps, map, snapshot]);

  return <div ref={containerRef} className="h-[60vh] w-full rounded-lg border" />;
}

export function ClientTrackingPage() {
  const params = useParams();
  const token = params.token ?? '';
  const { snapshot, loading, error } = useClientTracking(token);
  const { data: mapConfig } = useClientTrackingMapConfig(token);
  const [whiteLabel, setWhiteLabel] = React.useState<PublicWhiteLabelConfig | null>(null);

  React.useEffect(() => {
    if (!snapshot?.tenantSlug) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `/api/v1/public/white-label/${encodeURIComponent(snapshot.tenantSlug)}`,
        );
        const raw: unknown = await response.json().catch(() => null);
        if (
          response.ok &&
          raw &&
          typeof raw === 'object' &&
          'success' in raw &&
          (raw as { success: boolean }).success === true &&
          'data' in raw
        ) {
          const data = (raw as { data: PublicWhiteLabelConfig | null }).data;
          if (!cancelled) setWhiteLabel(data);
        }
      } catch {
        if (!cancelled) setWhiteLabel(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [snapshot?.tenantSlug]);

  React.useEffect(() => {
    if (!whiteLabel) return;
    if (typeof document === 'undefined') return;
    applyPublicWhiteLabelToDOM(whiteLabel);
  }, [whiteLabel]);

  const statusLabel = snapshot?.statusLabel ?? 'Tracking';
  const message = snapshot?.message ?? '';
  const etaLabel = formatEta(snapshot?.etaMinutes ?? null);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          {whiteLabel?.logo && (
            <img
              src={whiteLabel.logo}
              alt="Logo"
              className="h-10 w-10 rounded-lg object-cover"
            />
          )}
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{statusLabel}</h1>
        </div>
        {message && <p className="text-muted-foreground">{message}</p>}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Mapa</CardTitle>
              </CardHeader>
              <CardContent>
                <ClientTrackingMap snapshot={snapshot} mapConfig={mapConfig} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estimativa de chegada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-medium">{etaLabel}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
