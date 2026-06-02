---
name: project-ui-cleanup-may2026
description: Frontend cleanup pass - shadcn tables, dark mode, header, layout fixes
metadata:
  type: project
---

Done May 2026: removed test "Create Document" button from ReadyScreen, converted DataScreen raw tables to shadcn Table components, added useDarkMode hook + header with toggle, moved h1/h2 into @layer base so Tailwind can override, fixed --sans to use Inter Variable, reduced base font 18→16px, removed text-align:center from #root.

**Why:** UI was overly bare-bones, dark mode wasn't actually wired up (no .dark class applied), tables were unstyled HTML.

**How to apply:** The dark mode hook (useDarkMode.ts) reads localStorage + prefers-color-scheme and applies .dark to html element. CreatingScreen and SuccessScreen states are now unreachable (only used by deleted handleCreateDocument).
