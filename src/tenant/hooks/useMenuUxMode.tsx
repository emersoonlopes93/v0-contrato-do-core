'use client';

import { useContext, useState, useEffect, useCallback } from 'react';
import { SessionContext } from '../context/SessionContext';

export type MenuUxMode = 'classic' | 'ifood';

/**
 * Hook para gerenciar o modo UX do menu cardápio
 * Por enquanto, usa localStorage para persistência
 * Futuramente pode integrar com sistema de feature flags
 */
export function useMenuUxMode(): {
  mode: MenuUxMode;
  setMode: (mode: MenuUxMode) => void;
  isIfoodMode: boolean;
} {
  const session = useContext(SessionContext);
  const tenantId = session?.tenantId;

  // Estado local para forçar re-renderização
  const [currentMode, setCurrentMode] = useState<MenuUxMode>('classic');

  // Obter modo do localStorage ou usar 'classic' como padrão
  const getStoredMode = useCallback((): MenuUxMode => {
    if (typeof window === 'undefined') return 'classic';
    
    const storageKey = tenantId ? `menu-ux-mode-${tenantId}` : 'menu-ux-mode';
    const stored = localStorage.getItem(storageKey);
    return stored === 'ifood' ? 'ifood' : 'classic';
  }, [tenantId]);

  const setStoredMode = useCallback((mode: MenuUxMode) => {
    if (typeof window === 'undefined') return;
    
    const storageKey = tenantId ? `menu-ux-mode-${tenantId}` : 'menu-ux-mode';
    localStorage.setItem(storageKey, mode);
  }, [tenantId]);

  // Sincronizar estado com localStorage na montagem e quando mudar
  useEffect(() => {
    const mode = getStoredMode();
    setCurrentMode(mode);
  }, [getStoredMode]);

  // Escutar mudanças no localStorage (entre abas/janelas)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === (tenantId ? `menu-ux-mode-${tenantId}` : 'menu-ux-mode')) {
        const newMode = e.newValue === 'ifood' ? 'ifood' : 'classic';
        setCurrentMode(newMode);
      }
    };

    // Escutar evento custom do nosso setMode
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.type === 'menu-ux-mode-changed') {
        setCurrentMode(customEvent.detail.mode);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('menu-ux-mode-changed', handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('menu-ux-mode-changed', handleCustomChange);
    };
  }, [tenantId]);

  const isIfoodMode = currentMode === 'ifood';

  const setMode = (newMode: MenuUxMode) => {
    setStoredMode(newMode);
    setCurrentMode(newMode);
    // Forçar re-renderização em outras abas
    window.dispatchEvent(new CustomEvent('menu-ux-mode-changed', { 
      detail: { mode: newMode } 
    }));
  };

  return {
    mode: currentMode,
    setMode,
    isIfoodMode,
  };
}
