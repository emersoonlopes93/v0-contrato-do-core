/**
 * Hello Module Controller (Tenant)
 * 
 * THIN CONTROLLER - No business logic.
 * Validates input, calls service, returns HTTP response.
 */

import type { Request, Response } from '../../middleware';
import { globalModuleServiceRegistry } from '../../../../core/modules/registry';
import type { HelloService } from '../../../../modules/hello-module/src/services/hello.service';

interface AuthenticatedRequest extends Request {
  auth: {
    userId: string;
    tenantId: string;
    role: string;
    permissions: string[];
  };
}

/**
 * POST /api/v1/tenant/hello/create
 * Create a new hello message
 */
export async function createHello(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  
  // Validate input
  const { message } = req.body as { message?: string };
  
  if (!message || typeof message !== 'string') {
    res.status = 400;
    res.body = {
      error: 'Bad Request',
      message: 'Field "message" is required and must be a string',
    };
    return;
  }
  
  try {
    // Get module service
    const helloService = globalModuleServiceRegistry.get<HelloService>('hello');
    
    if (!helloService) {
      res.status = 500;
      res.body = {
        error: 'Internal Server Error',
        message: 'Hello module service not found',
      };
      return;
    }
    
    // Call service
    await helloService.createHello({
      tenantId: authReq.auth.tenantId,
      userId: authReq.auth.userId,
      message,
    });
    
    // Return success
    res.status = 201;
    res.body = {
      success: true,
      message: 'Hello created successfully',
    };
  } catch (error) {
    console.error('[v0] createHello error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to create hello',
    };
  }
}

/**
 * POST /api/v1/tenant/hello/greet
 * Greet a user
 */
export async function greet(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  
  // Validate input
  const { name } = req.body as { name?: string };
  
  if (!name || typeof name !== 'string') {
    res.status = 400;
    res.body = {
      error: 'Bad Request',
      message: 'Field "name" is required and must be a string',
    };
    return;
  }
  
  try {
    // Get module service
    const helloService = globalModuleServiceRegistry.get<HelloService>('hello');
    
    if (!helloService) {
      res.status = 500;
      res.body = {
        error: 'Internal Server Error',
        message: 'Hello module service not found',
      };
      return;
    }
    
    // Call service
    const greeting = await helloService.greet({
      tenantId: authReq.auth.tenantId,
      userId: authReq.auth.userId,
      name,
    });
    
    // Return success
    res.status = 200;
    res.body = {
      success: true,
      greeting,
    };
  } catch (error) {
    console.error('[v0] greet error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to greet',
    };
  }
}

/**
 * GET /api/v1/tenant/hello/list
 * List all hellos for current tenant
 */
export async function listHellos(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  
  try {
    // Get module service
    const helloService = globalModuleServiceRegistry.get<HelloService>('hello');
    
    if (!helloService) {
      res.status = 500;
      res.body = {
        error: 'Internal Server Error',
        message: 'Hello module service not found',
      };
      return;
    }
    
    // Call service
    const hellos = await helloService.getHellosByTenant(authReq.auth.tenantId);
    
    // Return success
    res.status = 200;
    res.body = {
      success: true,
      data: hellos,
    };
  } catch (error) {
    console.error('[v0] listHellos error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to list hellos',
    };
  }
}
