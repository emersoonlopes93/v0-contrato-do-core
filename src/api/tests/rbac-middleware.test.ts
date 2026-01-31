import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireModule, requirePermission, type AuthenticatedRequest } from '../rbac-middleware';
import type { Response, NextFunction } from '../middleware';

// Mock Response
const mockResponse = () => {
  const res: Partial<Response> = {
    status: 0,
    body: {},
  };
  return res as Response;
};

// Mock Next
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  describe('requireModule', () => {
    it('should allow access when module is active', async () => {
      const req = {
        auth: {
          tenantId: 'tenant-1',
          userId: 'user-1',
          activeModules: ['hello-module', 'other-module']
        }
      } as unknown as AuthenticatedRequest;
      
      const res = mockResponse();
      
      const middleware = requireModule('hello-module');
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).toBe(0); // Not modified
    });

    it('should deny access when module is NOT active', async () => {
      const req = {
        auth: {
          tenantId: 'tenant-1',
          userId: 'user-1',
          activeModules: ['other-module']
        }
      } as unknown as AuthenticatedRequest;
      
      const res = mockResponse();
      
      const middleware = requireModule('hello-module');
      await middleware(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toBe(403);
      expect(res.body).toEqual(expect.objectContaining({
        code: 'MODULE_NOT_ACTIVE'
      }));
    });

    it('should deny access when auth is missing', async () => {
      const req = {} as AuthenticatedRequest;
      const res = mockResponse();
      
      const middleware = requireModule('hello-module');
      await middleware(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toBe(401);
    });
  });

  describe('requirePermission', () => {
    it('should allow access when user has permission', async () => {
      const req = {
        auth: {
          tenantId: 'tenant-1',
          userId: 'user-1',
          permissions: ['hello.create']
        }
      } as unknown as AuthenticatedRequest;
      
      const res = mockResponse();
      
      const middleware = requirePermission('hello.create');
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should deny access when user lacks permission', async () => {
      const req = {
        auth: {
          tenantId: 'tenant-1',
          userId: 'user-1',
          permissions: ['hello.read']
        }
      } as unknown as AuthenticatedRequest;
      
      const res = mockResponse();
      
      const middleware = requirePermission('hello.create');
      await middleware(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toBe(403);
      expect(res.body).toEqual(expect.objectContaining({
        code: 'INSUFFICIENT_PERMISSIONS'
      }));
    });
  });
