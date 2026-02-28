import React, { useState, useEffect } from 'react';
import type { DeliverySettlementSettingsDTO, DeliverySettlementSettingsCreateRequest } from '@/src/types/delivery-settlement';
import { deliverySettlementProvider } from '../providers/deliverySettlementProvider';
import { MaskedInput } from '@/src/shared/inputs/MaskedInput';

export function DeliverySettlementSettingsPage() {
  const [, setSettings] = useState<DeliverySettlementSettingsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<DeliverySettlementSettingsCreateRequest>({
    driverPercentage: 0,
    driverFixedPerKm: 0,
    driverMinimumAmount: 0,
    driverMaximumAmount: null,
    storePercentage: 0,
    platformPercentage: 0,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const tenantId = 'current-tenant-id';
      const data = await deliverySettlementProvider.getSettings(tenantId);
      
      if (data) {
        setSettings(data);
        setFormData({
          driverPercentage: data.driverPercentage,
          driverFixedPerKm: data.driverFixedPerKm,
          driverMinimumAmount: data.driverMinimumAmount,
          driverMaximumAmount: data.driverMaximumAmount,
          storePercentage: data.storePercentage,
          platformPercentage: data.platformPercentage,
        });
      }
    } catch (err) {
      void err;
      setError('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const tenantId = 'current-tenant-id';
      await deliverySettlementProvider.upsertSettings(tenantId, formData);
      await loadSettings();
    } catch (err) {
      void err;
      setError('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof DeliverySettlementSettingsCreateRequest, value: number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações de Repasse</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Porcentagem do Entregador (%)
              </label>
              <MaskedInput
                type="percent"
                value={formData.driverPercentage}
                onChange={(raw) => {
                  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
                  handleInputChange('driverPercentage', n);
                }}
                placeholder="0%"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Fixo por KM (R$)
              </label>
              <MaskedInput
                type="currency"
                value={Math.round(formData.driverFixedPerKm * 100)}
                onChange={(raw) => {
                  const cents = typeof raw === 'number' ? raw : Number(String(raw).replace(/\D/g, ''));
                  handleInputChange('driverFixedPerKm', Math.round(cents) / 100);
                }}
                placeholder="R$ 0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Mínimo do Entregador (R$)
              </label>
              <MaskedInput
                type="currency"
                value={Math.round(formData.driverMinimumAmount * 100)}
                onChange={(raw) => {
                  const cents = typeof raw === 'number' ? raw : Number(String(raw).replace(/\D/g, ''));
                  handleInputChange('driverMinimumAmount', Math.round(cents) / 100);
                }}
                placeholder="R$ 0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Máximo do Entregador (R$)
              </label>
              <MaskedInput
                type="currency"
                value={
                  formData.driverMaximumAmount == null ? '' : Math.round(formData.driverMaximumAmount * 100)
                }
                onChange={(raw) => {
                  const cents = typeof raw === 'number' ? raw : Number(String(raw).replace(/\D/g, ''));
                  handleInputChange(
                    'driverMaximumAmount',
                    String(cents).length === 0 ? null : Math.round(cents) / 100,
                  );
                }}
                placeholder="R$ 0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Porcentagem da Loja (%)
              </label>
              <MaskedInput
                type="percent"
                value={formData.storePercentage}
                onChange={(raw) => {
                  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
                  handleInputChange('storePercentage', n);
                }}
                placeholder="0%"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Porcentagem da Plataforma (%)
              </label>
              <MaskedInput
                type="percent"
                value={formData.platformPercentage}
                onChange={(raw) => {
                  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
                  handleInputChange('platformPercentage', n);
                }}
                placeholder="0%"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Regras de Cálculo</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Se valor fixo por KM &gt; 0: usa cálculo por distância</li>
              <li>• Senão: usa cálculo por porcentagem</li>
              <li>• Aplica valor mínimo e máximo do entregador</li>
              <li>• Loja recebe o valor restante</li>
              <li>• Split só ocorre quando pedido = ENTREGUE</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
