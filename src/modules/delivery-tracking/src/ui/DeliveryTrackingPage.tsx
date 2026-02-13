'use client';

import React from 'react';
import { withModuleGuard, PermissionGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import type {
  DeliveryTrackingMapConfig,
  GoogleMapInstance,
  GoogleMarkerInstance,
  GoogleMapsNamespace,
  GooglePolylineInstance,
  LatLngLiteral,
} from '@/src/types/delivery-tracking';
import { isGoogleMapsNamespace } from '@/src/types/delivery-tracking';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDeliveryTracking } from '../hooks/useDeliveryTracking';
import { useDeliveryTrackingMapConfig } from '../hooks/useDeliveryTrackingMapConfig';

type MapProps = {
  snapshot: ReturnType<typeof useDeliveryTracking>['snapshot'];
  mapConfig: DeliveryTrackingMapConfig | null;
};

function getGoogleNamespace(): GoogleMapsNamespace | null {
  if (typeof window === 'undefined') return null;
  const candidate = (window as { google?: unknown }).google;
  if (!candidate || !isGoogleMapsNamespace(candidate)) return null;
  return candidate;
}

function hasCoordinates<T extends { latitude: number | null; longitude: number | null }>(
  value: T,
): value is T & { latitude: number; longitude: number } {
  return typeof value.latitude === 'number' && typeof value.longitude === 'number';
}

function getInitialCenter(snapshot: MapProps['snapshot']): LatLngLiteral {
  if (snapshot) {
    const driverWithLocation = snapshot.drivers.find((driver) => hasCoordinates(driver));
    if (driverWithLocation) {
      return {
        lat: driverWithLocation.latitude,
        lng: driverWithLocation.longitude,
      };
    }
    const routeWithStop = snapshot.routes.find((route) => route.stops.some(hasCoordinates));
    if (routeWithStop) {
      const stop = routeWithStop.stops.find((s) => hasCoordinates(s));
      if (stop) {
        return {
          lat: stop.latitude,
          lng: stop.longitude,
        };
      }
    }
    if (
      snapshot.restaurant &&
      typeof snapshot.restaurant.latitude === 'number' &&
      typeof snapshot.restaurant.longitude === 'number'
    ) {
      return {
        lat: snapshot.restaurant.latitude,
        lng: snapshot.restaurant.longitude,
      };
    }
  }
  return { lat: 0, lng: 0 };
}

