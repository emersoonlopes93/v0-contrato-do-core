'use client';

import React from 'react';
import { withModuleGuard, PermissionGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { useDeliveryPricing } from '@/src/modules/delivery-pricing/src/hooks/useDeliveryPricing';
import { useDeliveryTracking } from '@/src/modules/delivery-tracking/src/hooks/useDeliveryTracking';
import type {
  DeliveryPricingRegionMultiplier,
  DeliveryPricingTimeMultiplier,
} from '@/src/types/delivery-pricing';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

type RegionState = {
  id: string;
  label: string;
  multiplier: string;
};

type TimeState = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  multiplier: string;
};

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function DeliveryPricingPageContent() {
  const { accessToken, hasPermission } = useSession();
  const { tenantSlug } = useTenant();
  const canWrite = hasPermission('delivery-pricing.write');
  const {
    settings,
    loading,
    error,
    preview,
    previewLoading,
    save,
    update,
    simulate,
    reload,
  } = useDeliveryPricing(accessToken);
  const tracking = useDeliveryTracking(tenantSlug, { accessToken });

  const [baseFee, setBaseFee] = React.useState('');
  const [pricePerKm, setPricePerKm] = React.useState('');
  const [freeKm, setFreeKm] = React.useState('');
  const [minFee, setMinFee] = React.useState('');
  const [maxFee, setMaxFee] = React.useState('');
  const [additionalPerMinute, setAdditionalPerMinute] = React.useState('');
  const [regionMultipliers, setRegionMultipliers] = React.useState<RegionState[]>([]);
  const [timeMultipliers, setTimeMultipliers] = React.useState<TimeState[]>([]);
  const [previewDistance, setPreviewDistance] = React.useState('');
  const [previewEta, setPreviewEta] = React.useState('');
  const [previewRegionId, setPreviewRegionId] = React.useState<string>('');
  const [previewTimeId, setPreviewTimeId] = React.useState<string>('');
  const [previewStopId, setPreviewStopId] = React.useState<string>('');

  React.useEffect(() => {
    if (!settings) return;
    setBaseFee(String(settings.baseFee));
    setPricePerKm(String(settings.pricePerKm));
    setFreeKm(settings.freeKm === null ? '' : String(settings.freeKm));
    setMinFee(String(settings.minFee));
    setMaxFee(String(settings.maxFee));
    setAdditionalPerMinute(settings.additionalPerMinute === null ? '' : String(settings.additionalPerMinute));
    setRegionMultipliers(
      settings.regionMultipliers.map((item) => ({
        id: item.id,
        label: item.label,
        multiplier: String(item.multiplier),
      })),
    );
    setTimeMultipliers(
      settings.timeMultipliers.map((item) => ({
        id: item.id,
        label: item.label,
        startTime: item.startTime,
        endTime: item.endTime,
        multiplier: String(item.multiplier),
      })),
    );
  }, [settings]);

  const buildRegionPayload = (): DeliveryPricingRegionMultiplier[] => {
    return regionMultipliers
      .filter((item) => item.label.trim() !== '' && item.multiplier.trim() !== '')
      .map((item) => ({
        id: item.id,
        label: item.label.trim(),
        multiplier: Number(item.multiplier),
      }));
  };

  const buildTimePayload = (): DeliveryPricingTimeMultiplier[] => {
    return timeMultipliers
      .filter((item) => item.label.trim() !== '' && item.multiplier.trim() !== '')
      .map((item) => ({
        id: item.id,
        label: item.label.trim(),
        startTime: item.startTime.trim(),
        endTime: item.endTime.trim(),
        multiplier: Number(item.multiplier),
      }));
  };

  const handleSave = async (): Promise<void> => {
    const base = toNumber(baseFee);
    const perKm = toNumber(pricePerKm);
    const min = toNumber(minFee);
    const max = toNumber(maxFee);
    const free = freeKm.trim() === '' ? null : toNumber(freeKm);
    const perMinute = additionalPerMinute.trim() === '' ? null : toNumber(additionalPerMinute);

    if (base === null || perKm === null || min === null || max === null) {
      toast({ title: 'Campos inválidos', description: 'Preencha os valores obrigatórios', variant: 'destructive' });
      return;
    }
    if (freeKm.trim() !== '' && free === null) {
      toast({ title: 'Campo inválido', description: 'Km grátis precisa ser numérico', variant: 'destructive' });
      return;
    }
    if (additionalPerMinute.trim() !== '' && perMinute === null) {
      toast({ title: 'Campo inválido', description: 'Adicional por tempo precisa ser numérico', variant: 'destructive' });
      return;
    }

    const payload = {
      baseFee: base,
      pricePerKm: perKm,
      freeKm: free,
      minFee: min,
      maxFee: max,
      additionalPerMinute: perMinute,
      regionMultipliers: buildRegionPayload(),
      timeMultipliers: buildTimePayload(),
    };

    try {
      if (settings) {
        await update(payload);
      } else {
        await save(payload);
      }
      toast({ title: 'Configuração salva' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Falha ao salvar configuração';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    }
  };

  const handlePreview = async (): Promise<void> => {
    const distance = toNumber(previewDistance);
    const eta = toNumber(previewEta);
    if (distance === null || eta === null) {
      toast({ title: 'Simulação inválida', description: 'Informe distância e ETA válidos', variant: 'destructive' });
      return;
    }
    try {
      await simulate({
        distanceKm: distance,
        etaMinutes: eta,
        regionMultiplierId: previewRegionId || null,
        timeMultiplierId: previewTimeId || null,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Falha ao simular taxa';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    }
  };

  const trackingStops = React.useMemo(() => {
    const routes = tracking.snapshot?.routes ?? [];
    return routes.flatMap((route) =>
      route.stops
        .filter((stop) => stop.distanceKm !== null && stop.etaMinutes !== null)
        .map((stop) => ({
          id: `${route.routeId}:${stop.orderId}`,
          label: `${route.name} • ${stop.label ?? stop.orderId}`,
          distanceKm: stop.distanceKm ?? 0,
          etaMinutes: stop.etaMinutes ?? 0,
        })),
    );
  }, [tracking.snapshot]);

  if (!accessToken) return null;

  return (
    <PermissionGuard permission="delivery-pricing.read">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Precificação de Entrega</h1>
          <p className="text-muted-foreground">Configuração de taxa automática por KM e regras dinâmicas</p>
        </div>

        <Alert>
          <AlertDescription>Baseado na Google Distance Matrix</AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => void reload()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Configuração</CardTitle>
              <CardDescription>Regras aplicadas automaticamente em entregas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Taxa base</Label>
                  <Input value={baseFee} onChange={(e) => setBaseFee(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Valor por KM</Label>
                  <Input value={pricePerKm} onChange={(e) => setPricePerKm(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>KM grátis</Label>
                  <Input value={freeKm} onChange={(e) => setFreeKm(e.target.value)} placeholder="Opcional" />
                </div>
                <div className="space-y-2">
                  <Label>Adicional por tempo (min)</Label>
                  <Input
                    value={additionalPerMinute}
                    onChange={(e) => setAdditionalPerMinute(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Taxa mínima</Label>
                  <Input value={minFee} onChange={(e) => setMinFee(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Taxa máxima</Label>
                  <Input value={maxFee} onChange={(e) => setMaxFee(e.target.value)} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Multiplicadores por região</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRegionMultipliers((prev) => [
                        ...prev,
                        { id: generateId('region'), label: '', multiplier: '' },
                      ])
                    }
                    disabled={!canWrite}
                  >
                    Adicionar
                  </Button>
                </div>
                {regionMultipliers.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhum multiplicador configurado.</div>
                ) : (
                  <div className="space-y-3">
                    {regionMultipliers.map((item, index) => (
                      <div key={item.id} className="grid gap-3 md:grid-cols-[1.2fr_0.6fr_auto]">
                        <Input
                          value={item.label}
                          onChange={(e) =>
                            setRegionMultipliers((prev) =>
                              prev.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, label: e.target.value } : row,
                              ),
                            )
                          }
                          placeholder="Região"
                        />
                        <Input
                          value={item.multiplier}
                          onChange={(e) =>
                            setRegionMultipliers((prev) =>
                              prev.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, multiplier: e.target.value } : row,
                              ),
                            )
                          }
                          placeholder="Multiplicador"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setRegionMultipliers((prev) => prev.filter((row) => row.id !== item.id))
                          }
                          disabled={!canWrite}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Multiplicadores por horário</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setTimeMultipliers((prev) => [
                        ...prev,
                        { id: generateId('time'), label: '', startTime: '', endTime: '', multiplier: '' },
                      ])
                    }
                    disabled={!canWrite}
                  >
                    Adicionar
                  </Button>
                </div>
                {timeMultipliers.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhum multiplicador configurado.</div>
                ) : (
                  <div className="space-y-3">
                    {timeMultipliers.map((item, index) => (
                      <div key={item.id} className="grid gap-3 md:grid-cols-[1fr_0.6fr_0.6fr_0.6fr_auto]">
                        <Input
                          value={item.label}
                          onChange={(e) =>
                            setTimeMultipliers((prev) =>
                              prev.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, label: e.target.value } : row,
                              ),
                            )
                          }
                          placeholder="Faixa"
                        />
                        <Input
                          value={item.startTime}
                          onChange={(e) =>
                            setTimeMultipliers((prev) =>
                              prev.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, startTime: e.target.value } : row,
                              ),
                            )
                          }
                          placeholder="Início"
                        />
                        <Input
                          value={item.endTime}
                          onChange={(e) =>
                            setTimeMultipliers((prev) =>
                              prev.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, endTime: e.target.value } : row,
                              ),
                            )
                          }
                          placeholder="Fim"
                        />
                        <Input
                          value={item.multiplier}
                          onChange={(e) =>
                            setTimeMultipliers((prev) =>
                              prev.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, multiplier: e.target.value } : row,
                              ),
                            )
                          }
                          placeholder="Multiplicador"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setTimeMultipliers((prev) => prev.filter((row) => row.id !== item.id))
                          }
                          disabled={!canWrite}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={() => void handleSave()} disabled={!canWrite || loading}>
                {loading ? 'Salvando...' : 'Salvar configuração'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview da taxa</CardTitle>
              <CardDescription>Simule com distância e ETA reais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Distância (KM)</Label>
                  <Input value={previewDistance} onChange={(e) => setPreviewDistance(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>ETA (min)</Label>
                  <Input value={previewEta} onChange={(e) => setPreviewEta(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Parada da rota</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={previewStopId}
                    onChange={(e) => {
                      const next = e.target.value;
                      setPreviewStopId(next);
                      const selected = trackingStops.find((stop) => stop.id === next);
                      if (selected) {
                        setPreviewDistance(String(selected.distanceKm));
                        setPreviewEta(String(selected.etaMinutes));
                      }
                    }}
                  >
                    <option value="">Selecionar parada</option>
                    {trackingStops.map((stop) => (
                      <option key={stop.id} value={stop.id}>
                        {stop.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Região</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={previewRegionId}
                    onChange={(e) => setPreviewRegionId(e.target.value)}
                  >
                    <option value="">Sem multiplicador</option>
                    {regionMultipliers.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label || 'Sem nome'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={previewTimeId}
                    onChange={(e) => setPreviewTimeId(e.target.value)}
                  >
                    <option value="">Sem multiplicador</option>
                    {timeMultipliers.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label || 'Sem nome'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button variant="secondary" onClick={() => void handlePreview()} disabled={previewLoading}>
                {previewLoading ? 'Calculando...' : 'Simular taxa'}
              </Button>

              {preview && (
                <div className="space-y-2 rounded-lg border p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Taxa base</span>
                    <span>{preview.baseFee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>KM</span>
                    <span>{preview.distanceFee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tempo</span>
                    <span>{preview.timeFee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Multiplicador região</span>
                    <span>{preview.regionMultiplier.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Multiplicador horário</span>
                    <span>{preview.timeMultiplier.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2 font-medium">
                    <span>Total</span>
                    <span>{preview.totalFee.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
}

export const DeliveryPricingPage = withModuleGuard(DeliveryPricingPageContent, 'delivery-pricing');
