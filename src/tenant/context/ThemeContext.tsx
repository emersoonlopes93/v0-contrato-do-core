import React, { createContext, useContext, useEffect, useState } from 'react';
import { WhiteBrandConfig } from '@/src/core/types';
import { useSession } from '@/src/tenant/context/SessionContext';

const defaultTheme: WhiteBrandConfig = {
  tenantId: 'default' as unknown as WhiteBrandConfig['tenantId'],
  primaryColor: '0 0% 9%',
  secondaryColor: '0 0% 96.1%',
  logo: '/placeholder-logo.svg',
};

interface ThemeContextType {
  theme: WhiteBrandConfig;
  updateTheme: (newTheme: Partial<WhiteBrandConfig>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<WhiteBrandConfig>(defaultTheme);
  const { accessToken, user } = useSession();

  const updateTheme = (newTheme: Partial<WhiteBrandConfig>) => {
    setTheme((prev) => ({ ...prev, ...newTheme }));
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
        } | null;

        if (!data || !data.primaryColor || !data.secondaryColor || isCancelled) {
          return;
        }

        setTheme((prev) => {
          const primaryColor = data.primaryColor ?? prev.primaryColor;
          const secondaryColor = data.secondaryColor ?? prev.secondaryColor;
          const logo = data.logo ?? prev.logo;

          return {
            ...prev,
            tenantId: data.tenantId as unknown as WhiteBrandConfig['tenantId'],
            primaryColor,
            secondaryColor,
            logo,
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
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primaryColor);
    root.style.setProperty('--secondary', theme.secondaryColor);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
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
