# Session Context & Module Guards

## Overview

This document describes the **Session Context** and **Module Guards** system for the Tenant App UI, implementing the hard contract requirements for runtime module activation checking.

---

## Session Context

**Location:** `/src/tenant/context/SessionContext.tsx`

### Responsibilities

1. **Authentication State** (token-based, opaque)
2. **Tenant Context** (from token)
3. **Active Modules** (fetched from API, runtime-based)
4. **Permissions** (opaque, NOT inferred)

### Contract Rules

- Token **ONLY authenticates**
- Modules **fetched from API** (not hardcoded)
- Permissions are **opaque strings** (no client-side logic)
- UI **reacts to module activation/deactivation at runtime**

### API

```typescript
interface SessionContextValue {
  // Auth
  user: SessionUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  
  // Tenant Context
  tenantId: string | null;
  
  // Modules (runtime, from API)
  activeModules: string[];
  moduleDetails: ActiveModule[];
  isModuleEnabled: (moduleId: string) => boolean;
  
  // Permissions (opaque)
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshModules: () => Promise<void>;
  
  // Loading
  isLoading: boolean;
  isRefreshing: boolean;
}
```

### Usage

```tsx
import { useSession } from '../context/SessionContext';

function MyComponent() {
  const { 
    user, 
    isModuleEnabled, 
    hasPermission,
    activeModules 
  } = useSession();

  if (!isModuleEnabled('hello-module')) {
    return <p>Module not available</p>;
  }

  return <div>Hello from {user?.email}</div>;
}
```

### Module Fetching Flow

1. **On Login:** `fetchModules()` called with access token + tenant ID
2. **API Call:** `GET /api/v1/tenant/modules`
3. **Response:** List of `ActiveModule[]` with status
4. **State Update:** `moduleDetails` updated
5. **Derived State:** `activeModules` = modules with `status: 'active'`

### Persistence

- **Session stored in localStorage** as `tenant_session`
- Contains: `user`, `accessToken`, `permissions`
- **Modules NOT persisted** (fetched on every session restore)
- **Reason:** Modules can change server-side between sessions

---

## Module Guards

**Location:** `/src/tenant/components/ModuleGuard.tsx`

### ModuleGuard Component

Route-level protection that verifies module is active for tenant.

```tsx
import { ModuleGuard } from '../components/ModuleGuard';

function HelloModulePage() {
  return (
    <ModuleGuard moduleId="hello-module">
      {/* Content only rendered if module is active */}
      <div>Hello Module Content</div>
    </ModuleGuard>
  );
}
```

### Rules

- **No hardcoded modules**
- Checks `activeModules` from SessionContext (fetched from API)
- **No assumptions** about module availability
- **Graceful degradation** with fallback UI

### Fallback Behavior

Default fallback shows:
- Alert icon
- "Module Not Available" message
- Module ID
- Link to contact admin
- Button to return home

Custom fallback:

```tsx
<ModuleGuard 
  moduleId="hello-module"
  fallback={<MyCustomFallback />}
>
  <Content />
</ModuleGuard>
```

### PermissionGuard Component

Opaque permission checking (no client-side logic).

```tsx
import { PermissionGuard } from '../components/ModuleGuard';

function AdminPanel() {
  return (
    <PermissionGuard permission="hello-module:write">
      <button>Delete Message</button>
    </PermissionGuard>
  );
}
```

**Rules:**
- Permissions are **opaque strings**
- **No inferring** permissions client-side
- Permissions come from **API** (in token/session)

---

## Integration with TenantLayout

**Location:** `/src/tenant/components/TenantLayout.tsx`

### Module-Aware Navigation

Navigation items are **dynamically rendered** based on active modules:

```tsx
export function TenantLayout({ children }) {
  const { user, isModuleEnabled } = useSession();

  const navItems: NavItem[] = [
    { label: 'Home', href: '/tenant', icon: <Home /> },
    { label: 'Perfil', href: '/tenant/profile', icon: <User /> },
  ];

  // Runtime check - module added only if active
  if (isModuleEnabled('hello-module')) {
    navItems.push({
      label: 'Hello',
      href: '/tenant/hello',
      icon: <MessageCircle />,
      moduleId: 'hello-module',
    });
  }

  return (
    <div>
      <nav>
        {navItems.map(item => (
          <a key={item.href} href={item.href}>{item.label}</a>
        ))}
      </nav>
      <main>{children}</main>
    </div>
  );
}
```

