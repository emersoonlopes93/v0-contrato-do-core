'use client';

import React, { useState } from "react"
import { useSession } from '../context/SessionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTenant } from '@/src/contexts/TenantContext';

type OperationType = 'delivery' | 'balcao' | 'mesa';

export function OnboardPage() {
  const { tenantSlug } = useTenant();
  const { user, tenantId, refreshSession } = useSession();
  const [step, setStep] = useState(1);
  const [restaurantName, setRestaurantName] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return null;
  }

  const toggleOperationType = (value: OperationType) => {
    setOperationTypes((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const goNext = () => {
    setStep((current) => Math.min(current + 1, 5));
  };

  const goBack = () => {
    setStep((current) => Math.max(current - 1, 1));
  };

  const handleComplete = async () => {
    setError('');
    setSaving(true);
    try {
      const response = await fetch('/api/v1/tenant/onboard/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify({
          restaurantName,
          openingHours,
          operationTypes,
          tenantId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(typeof data.error === 'string' ? data.error : 'Falha ao concluir onboarding');
        setSaving(false);
        return;
      }

      await refreshSession();
      window.location.replace(`/tenant/${tenantSlug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao concluir onboarding');
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Configuração inicial do restaurante</CardTitle>
          <CardDescription>Passo {step} de 5</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <Label htmlFor="restaurantName">Nome do restaurante</Label>
              <Input
                id="restaurantName"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Ex: Restaurante Central"
                className="h-11"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Label htmlFor="openingHours">Horários de funcionamento</Label>
              <Input
                id="openingHours"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="Ex: Seg a Dom, 11h às 23h"
                className="h-11"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Tipo de operação</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={operationTypes.includes('delivery') ? 'default' : 'outline'}
                  onClick={() => toggleOperationType('delivery')}
                >
                  Delivery
                </Button>
                <Button
                  type="button"
                  variant={operationTypes.includes('balcao') ? 'default' : 'outline'}
                  onClick={() => toggleOperationType('balcao')}
                >
                  Balcão
                </Button>
                <Button
                  type="button"
                  variant={operationTypes.includes('mesa') ? 'default' : 'outline'}
                  onClick={() => toggleOperationType('mesa')}
                >
                  Mesa
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2 text-sm">
              <p>Revise as informações antes de concluir:</p>
              <p>
                <span className="font-medium">Nome:</span> {restaurantName || 'Não informado'}
              </p>
              <p>
                <span className="font-medium">Horários:</span> {openingHours || 'Não informado'}
              </p>
              <p>
                <span className="font-medium">Operação:</span>{' '}
                {operationTypes.length > 0 ? operationTypes.join(', ') : 'Não informado'}
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-2 text-sm">
              <p>Onboarding concluído. Você será redirecionado para o sistema.</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" disabled={step === 1 || saving} onClick={goBack}>
              Voltar
            </Button>
            {step < 4 && (
              <Button type="button" disabled={saving} onClick={goNext}>
                Próximo
              </Button>
            )}
            {step === 4 && (
              <Button type="button" disabled={saving} onClick={handleComplete}>
                Concluir
              </Button>
            )}
            {step === 5 && (
              <Button type="button" disabled={saving} onClick={() => window.location.replace(`/tenant/${tenantSlug}`)}>
                Ir para o sistema
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
