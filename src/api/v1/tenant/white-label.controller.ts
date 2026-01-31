import type { Request, Response } from '@/src/api/v1/middleware';
import { prisma } from '@/src/adapters/prisma/client';

export async function getTenantWhiteLabel(req: Request, res: Response): Promise<void> {
  try {
    const auth = (req as { auth?: { tenantId?: string } }).auth;
    const tenantId = auth?.tenantId;

    if (!tenantId) {
      res.status = 400;
      res.body = { error: 'Bad Request', message: 'Tenant ID is required' };
      return;
    }

    const config = await prisma.whiteBrandConfig.findUnique({
      where: { tenant_id: tenantId },
    });

    if (!config) {
      res.status = 200;
      res.body = {
        success: true,
        data: null,
      };
      return;
    }

    res.status = 200;
    res.body = {
      success: true,
      data: {
        tenantId: config.tenant_id,
        logo: config.logo ?? undefined,
        primaryColor: config.primary_color,
        secondaryColor: config.secondary_color,
        domain: config.domain ?? undefined,
        customMetadata: config.custom_metadata as unknown as Record<string, unknown> | undefined,
      },
    };
  } catch (error) {
    console.error('[v0] getTenantWhiteLabel error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to get white label config',
    };
  }
}

