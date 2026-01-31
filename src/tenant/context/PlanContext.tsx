import React, { createContext, useContext } from 'react';
import { useSession, SessionPlan } from './SessionContext';
import { unlimited } from '../../core/types';

interface PlanContextType {
  plan: SessionPlan | null;
  isLoading: boolean;
  hasModule: (moduleId: string) => boolean;
  getLimit: (key: string) => number | unlimited;
  canPerformAction: (limitKey: string, currentUsage: number, cost?: number) => boolean;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { plan, isModuleEnabled, isLoading } = useSession();

  const getLimit = (key: string): number | unlimited => {
    if (!plan) return 0;
    const limit = plan.limits[key];
    return limit === undefined ? 0 : limit;
  };

  const canPerformAction = (limitKey: string, currentUsage: number, cost: number = 1): boolean => {
    const limit = getLimit(limitKey);
    if (limit === -1) return true; // Unlimited
    return currentUsage + cost <= limit;
  };

  return (
    <PlanContext.Provider value={{ 
      plan, 
      isLoading, 
      hasModule: isModuleEnabled, 
      getLimit, 
      canPerformAction 
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}
