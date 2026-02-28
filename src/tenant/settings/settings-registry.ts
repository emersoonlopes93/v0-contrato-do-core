import type { ComponentType } from 'react';

export type SettingsSectionCategory =
  | 'store'
  | 'design'
  | 'delivery'
  | 'notifications'
  | 'system'
  | 'payments'
  | 'integrations';

export type SettingsSection = {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  category: SettingsSectionCategory;
  order?: number;
  component: ComponentType;
};

const sections: SettingsSection[] = [];
const sectionIds = new Set<string>();

export function registerSettingsSection(section: SettingsSection): void {
  if (sectionIds.has(section.id)) {
    return;
  }
  sectionIds.add(section.id);
  sections.push(section);
}

export function getSettingsSections(): SettingsSection[] {
  const seen = new Set<string>();
  const uniqueSections: SettingsSection[] = [];

  for (const section of sections) {
    if (seen.has(section.id)) {
      continue;
    }
    seen.add(section.id);
    uniqueSections.push(section);
  }

  return uniqueSections
    .slice()
    .sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.title.localeCompare(b.title);
    });
}

