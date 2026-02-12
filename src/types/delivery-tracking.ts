export type DeliveryTrackingDriverStatus = 'in_route' | 'stopped' | 'offline';

export type DeliveryTrackingDriverSnapshot = {
  driverId: string;
  name: string;
  status: DeliveryTrackingDriverStatus;
  activeOrderId: string | null;
  latitude: number | null;
  longitude: number | null;
  lastLocationAt: string | null;
  lastUpdateAt: string;
};

export type DeliveryTrackingRouteSnapshot = {
  routeId: string;
  name: string;
  status: string;
  orderIds: string[];
  stops: Array<{
    orderId: string;
    latitude: number | null;
    longitude: number | null;
    label: string | null;
    sequence: number;
    distanceKm: number | null;
    etaMinutes: number | null;
  }>;
  totalDistanceKm: number | null;
  totalEtaMinutes: number | null;
  active: boolean;
  etaMinutes: number | null;
};

export type DeliveryTrackingSnapshot = {
  drivers: DeliveryTrackingDriverSnapshot[];
  routes: DeliveryTrackingRouteSnapshot[];
  restaurant: DeliveryTrackingRestaurantLocation | null;
  updatedAt: string;
};

export type DeliveryTrackingMapConfig = {
  googleMapsScript: string | null; // URL do script do Google Maps
  googleMapsMapId: string | null;
};

export type DeliveryTrackingRestaurantLocation = {
  latitude: number | null;
  longitude: number | null;
  label: string | null;
};

export type LatLngLiteral = {
  lat: number;
  lng: number;
};

export type GoogleMapOptions = {
  center: LatLngLiteral;
  zoom: number;
  disableDefaultUI?: boolean;
  gestureHandling?: string;
  mapId?: string;
};

export type GoogleMapInstance = {
  setCenter(position: LatLngLiteral): void;
  setZoom(zoom: number): void;
  fitBounds(bounds: GoogleLatLngBounds, padding?: number): void;
};

export type GoogleLatLngBounds = {
  extend(position: LatLngLiteral): void;
};

export type GoogleMarkerIcon = {
  path: string;
  scale?: number;
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  rotation?: number;
};

export type GoogleMarkerOptions = {
  position: LatLngLiteral;
  map: GoogleMapInstance | null;
  title?: string;
  icon?: GoogleMarkerIcon;
};

export type GoogleMarkerInstance = {
  setPosition(position: LatLngLiteral): void;
  setMap(map: GoogleMapInstance | null): void;
  setIcon(icon: GoogleMarkerIcon): void;
  setTitle(title: string): void;
};

export type GooglePolylineOptions = {
  path: LatLngLiteral[];
  map: GoogleMapInstance | null;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
};

export type GooglePolylineInstance = {
  setPath(path: LatLngLiteral[]): void;
  setMap(map: GoogleMapInstance | null): void;
};

export type GoogleMapsNamespace = {
  maps: {
    Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMapInstance;
    Marker: new (options: GoogleMarkerOptions) => GoogleMarkerInstance;
    Polyline: new (options: GooglePolylineOptions) => GooglePolylineInstance;
    LatLngBounds: new () => GoogleLatLngBounds;
    SymbolPath: {
      CIRCLE: string;
    };
  };
};

export function isGoogleMapsNamespace(value: unknown): value is GoogleMapsNamespace {
  if (typeof value !== 'object' || value === null) return false;
  if (!('maps' in value)) return false;
  const maps = (value as { maps?: unknown }).maps;
  if (typeof maps !== 'object' || maps === null) return false;
  const candidate = maps as {
    Map?: unknown;
    Marker?: unknown;
    Polyline?: unknown;
    LatLngBounds?: unknown;
    SymbolPath?: unknown;
  };
  return (
    typeof candidate.Map === 'function' &&
    typeof candidate.Marker === 'function' &&
    typeof candidate.Polyline === 'function' &&
    typeof candidate.LatLngBounds === 'function' &&
    typeof candidate.SymbolPath === 'object' &&
    candidate.SymbolPath !== null &&
    'CIRCLE' in candidate.SymbolPath
  );
}
