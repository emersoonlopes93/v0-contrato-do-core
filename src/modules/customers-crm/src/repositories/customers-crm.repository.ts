import type {
  CustomersCrmCustomerDetailsDTO,
  CustomersCrmCustomerDTO,
  CustomersCrmCustomerOrderSummaryDTO,
  CustomersCrmCustomerStatus,
  CustomersCrmListCustomersResponseDTO,
  CustomersCrmOverviewMetricsDTO,
  CustomersCrmUpdateCustomerRequest,
} from '@/src/types/customers-crm';
import { getPrismaClient } from '@/src/adapters/prisma/client';
import type { TotalAggregate } from '../types';

import { isRecord } from '@/src/core/utils/type-guards';

type SpendingSeriesRow = { date: string; total: number };

function parseSpendingSeriesRow(value: unknown): SpendingSeriesRow | null {
  if (!isRecord(value)) return null;
  const date = value.date;
  const total = value.total;
  if (typeof date !== 'string') return null;
  if (typeof total !== 'number' || Number.isNaN(total)) return null;
  return { date, total };
}

export class CustomersCrmRepository {
  private readonly prisma = getPrismaClient();

  async upsertCustomersByPhones(request: {
    tenantId: string;
    phones: string[];
    phoneToName: Record<string, string>;
  }): Promise<void> {
    const phones = request.phones.filter((p) => p.trim().length > 0);
    if (phones.length === 0) return;

    const existing = await this.prisma.customer.findMany({
      where: { tenant_id: request.tenantId, phone: { in: phones } },
      select: { phone: true },
    });

    const existingPhones = new Set(existing.map((c) => c.phone));
    const toCreate = phones
      .filter((p) => !existingPhones.has(p))
      .map((phone) => ({
        tenant_id: request.tenantId,
        name: request.phoneToName[phone] ?? phone,
        phone,
        email: null,
        notes: null,
        status: 'normal',
      }));

    if (toCreate.length === 0) return;

    await this.prisma.customer.createMany({
      data: toCreate,
      skipDuplicates: true,
    });
  }