function DeliveryTrackingMap(props: MapProps) {
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
    
    // Verificar se já existe um script do Google Maps
    const existing = document.querySelector('script[data-google-maps="delivery-tracking"]');
    if (existing instanceof HTMLScriptElement) {
      const loaded = getGoogleNamespace();
      if (loaded) {
        scriptStatusRef.current = 'ready';
        setMaps(loaded);
        return;
      }
      const handleLoad = () => {
        scriptStatusRef.current = 'ready';
        const loadedNow = getGoogleNamespace();
        if (loadedNow) {
          setMaps(loadedNow);
        }
      };
      const handleError = () => {
        scriptStatusRef.current = 'idle';
        console.error('Falha ao carregar o Google Maps');
      };
      existing.addEventListener('load', handleLoad, { once: true });
      existing.addEventListener('error', handleError, { once: true });
      return;
    }

    // Criar script com parâmetros corretos para async loading
    const script = document.createElement('script');
    script.dataset.googleMaps = 'delivery-tracking';
    script.async = true;
    script.defer = true;
    
    // Usar a URL diretamente já que agora recebemos a URL completa
    const url = new URL(mapConfig.googleMapsScript);
    url.searchParams.set('callback', 'googleMapsCallback');
    url.searchParams.set('loading', 'async');
    script.src = url.toString();
    
    // Definir callback global para quando o Google Maps carregar
    const googleWindow = window as Window & { googleMapsCallback?: () => void };
    googleWindow.googleMapsCallback = () => {
      scriptStatusRef.current = 'ready';
      const loaded = getGoogleNamespace();
      if (loaded) {
        setMaps(loaded);
      } else {
        console.error('Google Maps callback executed but namespace not found');
      }
      delete googleWindow.googleMapsCallback;
    };
    
    script.onerror = () => {
      scriptStatusRef.current = 'idle';
      console.error('Falha ao carregar o Google Maps');
    };
    
    document.head.appendChild(script);
  }, [mapConfig, maps]);

  React.useEffect(() => {
    if (!maps) return;
    if (!containerRef.current) return;
    if (map) return;
    const center = getInitialCenter(snapshot);
    const instance = new maps.maps.Map(containerRef.current, {
      center,
      zoom: 13,
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
    
    const bounds = new maps.maps.LatLngBounds();
    let hasPoints = false;

    snapshot.drivers.forEach((driver) => {
      if (typeof driver.latitude === 'number' && typeof driver.longitude === 'number') {
        bounds.extend({ lat: driver.latitude, lng: driver.longitude });
        hasPoints = true;
      }
    });

    snapshot.routes.forEach((route) => {
      route.stops.forEach((stop) => {
        if (typeof stop.latitude === 'number' && typeof stop.longitude === 'number') {
          bounds.extend({ lat: stop.latitude, lng: stop.longitude });
          hasPoints = true;
        }
      });
    });

    if (
      snapshot.restaurant &&
      typeof snapshot.restaurant.latitude === 'number' &&
      typeof snapshot.restaurant.longitude === 'number'
    ) {
      bounds.extend({ lat: snapshot.restaurant.latitude, lng: snapshot.restaurant.longitude });
      hasPoints = true;
    }

    if (!hasPoints) {
      map.setCenter(getInitialCenter(snapshot));
      map.setZoom(12);
      return;
    }

    // Se temos apenas o restaurante, centralizar nele com zoom adequado
    const totalPoints = 
      snapshot.drivers.filter(d => hasCoordinates(d)).length +
      snapshot.routes.flatMap(r => r.stops).filter(s => hasCoordinates(s)).length +
      (snapshot.restaurant && hasCoordinates(snapshot.restaurant) ? 1 : 0);
    
    if (totalPoints === 1 && snapshot.restaurant && hasCoordinates(snapshot.restaurant)) {
      map.setCenter({ lat: snapshot.restaurant.latitude, lng: snapshot.restaurant.longitude });
      map.setZoom(15);
    } else {
      map.fitBounds(bounds, 80);
    }
  }, [maps, map, snapshot]);

  React.useEffect(() => {
    if (!maps) return;
    if (!map) return;
    if (!snapshot) return;

    const driverMarkers: GoogleMarkerInstance[] = snapshot.drivers
      .filter((driver) => hasCoordinates(driver))
      .map((driver) => {
        const color =
          driver.status === 'offline'
            ? '#9ca3af'
            : driver.status === 'stopped'
            ? '#f59e0b'
            : '#3b82f6';
        return new maps.maps.Marker({
          map,
          position: { lat: driver.latitude, lng: driver.longitude },
          title: driver.name,
          icon: {
            path: maps.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: color,
            fillOpacity: 0.9,
            strokeColor: '#111827',
            strokeOpacity: 0.9,
            strokeWeight: 1,
          },
        });
      });

    const orderMarkers: GoogleMarkerInstance[] = snapshot.routes
      .flatMap((route) => route.stops)
      .filter((stop) => hasCoordinates(stop))
      .map((stop) => {
        return new maps.maps.Marker({
          map,
          position: { lat: stop.latitude, lng: stop.longitude },
          title: stop.label ?? `Pedido ${stop.orderId}`,
          icon: {
            path: maps.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: '#f97316',
            fillOpacity: 0.95,
            strokeColor: '#111827',
            strokeOpacity: 0.9,
            strokeWeight: 1,
          },
        });
      });

    const restaurantMarkers: GoogleMarkerInstance[] =
      snapshot.restaurant &&
      typeof snapshot.restaurant.latitude === 'number' &&
      typeof snapshot.restaurant.longitude === 'number'
        ? [
            new maps.maps.Marker({
              map,
              position: {
                lat: snapshot.restaurant.latitude,
                lng: snapshot.restaurant.longitude,
              },
              title: snapshot.restaurant.label ?? 'Restaurante',
              icon: {
                path: maps.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#10b981',
                fillOpacity: 0.95,
                strokeColor: '#064e3b',
                strokeOpacity: 0.9,
                strokeWeight: 1,
              },
            }),
          ]
        : [];

    const routePolylines: GooglePolylineInstance[] = snapshot.routes
      .filter((route) => route.stops.length > 1)
      .map((route) => {
        const path: LatLngLiteral[] = route.stops
          .filter((stop) => hasCoordinates(stop))
          .map((stop) => ({
            lat: stop.latitude,
            lng: stop.longitude,
          }));
        if (path.length < 2) return null;
        const color = route.active ? '#10b981' : '#6b7280';
        return new maps.maps.Polyline({
          map,
          path,
          strokeColor: color,
          strokeOpacity: 0.9,
          strokeWeight: 3,
        });
      })
      .filter((polyline): polyline is GooglePolylineInstance => Boolean(polyline));

    return () => {
      driverMarkers.forEach((marker) => {
        marker.setMap(null);
      });
      orderMarkers.forEach((marker) => {
        marker.setMap(null);
      });
      restaurantMarkers.forEach((marker) => {
        marker.setMap(null);
      });
      routePolylines.forEach((polyline) => {
        polyline.setMap(null);
      });
    };
  }, [maps, map, snapshot]);

  if (typeof window === 'undefined') return null;

  if (mapConfig && !mapConfig.googleMapsScript) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-lg border text-sm text-muted-foreground md:h-[420px] lg:h-[520px]">
        Google Maps não configurado.
      </div>
    );
  }

  if (!maps) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-lg border text-sm text-muted-foreground md:h-[420px] lg:h-[520px]">
        Carregando mapa...
      </div>
    );
  }

  return <div ref={containerRef} className="h-[320px] w-full rounded-lg border md:h-[420px] lg:h-[520px]" />;
}

