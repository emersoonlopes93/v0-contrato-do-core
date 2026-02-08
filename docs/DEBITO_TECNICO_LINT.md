Débito técnico legado de lint (fora do escopo)

Crítico
- android/app/build/intermediates/assets/debug/mergeDebugAssets/native-bridge.js — rule @typescript-eslint/no-unused-vars não encontrada
- android/app/build/intermediates/assets/release/mergeReleaseAssets/native-bridge.js — rule @typescript-eslint/no-unused-vars não encontrada
- src/api/v1/tenant/menu-online.routes.ts — Prisma não usado
- src/modules/designer-menu/src/module.ts — "_" não usado
- src/saas-admin/pages/Dashboard.tsx — adminApi não usado
- src/saas-admin/pages/Dashboard.tsx — setError declarado e não usado

Médio
- src/realtime/realtime-context.tsx — dependência faltando em useEffect
- src/saas-admin/pages/Modules.tsx — dependência faltando em useCallback
- src/tenant/context/SessionContext.tsx — dependência faltando em useEffect
- src/tenant/context/SoundNotificationsContext.tsx — dependência faltando em useEffect
- src/tenant/hooks/useMenuUxMode.tsx — dependência faltando em useEffect
- src/tenant/pages/MenuOnlineProducts.tsx — dependência faltando em useEffect
- src/tenant/pages/TenantSettings.tsx — dependência faltando em useEffect

Baixo
- components/ui/button.tsx — react-refresh/only-export-components
- components/ui/form.tsx — react-refresh/only-export-components
- components/ui/navigation-menu.tsx — react-refresh/only-export-components
- components/ui/sidebar.tsx — react-refresh/only-export-components
- components/ui/toggle.tsx — react-refresh/only-export-components
- src/contexts/TenantContext.tsx — react-refresh/only-export-components
- src/tenant/components/ModuleGuard.tsx — react-refresh/only-export-components
- src/tenant/context/PlanContext.tsx — react-refresh/only-export-components
- src/tenant/context/SessionContext.tsx — react-refresh/only-export-components
- src/tenant/context/SoundNotificationsContext.tsx — react-refresh/only-export-components
- src/tenant/context/ThemeContext.tsx — react-refresh/only-export-components
- src/tenant/hooks/use-tenant-auth.tsx — react-refresh/only-export-components
