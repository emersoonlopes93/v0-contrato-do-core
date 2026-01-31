---
alwaysApply: false
---
You are implementing the SaaS Billing and Plan Engine.

GOAL
Introduce plan enforcement without coupling business logic to the Core.

SOURCE OF TRUTH
Plans and limits come from Core PlanService.

RULES
- Core remains neutral
- No payment provider logic in Core
- Plan defines:
  - enabled modules
  - usage limits
  - feature flags

REQUIRED
- PlanContext (UI)
- Plan guards (API + UI)
- Graceful downgrade behavior
- Module activation must respect plan

FORBIDDEN
- Hardcoded limits
- UI deciding plan logic
- Module knowing pricing

DELIVERABLE
- Plan contracts
- Guards
- UI downgrade handling
