import React, { createContext, useContext, useEffect, useState } from 'react';
import { WhiteBrandConfig } from '@/src/core/types';
import { useSession } from '@/src/tenant/context/SessionContext';
import { getContrastRatioFromHsl, parseHslTriplet } from '@/lib/color';

const defaultTheme: WhiteBrandConfig = {
  tenantId: 'default' as unknown as WhiteBrandConfig['tenantId'],
  primaryColor: '217 91% 60%',
  secondaryColor: '210 40% 96%',
  backgroundColor: '0 0% 100%',
  logo: '/placeholder-logo.svg',
  theme: 'light',
};

interface ThemeContextType {
  theme: WhiteBrandConfig;
  updateTheme: (newTheme: Partial<WhiteBrandConfig>) => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_LIGHT_BACKGROUND = '0 0% 100%';
const DEFAULT_DARK_BACKGROUND = '222 47% 11%';
const DEFAULT_LIGHT_PRIMARY_FG = '0 0% 100%';
const DEFAULT_DARK_PRIMARY_FG = '222 47% 11%';

function pickSafeBackground(mode: 'light' | 'dark', candidate: string | undefined): string {
  const trimmed = typeof candidate === 'string' ? candidate.trim() : '';
  const parsed = trimmed ? parseHslTriplet(trimmed) : null;

  if (mode === 'dark') {
    if (parsed && parsed.l <= 35) return trimmed;
    return DEFAULT_DARK_BACKGROUND;
  }

  if (parsed && parsed.l >= 75) return trimmed;
  return DEFAULT_LIGHT_BACKGROUND;
}

function pickBestForeground(primary: string): string | null {
  const primaryHsl = parseHslTriplet(primary);
  if (!primaryHsl) return null;

  const lightFg = parseHslTriplet(DEFAULT_LIGHT_PRIMARY_FG);
  const darkFg = parseHslTriplet(DEFAULT_DARK_PRIMARY_FG);
  if (!lightFg || !darkFg) return null;

  const contrastLight = getContrastRatioFromHsl(primaryHsl, lightFg);
  const contrastDark = getContrastRatioFromHsl(primaryHsl, darkFg);

  return contrastLight >= contrastDark ? DEFAULT_LIGHT_PRIMARY_FG : DEFAULT_DARK_PRIMARY_FG;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<WhiteBrandConfig>(defaultTheme);
  const { accessToken, user } = useSession();

  const applyThemeToDOM = (themeConfig: WhiteBrandConfig) => {
    const root = document.documentElement;
    
    // Aplicar tema no DOM - garantir que sempre exista um tema ativo
    const currentTheme = themeConfig.theme === 'dark' ? 'dark' : 'light';
    
    // Remover qualquer classe de tema existente
    root.classList.remove('light', 'dark');
    
    // Aplicar apenas a classe do tema atual
    root.classList.add(currentTheme);
    
    root.style.removeProperty('--tenant-primary');
    root.style.removeProperty('--tenant-primary-foreground');
    root.style.removeProperty('--tenant-secondary');
    root.style.removeProperty('--tenant-background');
    root.style.removeProperty('--tenant-ring');
    root.style.removeProperty('--switch-on-bg');
    root.style.removeProperty('--switch-off-bg');
    root.style.removeProperty('--switch-disabled-bg');
    root.style.removeProperty('--switch-thumb-bg');
    root.style.removeProperty('--switch-border');

    const backgroundCandidate = pickSafeBackground(currentTheme, themeConfig.backgroundColor);
    root.style.setProperty('--tenant-background', backgroundCandidate);

    const primaryHsl = parseHslTriplet(themeConfig.primaryColor);
    const bgHsl = parseHslTriplet(backgroundCandidate);

    const inferredPrimaryForeground = pickBestForeground(themeConfig.primaryColor);

    const primaryFgHsl = inferredPrimaryForeground
      ? parseHslTriplet(inferredPrimaryForeground)
      : null;

    if (
      primaryHsl &&
      bgHsl &&
      primaryFgHsl &&
      primaryHsl.l <= 65 &&
      getContrastRatioFromHsl(primaryHsl, primaryFgHsl) >= 4.5 &&
      getContrastRatioFromHsl(primaryHsl, bgHsl) >= 4.5 &&
      inferredPrimaryForeground
    ) {
      root.style.setProperty('--tenant-primary', themeConfig.primaryColor);
      root.style.setProperty('--tenant-primary-foreground', inferredPrimaryForeground);
      root.style.setProperty('--tenant-ring', themeConfig.primaryColor);
    }

    if (parseHslTriplet(themeConfig.secondaryColor)) {
      root.style.setProperty('--tenant-secondary', themeConfig.secondaryColor);
    }
  };

  useEffect(() => {
    applyThemeToDOM(defaultTheme);
  }, []);

  const updateTheme = (newTheme: Partial<WhiteBrandConfig>) => {
    setTheme((prev) => {
      const updatedTheme = { ...prev, ...newTheme };
      // Aplicar o tema atualizado no DOM
      applyThemeToDOM(updatedTheme);
      return updatedTheme;
    });
  };

  const setThemeMode = (mode: 'light' | 'dark') => {
    updateTheme({ theme: mode });
  };

  useEffect(() => {
    if (!user || !accessToken) {
      return;
    }

    let isCancelled = false;

    const loadTheme = async () => {
      try {
        const response = await fetch('/api/v1/tenant/white-label', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const json: unknown = await response.json();
        if (!json || typeof json !== 'object' || !('data' in json)) {
          return;
        }

        const result = json as { data: unknown };
        if (!result.data || typeof result.data !== 'object') {
          return;
        }

        const data = result.data as {
          tenantId?: string;
          logo?: string;
          primaryColor?: string;
          secondaryColor?: string;
          theme?: 'light' | 'dark';
          backgroundColor?: string;
        } | null;

        if (!data || !data.primaryColor || !data.secondaryColor || isCancelled) {
          return;
        }

        setTheme((prev) => {
          const primaryColor = data.primaryColor ?? prev.primaryColor;
          const secondaryColor = data.secondaryColor ?? prev.secondaryColor;
          const logo = data.logo ?? prev.logo;
          const theme = data.theme ?? prev.theme;
          const backgroundColor = data.backgroundColor ?? prev.backgroundColor;

          return {
            ...prev,
            tenantId: data.tenantId as unknown as WhiteBrandConfig['tenantId'],
            primaryColor,
            secondaryColor,
            logo,
            theme,
            backgroundColor,
          };
        });
      } catch (error) {
        console.error('[Theme] Failed to load tenant white-label', error);
      }
    };

    void loadTheme();

    return () => {
      isCancelled = true;
    };
  }, [user, accessToken]);

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