**Key Points:**
- Navigation **reacts to module activation/deactivation**
- **No hardcoded module routes**
- Safe to call `isModuleEnabled()` repeatedly (no network calls)

---

## Example: Hello Module Page

**Location:** `/src/tenant/pages/HelloModule.tsx`

```tsx
import { useSession } from '../context/SessionContext';
import { ModuleGuard } from '../components/ModuleGuard';

export function HelloModulePage() {
  const { user, accessToken } = useSession();

  // ... component logic

  return (
    <ModuleGuard moduleId="hello-module">
      <div className="space-y-6">
        <h1>Hello Module</h1>
        {/* Module content */}
      </div>
    </ModuleGuard>
  );
}
```

**Protection Layers:**
1. **Router-level:** Only renders page if user authenticated
2. **ModuleGuard:** Checks if `hello-module` is active
3. **API calls:** Use `accessToken` from session

---

## Mobile-First & Capacitor Compliance

### Design Principles

- **Touch targets:** Minimum 44px (iOS) / 48px (Material)
- **Bottom navigation:** Primary nav on mobile
- **Collapsible sidebar:** Desktop/tablet
- **No browser-only APIs:** No `document`, no `window.history` manipulation

### Session Persistence

- **localStorage** used for session storage
- **Capacitor-safe:** Works in native WebView
- **Fallback:** Session lost on app restart if storage unavailable

### Network Handling

- **Graceful degradation** if API unavailable
- **Loading states** for all async operations
- **Error messages** user-friendly

---

## Testing Module Activation/Deactivation

### Scenario 1: Module Initially Active

1. User logs in
2. Session fetches modules from API
3. `hello-module` returned with `status: 'active'`
4. Navigation shows "Hello" link
5. User can access `/tenant/hello`

### Scenario 2: Module Deactivated Mid-Session

1. User logged in with `hello-module` active
2. Admin deactivates module server-side
3. User clicks "Refresh" or navigates
4. Session calls `refreshModules()`
5. API returns `hello-module` with `status: 'inactive'`
6. Navigation **removes** "Hello" link
7. If user on `/tenant/hello`, ModuleGuard shows fallback

### Scenario 3: Module Never Active

1. User logs in
2. `hello-module` NOT in API response
3. Navigation **never shows** "Hello" link
4. Direct navigation to `/tenant/hello` shows fallback

---

## Contract Compliance

### HARD REQUIREMENTS ✅

- ✅ **Token only authenticates** (no permissions inferred)
- ✅ **Modules fetched from API** (not hardcoded)
- ✅ **Permissions opaque** (no client-side logic)
- ✅ **UI reacts to runtime changes** (refreshModules())
- ✅ **Graceful fallback** when module disabled
- ✅ **No assumptions** about module availability
- ✅ **Mobile-first** (touch targets, bottom nav)
- ✅ **Capacitor-ready** (no browser-specific APIs)

### FORBIDDEN ❌

- ❌ Hardcoding module routes
- ❌ Inferring permissions from token
- ❌ Assuming modules are available
- ❌ Business logic in UI
- ❌ Direct database access from UI

---

## Future Enhancements

### Real-Time Module Updates

Use WebSocket or polling to detect server-side module changes:

```tsx
useEffect(() => {
  const interval = setInterval(() => {
    refreshModules();
  }, 60000); // Poll every minute

  return () => clearInterval(interval);
}, [refreshModules]);
```

### Permission-Based UI Elements

```tsx
<PermissionGuard permission="hello-module:delete">
  <Button variant="destructive">Delete</Button>
</PermissionGuard>
```

### Module Loading Indicators

```tsx
const { isRefreshing } = useSession();

{isRefreshing && (
  <div className="rounded-lg border bg-blue-50 p-3 text-sm">
    Updating modules...
  </div>
)}
```

---

## Summary

The Session Context and Module Guards system provides:

1. **Runtime module checking** (not build-time)
2. **Graceful degradation** when modules disabled
3. **Opaque permissions** (no client-side inference)
4. **Mobile-first design** (Capacitor-ready)
5. **Contract compliance** (Core neutral, no business logic)

All module activation logic resides **server-side**. The UI simply **reacts** to what the API returns.