function DeliveryTrackingPageContent() {
  const { tenantSlug } = useTenant();
  const { tenantSettings } = useSession();
  const { toast } = useToast();
  const realtimeEnabled = tenantSettings?.realtimeEnabled ?? true;
  const { snapshot, loading, error, reload } = useDeliveryTracking(tenantSlug, { realtimeEnabled });
  const mapConfigState = useDeliveryTrackingMapConfig(tenantSlug);
  const notificationsRef = React.useRef<Record<string, string>>({});

  React.useEffect(() => {
    if (!snapshot) return;
    snapshot.routes.forEach((route) => {
      const etaMinutes = route.etaMinutes ?? route.totalEtaMinutes ?? null;
      const statusKey =
        route.status === 'completed'
          ? 'entregue'
          : route.status === 'in_progress' && etaMinutes !== null && etaMinutes <= 5
            ? 'proximo'
            : 'em_rota';
      const lastStatus = notificationsRef.current[route.routeId];
      if (lastStatus === statusKey) return;
      notificationsRef.current[route.routeId] = statusKey;
      const statusText =
        statusKey === 'entregue'
          ? 'Pedido entregue'
          : statusKey === 'proximo'
            ? 'Pedido está próximo'
            : 'Pedido saiu para entrega';
      const etaText = etaMinutes !== null ? `${etaMinutes} min` : 'ETA indisponível';
      toast({
        title: statusText,
        description: `${route.name} • ${etaText}`,
      });
    });
  }, [snapshot, toast]);

  return (
    <PermissionGuard permission="delivery-tracking.view">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Mapa de entregas</h1>
            <p className="text-muted-foreground">
              Acompanhe entregadores e rotas em tempo quase real
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => void reload()} disabled={loading}>
            Atualizar mapa
          </Button>
        </div>

        {realtimeEnabled && (
          <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground w-fit">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Ao vivo
          </div>
        )}

        {(error || mapConfigState.error) && (
          <Alert variant="destructive">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              <span>{error ?? mapConfigState.error}</span>
              <Button variant="outline" size="sm" onClick={() => void reload()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Visão em mapa</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !snapshot ? (
              <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground md:h-[420px] lg:h-[520px]">
                Carregando dados de entregas...
              </div>
            ) : !snapshot ? (
              <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground md:h-[420px] lg:h-[520px]">
                Nenhuma informação de entregas disponível ainda.
              </div>
            ) : (
              <DeliveryTrackingMap snapshot={snapshot} mapConfig={mapConfigState.mapConfig} />
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}

export const DeliveryTrackingPage = withModuleGuard(
  DeliveryTrackingPageContent,
  'delivery-tracking',
);
