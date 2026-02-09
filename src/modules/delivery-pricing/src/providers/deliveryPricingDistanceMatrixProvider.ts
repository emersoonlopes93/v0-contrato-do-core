import { getMapsConfig } from '@/src/config/maps.config';
import type { DistanceMatrixInput, DistanceMatrixResponse } from '@/src/types/delivery-routes';
import { GoogleDistanceMatrixProvider } from '@/src/modules/delivery-routes/src/providers/googleDistanceMatrix.provider';

export class DeliveryPricingDistanceMatrixProvider {
  private readonly provider: GoogleDistanceMatrixProvider;

  constructor() {
    const config = getMapsConfig();
    if (!config.googleDistanceMatrixApiKey) {
      throw new Error('Google Distance Matrix não configurado');
    }
    this.provider = new GoogleDistanceMatrixProvider();
  }

  async calculateMatrix(input: DistanceMatrixInput): Promise<DistanceMatrixResponse> {
    return this.provider.calculateMatrix(input);
  }
}
