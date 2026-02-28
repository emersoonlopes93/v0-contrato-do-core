'use client';

import React from 'react';
import { withModuleGuard } from '@/src/tenant/components/ModuleGuard';
import { SettingsLayout } from '@/src/tenant/settings/settings-layout';
import { getSettingsSections } from '@/src/tenant/settings/settings-registry';

function SettingsHubPageContent() {
  const sections = getSettingsSections();
  return <SettingsLayout sections={sections} />;
}

export const SettingsHubPage = withModuleGuard(SettingsHubPageContent, 'settings');

