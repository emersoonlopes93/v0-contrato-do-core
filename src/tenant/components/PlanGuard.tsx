import React from 'react';
import { usePlan } from '../context/PlanContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

interface PlanGuardProps {
  moduleId?: string;
  limitKey?: string;
  currentUsage?: number;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PlanGuard({ 
  moduleId, 
  limitKey, 
  currentUsage = 0, 
  fallback, 
  children 
}: PlanGuardProps) {
  const { hasModule, canPerformAction, isLoading } = usePlan();

  if (isLoading) {
    return null; // Or a skeleton
  }

  // 1. Check Module Access
  if (moduleId && !hasModule(moduleId)) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">Feature Not Available</h3>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          This feature is not included in your current plan. Upgrade to access it.
        </p>
        <Button variant="default">Upgrade Plan</Button>
      </div>
    );
  }

  // 2. Check Usage Limits
  if (limitKey && !canPerformAction(limitKey, currentUsage)) {
    if (fallback) return <>{fallback}</>;

    return (
      <Alert variant="destructive" className="my-4">
        <Lock className="h-4 w-4" />
        <AlertTitle>Limit Reached</AlertTitle>
        <AlertDescription>
          You have reached the usage limit for this feature ({limitKey}). Please upgrade your plan to continue.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
