import type { Request, Response } from '@/src/api/v1/middleware';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import { prisma } from '@/src/adapters/prisma/client';

export async function getPublicWhiteLabel(req: Request, res: Response): Promise<void> {
  const tenantSlug = req.params?.tenantSlug?.trim() ?? '';

  if (!tenantSlug) {
    const errorBody: ApiErrorResponse = {
      error: 'Bad Request',
      message: 'Tenant slug is required',
    };
    res.status = 400;
    res.body = errorBody;
    return;
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });

    if (!tenant) {
      const errorBody: ApiErrorResponse = {
        error: 'Not Found',
        message: 'Tenant not found',
      };
      res.status = 404;
      res.body = errorBody;
      return;
    }

    const config = await prisma.whiteBrandConfig.findUnique({
      where: { tenant_id: tenant.id },
    });

    const successBody: ApiSuccessResponse<{
      tenantId: string;
      logo?: string;
      primaryColor: string;
      secondaryColor: string;
      backgroundColor?: string;
      theme?: 'light' | 'dark';
    } | null> = {
      success: true,
      data: config
        ? {
            tenantId: config.tenant_id,
            logo: config.logo ?? undefined,
            primaryColor: config.primary_color,
            secondaryColor: config.secondary_color,
            backgroundColor: config.background_color ?? undefined,
            theme: (config.theme as 'light' | 'dark' | null) ?? undefined,
          }
        : null,
    };

    res.status = 200;
    res.body = successBody;
  } catch (error: unknown) {
    const errorBody: ApiErrorResponse = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to get white label config',
    };
    res.status = 500;
    res.body = errorBody;
  }
}

