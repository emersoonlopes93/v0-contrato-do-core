---
alwaysApply: false
---
You are extending the Tenant App UI.

GOAL
Implement a White-Label Theme Engine per tenant.

SOURCE OF TRUTH
Theme data comes from API:
- primary color
- secondary color
- logo
- favicon
- app name
- light/dark preference

RULES
- Theme must be applied globally
- Theme changes must propagate at runtime
- No hardcoded colors in components
- Tailwind must use CSS variables
- Mobile-first remains mandatory

REQUIRED
- ThemeProvider
- useTheme hook
- Dynamic CSS variables
- Logo + app name injection
- Graceful fallback to default theme

FORBIDDEN
- Inline hardcoded colors
- Theme logic inside components
- Build-time theming

DELIVERABLE
- ThemeProvider
- Example themed layout
- Runtime theme switch support