  private toCustomerDTO(row: {
    id: string;
    tenant_id: string;
    name: string;
    phone: string | null;
    email: string | null;
    notes: string | null;
    status: string;
    created_at: Date;
    updated_at: Date;
  } & {
    totalOrders: number;
    totalSpent: number;
    averageTicket: number;
    lastOrderAt: Date | null;
    frequencyScore: number;
  }): CustomersCrmCustomerDTO {
    const status =
      row.status === 'vip' || row.status === 'bloqueado' || row.status === 'inativo'
        ? row.status
        : 'normal';

    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      notes: row.notes,
      status,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      totalOrders: row.totalOrders,
      totalSpent: row.totalSpent,
      averageTicket: row.averageTicket,
      lastOrderAt: row.lastOrderAt ? row.lastOrderAt.toISOString() : null,
      frequencyScore: row.frequencyScore,
    };
  }

  async listCustomers(request: {
    tenantId: string;
    page: number;
    pageSize: number;
    segment?: string | null;
    search?: string | null;
  }): Promise<CustomersCrmListCustomersResponseDTO> {
    const pageSize = Math.max(1, Math.min(100, request.pageSize));
    const page = Math.max(1, request.page);
    const skip = (page - 1) * pageSize;

    const now = new Date();
    const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const days60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const segment = request.segment ?? null;

    const whereBase: {
      tenant_id: string;
      customer_phone: { not: null };
      AND?: Array<Record<string, unknown>>;
    } = {
      tenant_id: request.tenantId,
      customer_phone: { not: null },
    };

    const andFilters: Array<Record<string, unknown>> = [];

    const search = request.search?.trim() ?? '';
    if (search.length > 0) {
      andFilters.push({
        OR: [
          { customer_phone: { contains: search, mode: 'insensitive' } },
          { customer_name: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (segment === 'last30d') {
      andFilters.push({ created_at: { gte: days30 } });
    }

    if (segment === 'inactive60d') {
      andFilters.push({ created_at: { lt: days60 } });
    }

    if (andFilters.length > 0) {
      whereBase.AND = andFilters;
    }

    const group = await this.prisma.order.groupBy({
      by: ['customer_phone'],
      where: whereBase,
      _count: { _all: true },
      _sum: { total: true },
      _avg: { total: true },
      _max: { created_at: true },
      orderBy: [{ _sum: { total: 'desc' } }],
      skip,
      take: pageSize,
    });

    const totalGroups = await this.prisma.order.groupBy({
      by: ['customer_phone'],
      where: whereBase,
      _count: { _all: true },
    });

    const totalItems = totalGroups.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    const phones = group
      .map((g) => g.customer_phone)
      .filter((p): p is string => typeof p === 'string' && p.trim().length > 0);

    if (phones.length === 0) {
      return {
        items: [],
        page,
        pageSize,
        totalItems,
        totalPages,
      };
    }

    const latestOrders = await this.prisma.order.findMany({
      where: {
        tenant_id: request.tenantId,
        customer_phone: { in: phones },
      },
      orderBy: { created_at: 'desc' },
      select: {
        customer_phone: true,
        customer_name: true,
      },
      take: Math.min(1000, phones.length * 5),
    });

    const phoneToName: Record<string, string> = {};
    for (const row of latestOrders) {
      const phone = row.customer_phone;
      if (!phone || phoneToName[phone]) continue;
      const name = row.customer_name?.trim();
      phoneToName[phone] = name && name.length > 0 ? name : phone;
    }

    await this.upsertCustomersByPhones({
      tenantId: request.tenantId,
      phones,
      phoneToName,
    });

    const customers = await this.prisma.customer.findMany({
      where: { tenant_id: request.tenantId, phone: { in: phones } },
      select: {
        id: true,
        tenant_id: true,
        name: true,
        phone: true,
        email: true,
        notes: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    const customerByPhone = new Map(
      customers
        .filter((c): c is typeof c & { phone: string } => typeof c.phone === 'string' && c.phone.trim().length > 0)
        .map((c) => [c.phone, c] as const)
    );

    const avgOverall = totalItems
      ? totalGroups.reduce((acc, g) => acc + ((g as TotalAggregate)._avg?.total ?? 0), 0) / totalItems
      : 0;

    const items = group
      .map((g) => {
        const phone = g.customer_phone;
        if (!phone) return null;
        const customer = customerByPhone.get(phone);
        if (!customer) return null;

        const totalOrders = g._count?._all ?? 0;
        const totalSpent = g._sum?.total ?? 0;
        const averageTicket = g._avg?.total ?? 0;
        const lastOrderAt = g._max?.created_at ?? null;

        const daysSinceLast = lastOrderAt
          ? Math.floor((now.getTime() - lastOrderAt.getTime()) / (24 * 60 * 60 * 1000))
          : 999;

        const frequencyScore = totalOrders * 10 - daysSinceLast;

        const badge: 'normal' | 'vip' | 'recorrente' | 'novo' =
          totalSpent > 1000
            ? 'vip'
            : totalOrders >= 5
              ? 'recorrente'
              : totalOrders <= 1
                ? 'novo'
                : 'normal';

        const status: CustomersCrmCustomerStatus =
          customer.status === 'vip' || customer.status === 'bloqueado' || customer.status === 'inativo'
            ? customer.status
            : 'normal';

        return {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          totalOrders,
          totalSpent,
          averageTicket,
          lastOrderAt: lastOrderAt ? lastOrderAt.toISOString() : null,
          badge,
          status,
          __internal: {
            frequencyScore,
            avgOverall,
          },
        };
      })
      .filter((i): i is NonNullable<typeof i> => i !== null);

    const filteredBySegment = (() => {
      if (segment === 'top10') {
        return items.slice(0, 10);
      }
      if (segment === 'avgAboveOverall') {
        return items.filter((i) => i.averageTicket > i.__internal.avgOverall);
      }
      return items;
    })();

    return {
      items: filteredBySegment.map((item) => {
        const { __internal, ...dto } = item;
        void __internal;
        return dto;
      }),
      page,
      pageSize,
      totalItems,
      totalPages,
    };
  }

  async getCustomerDetails(request: {
    tenantId: string;
    customerId: string;
  }): Promise<CustomersCrmCustomerDetailsDTO | null> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: request.customerId, tenant_id: request.tenantId },
      select: {
        id: true,
        tenant_id: true,
        name: true,
        phone: true,
        email: true,
        notes: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!customer) return null;
    if (!customer.phone) {
      return {
        customer: this.toCustomerDTO({
          ...customer,
          totalOrders: 0,
          totalSpent: 0,
          averageTicket: 0,
          lastOrderAt: null,
          frequencyScore: 0,
        }),
        recentOrders: [],
        spendingSeries: [],
      };
    }

    const agg = await this.prisma.order.aggregate({
      where: {
        tenant_id: request.tenantId,
        customer_phone: customer.phone,
      },
      _count: { _all: true },
      _sum: { total: true },
      _avg: { total: true },
      _max: { created_at: true },
    });

    const totalOrders = agg._count?._all ?? 0;
    const totalSpent = agg._sum?.total ?? 0;
    const averageTicket = agg._avg?.total ?? 0;
    const lastOrderAt = agg._max?.created_at ?? null;

    const now = new Date();
    const daysSinceLast = lastOrderAt
      ? Math.floor((now.getTime() - lastOrderAt.getTime()) / (24 * 60 * 60 * 1000))
      : 999;
    const frequencyScore = totalOrders * 10 - daysSinceLast;

    const customerDTO = this.toCustomerDTO({
      ...customer,
      totalOrders,
      totalSpent,
      averageTicket,
      lastOrderAt,
      frequencyScore,
    });

    const recentOrdersRows = await this.prisma.order.findMany({
      where: {
        tenant_id: request.tenantId,
        customer_phone: customer.phone,
      },
      orderBy: { created_at: 'desc' },
      take: 20,
      select: {
        id: true,
        order_number: true,
        status: true,
        total: true,
        created_at: true,
      },
    });

    const recentOrders: CustomersCrmCustomerOrderSummaryDTO[] = recentOrdersRows.map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      total: o.total,
      createdAt: o.created_at.toISOString(),
    }));

    const spendingSeriesRaw = await this.prisma.$queryRaw<unknown[]>`
      SELECT
        to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
        COALESCE(SUM(total), 0) AS total
      FROM order_manager_orders
      WHERE tenant_id = ${request.tenantId}
        AND customer_phone = ${customer.phone}
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1 ASC;
    `;

    const spendingSeries = spendingSeriesRaw
      .map(parseSpendingSeriesRow)
      .filter((row): row is SpendingSeriesRow => row !== null);

    return {
      customer: customerDTO,
      recentOrders,
      spendingSeries,
    };
  }

  async updateCustomer(request: {
    tenantId: string;
    customerId: string;
    input: CustomersCrmUpdateCustomerRequest;
  }): Promise<CustomersCrmCustomerDTO> {
    const existing = await this.prisma.customer.findFirst({
      where: { id: request.customerId, tenant_id: request.tenantId },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Cliente não encontrado');
    }

    const updated = await this.prisma.customer.update({
      where: { id: existing.id },
      data: {
        notes: request.input.notes === undefined ? undefined : request.input.notes,
        status: request.input.status === undefined ? undefined : request.input.status,
        name: request.input.name === undefined ? undefined : request.input.name,
        phone: request.input.phone === undefined ? undefined : request.input.phone,
        email: request.input.email === undefined ? undefined : request.input.email,
      },
      select: {
        id: true,
        tenant_id: true,
        name: true,
        phone: true,
        email: true,
        notes: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    const agg = await this.prisma.order.aggregate({
      where: {
        tenant_id: request.tenantId,
        customer_phone: updated.phone ?? undefined,
      },
      _count: { _all: true },
      _sum: { total: true },
      _avg: { total: true },
      _max: { created_at: true },
    });

    const totalOrders = agg._count?._all ?? 0;
    const totalSpent = agg._sum?.total ?? 0;
    const averageTicket = agg._avg?.total ?? 0;
    const lastOrderAt = agg._max?.created_at ?? null;

    const now = new Date();
    const daysSinceLast = lastOrderAt
      ? Math.floor((now.getTime() - lastOrderAt.getTime()) / (24 * 60 * 60 * 1000))
      : 999;
    const frequencyScore = totalOrders * 10 - daysSinceLast;

    return this.toCustomerDTO({
      ...updated,
      totalOrders,
      totalSpent,
      averageTicket,
      lastOrderAt,
      frequencyScore,
    });
  }

  async getOverviewMetrics(request: { tenantId: string }): Promise<CustomersCrmOverviewMetricsDTO> {
    const agg = await this.prisma.order.aggregate({
      where: {
        tenant_id: request.tenantId,
        customer_phone: { not: null },
      },
      _count: { _all: true },
      _sum: { total: true },
    });

    const customers = await this.prisma.order.groupBy({
      by: ['customer_phone'],
      where: {
        tenant_id: request.tenantId,
        customer_phone: { not: null },
      },
      _count: { _all: true },
    });

    const totalOrders = agg._count?._all ?? 0;
    const totalSpent = agg._sum?.total ?? 0;
    const averageTicket = totalOrders > 0 ? totalSpent / totalOrders : 0;

    return {
      customers: customers.length,
      totalOrders,
      totalSpent,
      averageTicket,
    };
  }
}
