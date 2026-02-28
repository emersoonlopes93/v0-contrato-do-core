'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { SettingsSection, SettingsSectionCategory } from '@/src/tenant/settings/settings-registry';

type SettingsLayoutProps = {
  sections: SettingsSection[];
};

type CategoryGroup = {
  id: SettingsSectionCategory;
  label: string;
  sections: SettingsSection[];
};

const CATEGORY_LABELS: Record<SettingsSectionCategory, string> = {
  store: 'Loja',
  design: 'Design',
  delivery: 'Entrega',
  notifications: 'Notificações',
  system: 'Sistema',
  payments: 'Pagamentos',
  integrations: 'Integrações',
};

const CATEGORY_ORDER: SettingsSectionCategory[] = [
  'design',
  'delivery',
  'store',
  'notifications',
  'system',
  'payments',
  'integrations',
];

export function SettingsLayout({ sections }: SettingsLayoutProps) {
  const [search] = useState<string>('');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    sections.length > 0 ? sections[0]?.id ?? null : null,
  );

  const categoryGroups: CategoryGroup[] = useMemo(() => {
    const filtered = sections.filter((section) => {
      if (!search.trim()) {
        return true;
      }
      const query = search.toLowerCase();
      const inTitle = section.title.toLowerCase().includes(query);
      const inDescription =
        section.description !== undefined &&
        section.description.toLowerCase().includes(query);
      return inTitle || inDescription;
    });

    const byCategory = new Map<SettingsSectionCategory, SettingsSection[]>();

    for (const section of filtered) {
      const current = byCategory.get(section.category) ?? [];
      current.push(section);
      byCategory.set(section.category, current);
    }

    const orderIndex = new Map<SettingsSectionCategory, number>();
    CATEGORY_ORDER.forEach((category, index) => {
      orderIndex.set(category, index);
    });

    return Array.from(byCategory.entries())
      .map<CategoryGroup>(([id, items]) => ({
        id,
        label: CATEGORY_LABELS[id],
        sections: items,
      }))
      .sort((a, b) => {
        const aIndex = orderIndex.get(a.id) ?? CATEGORY_ORDER.length;
        const bIndex = orderIndex.get(b.id) ?? CATEGORY_ORDER.length;
        if (aIndex !== bIndex) {
          return aIndex - bIndex;
        }
        return a.label.localeCompare(b.label);
      });
  }, [sections, search]);

  const activeSection = useMemo(() => {
    if (!activeSectionId) {
      return null;
    }
    return sections.find((section) => section.id === activeSectionId) ?? null;
  }, [sections, activeSectionId]);

  const activeCategoryId: SettingsSectionCategory | null =
    activeSection?.category ?? (categoryGroups[0]?.id ?? null);

  if (categoryGroups.length === 0) {
    return (
      <div className="min-h-[320px] rounded-2xl border border-dashed border-border/60 bg-[#f9fafb] px-3 py-5 md:px-4 md:py-6">
        <div className="mx-auto max-w-3xl text-center space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Configurações
          </p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Nenhuma configuração disponível</h1>
          <p className="text-sm text-muted-foreground">
            Assim que módulos de configuração forem registrados, eles aparecerão aqui na central.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-theme(space.24))] bg-[#f9fafb]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4">
        <Card className="border-border/40 bg-white shadow-sm shadow-black/5 rounded-2xl">
         <CardContent className="space-y-2 p-4">
            <Tabs
              value={activeCategoryId ?? undefined}
              onValueChange={(categoryId) => {
                const group = categoryGroups.find(
                  (item) => item.id === categoryId,
                );
                const first = group?.sections[0];
                setActiveSectionId(first?.id ?? null);
              }}
            >
              <div className="overflow-x-auto">
                <TabsList className="flex w-full justify-start gap-1 rounded-xl bg-muted/40 p-1">
                  {categoryGroups.map((group) => (
                    <TabsTrigger
                      key={group.id}
                      value={group.id}
                      className="rounded-xl px-3 py-1.5 text-xs font-medium md:text-sm data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <span className="truncate">{group.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {categoryGroups.map((group) => (
                <TabsContent key={group.id} value={group.id} className="pt-3">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {group.sections.map((section) => {
                        const isActive = activeSectionId === section.id;
                        return (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => setActiveSectionId(section.id)}
                            className={cn(
                              'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium md:text-sm transition-colors',
                              isActive
                                ? 'border-primary/40 bg-primary/5 text-primary'
                                : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-accent/40 hover:text-accent-foreground',
                            )}
                          >
                            <span className="truncate">{section.title}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="min-h-[320px]">
                      {activeSection !== null && activeSection.category === group.id ? (
                        <div className="rounded-2xl border border-border/40 bg-white p-4 shadow-sm shadow-black/5">
                          <activeSection.component />
                        </div>

                      ) : (
                        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/40">
                          <p className="text-sm text-muted-foreground">
                            Nenhuma seção de configuração disponível para esta categoria.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
