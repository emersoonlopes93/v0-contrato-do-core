import React from 'react';
import { usePlan } from '../context/PlanContext';
import { Progress } from '@/components/ui/progress';

export function PlanUsageIndicator() {
  const { plan, getLimit, isLoading } = usePlan();

  if (isLoading || !plan) return null;

  // Example limits to display
  const limitsToShow = [
    { key: 'users', label: 'Users' },
    { key: 'storage_mb', label: 'Storage (MB)' },
  ];

  return (
    <div className="space-y-4 px-2 py-4">
      <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {plan.name} Plan
      </div>
      {limitsToShow.map(({ key, label }) => {
        const limit = getLimit(key);
        // Mock current usage - in reality this would come from the context/API
        const current = key === 'users' ? 4 : 450; 
        
        if (limit === -1) return null; // Don't show unlimited

        const percentage = Math.min(100, (current / limit) * 100);

        return (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>{label}</span>
              <span className="text-muted-foreground">{current} / {limit}</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        );
      })}
    </div>
  );
}
