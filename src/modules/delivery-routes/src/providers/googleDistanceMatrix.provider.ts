import type {
  DistanceMatrixInput,
  DistanceMatrixProviderContract,
  DistanceMatrixResponse,
} from '@/src/types/delivery-routes';
import { getMapsConfig } from '@/src/config/maps.config';

type GoogleDistanceMatrixElement = {
  status?: string;
  distance?: { value?: number };
  duration?: { value?: number };
};

type GoogleDistanceMatrixRow = {
  elements?: GoogleDistanceMatrixElement[];
};

type GoogleDistanceMatrixApiResponse = {
  status?: string;
  error_message?: string;
  rows?: GoogleDistanceMatrixRow[];
};

import { isRecord } from '@/src/core/utils/type-guards';

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseElement(value: unknown): GoogleDistanceMatrixElement | null {
  if (!isRecord(value)) return null;
  const status = typeof value.status === 'string' ? value.status : undefined;
  const distance = isRecord(value.distance) ? value.distance : undefined;
  const duration = isRecord(value.duration) ? value.duration : undefined;
  const distanceValue = distance && isNumber(distance.value) ? distance.value : undefined;
  const durationValue = duration && isNumber(duration.value) ? duration.value : undefined;
  return {
    status,
    distance: distanceValue !== undefined ? { value: distanceValue } : undefined,
    duration: durationValue !== undefined ? { value: durationValue } : undefined,
  };
}

function getElementsRaw(row: unknown): unknown[] {
  if (!isRecord(row)) return [];
  const value = row.elements;
  return Array.isArray(value) ? value : [];
}

function parseResponse(raw: unknown, originsCount: number, destinationsCount: number): DistanceMatrixResponse {
  if (!isRecord(raw)) {
    return {
      rows: Array.from({ length: originsCount }).map(() => ({
        elements: Array.from({ length: destinationsCount }).map(() => ({
          distanceMeters: null,
          durationSeconds: null,
        })),
      })),
    };
  }

  const rowsRaw = Array.isArray(raw.rows) ? raw.rows : [];
  const rows: DistanceMatrixResponse['rows'] = Array.from({ length: originsCount }).map((_, rowIndex) => {
    const rowRaw = rowsRaw[rowIndex];
    const elementsRaw = getElementsRaw(rowRaw);

    const elements = Array.from({ length: destinationsCount }).map((__, elementIndex) => {
      const element = parseElement(elementsRaw[elementIndex]);
      if (!element || element.status !== 'OK') {
        return { distanceMeters: null, durationSeconds: null };
      }
      return {
        distanceMeters: isNumber(element.distance?.value) ? element.distance?.value ?? null : null,
        durationSeconds: isNumber(element.duration?.value) ? element.duration?.value ?? null : null,
      };
    });

    return { elements };
  });

  return { rows };
}

function buildCoordinates(items: Array<{ latitude: number; longitude: number }>): string {
  return items.map((item) => `${item.latitude},${item.longitude}`).join('|');
}

export class GoogleDistanceMatrixProvider implements DistanceMatrixProviderContract {
  async calculateMatrix(input: DistanceMatrixInput): Promise<DistanceMatrixResponse> {
    const config = getMapsConfig();
    if (!config.googleDistanceMatrixApiKey) {
      return {
        rows: Array.from({ length: input.origins.length }).map(() => ({
          elements: Array.from({ length: input.destinations.length }).map(() => ({
            distanceMeters: null,
            durationSeconds: null,
          })),
        })),
      };
    }

    const origins = buildCoordinates(input.origins);
    const destinations = buildCoordinates(input.destinations);
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.set('origins', origins);
    url.searchParams.set('destinations', destinations);
    url.searchParams.set('key', config.googleDistanceMatrixApiKey);

    const response = await fetch(url.toString());
    const raw: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error('Falha ao consultar Distance Matrix');
    }
    const parsed = raw as GoogleDistanceMatrixApiResponse;
    if (parsed.status && parsed.status !== 'OK') {
      throw new Error(parsed.error_message ?? 'Falha ao consultar Distance Matrix');
    }
    return parseResponse(raw, input.origins.length, input.destinations.length);
  }
}
