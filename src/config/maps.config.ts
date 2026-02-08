export type MapsConfig = {
  googleDistanceMatrixApiKey: string | null;
  googleMapsApiKey: string | null;
  googleMapsMapId: string | null;
};

export function getMapsConfig(): MapsConfig {
  const googleDistanceMatrixApiKey =
    typeof process.env.GOOGLE_DISTANCE_MATRIX_API_KEY === 'string' &&
    process.env.GOOGLE_DISTANCE_MATRIX_API_KEY.trim().length > 0
      ? process.env.GOOGLE_DISTANCE_MATRIX_API_KEY.trim()
      : null;

  const googleMapsApiKey =
    typeof process.env.GOOGLE_MAPS_API_KEY === 'string' &&
    process.env.GOOGLE_MAPS_API_KEY.trim().length > 0
      ? process.env.GOOGLE_MAPS_API_KEY.trim()
      : null;

  const googleMapsMapId =
    typeof process.env.GOOGLE_MAPS_MAP_ID === 'string' &&
    process.env.GOOGLE_MAPS_MAP_ID.trim().length > 0
      ? process.env.GOOGLE_MAPS_MAP_ID.trim()
      : null;

  return {
    googleDistanceMatrixApiKey,
    googleMapsApiKey,
    googleMapsMapId,
  };
}
