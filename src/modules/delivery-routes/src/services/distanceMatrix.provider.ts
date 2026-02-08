import type {
  DistanceMatrixInput,
  DistanceMatrixProviderContract,
  DistanceMatrixResponse,
} from '@/src/types/delivery-routes';

export class NoopDistanceMatrixProvider implements DistanceMatrixProviderContract {
  async calculateMatrix(input: DistanceMatrixInput): Promise<DistanceMatrixResponse> {
    const size = input.origins.length;
    const elements = input.destinations.map(() => ({
      distanceMeters: null,
      durationSeconds: null,
    }));
    return {
      rows: Array.from({ length: size }).map(() => ({
        elements,
      })),
    };
  }
}
