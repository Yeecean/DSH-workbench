# DSH Workbench P1 — Isolated Design Deliverables Archive

This directory stores a self-contained, non-polluting copy of the DSH Workbench P1 Open Design deliverables so they are preserved in Git without modifying or mixing with product packages (`packages/*`, `apps/*`), build/test scripts (`scripts/*`), or pending workspace drafts (`docs/workbench/*`).

## Contents

- `open-design-project/dsh-workbench-p1-shell/` — Complete export of the editable Open Design project (`index.html`, `screens/01-home-context.html` through `screens/06-theme-import.html`, `assets/tokens.css`, `assets/theme-schema.json`, `README.md`, `DESIGN_COMPARISON.md`, artifact manifests, and 10 high-resolution `exports/od-*.png` screenshots).
  - Live Open Design local workspace directory: `C:/Users/Haoyang/AppData/Roaming/Open Design/namespaces/release-stable-win/data/projects/dsh-workbench-p1-shell`
- `workspace-design-index/` — Snapshot of the updated bilingual design index (`README.md` and `README.zh.md`) recording the Open Design project location, opening instructions, and exported screens.
- `scripts/export-od-screens.mjs` — Playwright/Edge headless export and reference viewport geometry check script (`1440×900`, `1280×800`, `1024px`, `768px`, `767px`) used to generate `exports/od-*.png`.

## Scope & Review Status

- Directions covered: Direction A (Native Continuation) vs. Direction B (Light Productized) side-by-side comparison.
- Core states covered: `Home + Context` (no active Session), `Conversation + Session` (opaque native Terminal/Files), `Conversation + Context` (single-track switch preserving Session logical state), narrow window (`767px`), `Appearance Settings` (controlled shell glass vs. opaque fallback), and versioned JSON `Theme Import` (preview, unsafe CSS/URL rejection, cancel, apply, rollback).
- Production code, Runtime, `ui-layout`, `ui-sidebar-right`, and Desktop launch flows were not modified. Pending user design approval (`D1`, `D1-A`, `D1-B`, `D2`, `D3`, `D4`).
