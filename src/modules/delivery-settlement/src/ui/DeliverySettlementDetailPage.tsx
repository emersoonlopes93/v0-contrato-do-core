import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { DeliverySettlementDTO } from '@/src/types/delivery-settlement';
import { deliverySettlementProvider } from '../providers/deliverySettlementProvider';

export function DeliverySettlementDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [settlement, setSettlement] = useState<DeliverySettlementDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      loadSettlement();
    }
  }, [orderId]);

  const loadSettlement = async () => {
    if (!orderId) return;

    setLoading(true);
    setError(null);

    try {
      const tenantId = 'current-tenant-id';
      const data = await deliverySettlementProvider.getSettlementByOrderId(tenantId, orderId);
      
      if (!data) {
        setError('Repassse não encontrado');
      } else {
        setSettlement(data);
      }
    } catch (err) {
      setError('Erro ao carregar repasse');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (error || !settlement) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Repassse não encontrado'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Detalhes do Repasse</h1>
          <div className="text-sm text-gray-600">
            Pedido: {settlement.orderId}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Pedido</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">ID do Pedido:</span>
                <span className="font-medium">{settlement.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Data do Repasse:</span>
                <span className="font-medium">{formatDate(settlement.settledAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Distância:</span>
                <span className="font-medium">{settlement.distanceKm.toFixed(2)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxa de Entrega:</span>
                <span className="font-medium">{formatCurrency(settlement.deliveryFee)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Split Financeiro</h3>
            <div className="space-y-3">
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Entregador</span>
                  <span className="font-bold text-blue-600">{formatCurrency(settlement.driverAmount)}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {((settlement.driverAmount / settlement.deliveryFee) * 100).toFixed(1)}% do total
                </div>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Loja</span>
                  <span className="font-bold text-green-600">{formatCurrency(settlement.storeAmount)}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {((settlement.storeAmount / settlement.deliveryFee) * 100).toFixed(1)}% do total
                </div>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Plataforma</span>
                  <span className="font-bold text-purple-600">{formatCurrency(settlement.platformAmount)}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {((settlement.platformAmount / settlement.deliveryFee) * 100).toFixed(1)}% do total
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Resumo do Repasse</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(settlement.driverAmount)}</div>
              <div className="text-sm text-blue-700">Valor Entregador</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(settlement.storeAmount)}</div>
              <div className="text-sm text-green-700">Valor Loja</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(settlement.platformAmount)}</div>
              <div className="text-sm text-purple-700">Valor Plataforma</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-blue-900">Total do Repasse:</span>
              <span className="text-2xl font-bold text-blue-900">{formatCurrency(settlement.deliveryFee)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <div>ID do Repasse: {settlement.id}</div>
          <div>Criado em: {formatDate(settlement.createdAt)}</div>
          <div>Atualizado em: {formatDate(settlement.updatedAt)}</div>
        </div>
      </div>
    </div>
  );
}
