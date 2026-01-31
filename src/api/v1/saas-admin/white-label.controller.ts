/**
 * White Label Controller (SaaS Admin)
 * 
 * THIN CONTROLLER - No business logic.
 * Validates input, calls service, returns HTTP response.
 */

import type { Request, Response } from '../middleware';
import { prisma } from '../../../adapters/prisma/client';

/**
 * GET /api/v1/saas-admin/white-label/:tenantId
 * Get white label config for tenant
 */
export async function getWhiteLabel(req: Request, res: Response): Promise<void> {
  const { tenantId } = req.params || {};

  if (!tenantId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Tenant ID is required' };
    return;
  }

  try {
    const config = await prisma.whiteBrandConfig.findUnique({
      where: { tenant_id: tenantId },
    });
    
    // If no config exists, return default/null structure rather than 404
    // or let the UI handle it. 
    
    res.status = 200;
    res.body = {
      success: true,
      data: config || null,
    };
  } catch (error) {
    console.error('[v0] getWhiteLabel error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to get white label config',
    };
  }
}

/**
 * PATCH /api/v1/saas-admin/white-label/:tenantId
 * Update white label config for tenant
 */
export async function updateWhiteLabel(req: Request, res: Response): Promise<void> {
  const { tenantId } = req.params || {};
  const body = req.body;

  if (!body || typeof body !== 'object') {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Invalid body' };
    return;
  }

  const { primaryColor, secondaryColor, logo } = body as {
    primaryColor?: string;
    secondaryColor?: string;
    logo?: string | null;
  };

  if (!tenantId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Tenant ID is required' };
    return;
  }

  try {
    // Upsert config
    const config = await prisma.whiteBrandConfig.upsert({
      where: { tenant_id: tenantId },
      update: {
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        logo: logo,
        updated_at: new Date(),
      },
      create: {
        tenant_id: tenantId,
        primary_color: primaryColor || '#000000',
        secondary_color: secondaryColor || '#ffffff',
        logo: logo,
      },
    });
    
    res.status = 200;
    res.body = {
      success: true,
      data: config,
    };
  } catch (error) {
    console.error('[v0] updateWhiteLabel error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to update white label config',
    };
  }
}

/**
 * POST /api/v1/saas-admin/white-label/:tenantId/init
 * Initialize default white label for tenant
 */
export async function initWhiteLabel(req: Request, res: Response): Promise<void> {
  const { tenantId } = req.params || {};

  if (!tenantId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Tenant ID is required' };
    return;
  }

  try {
    const defaults = {
      primary_color: '#0F172A', // slate-900
      secondary_color: '#38BDF8', // sky-400
      logo: null as string | null,
    };

    const config = await prisma.whiteBrandConfig.upsert({
      where: { tenant_id: tenantId },
      update: {
        ...defaults,
        updated_at: new Date(),
      },
      create: {
        tenant_id: tenantId,
        ...defaults,
      },
    });

    const prismaWithAudit = prisma as unknown as {
      auditEvent?: {
        create: (args: { data: unknown }) => Promise<unknown>;
      };
    };

    try {
      await prismaWithAudit.auditEvent?.create({
        data: {
          action: 'TENANT_WHITE_LABEL_INITIALIZED',
          resource: 'WHITE_LABEL',
          tenant_id: tenantId,
          timestamp: new Date(),
          details: 'White-label inicializado com defaults',
        },
      });
    } catch (error) {
      console.warn('[v0] initWhiteLabel audit log failed:', error);
    }

    res.status = 201;
    res.body = {
      success: true,
      data: config,
    };
  } catch (error) {
    console.error('[v0] initWhiteLabel error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to initialize white label',
    };
  }
}
