# DSH Workbench P1 — Open Design native project brief

English | [中文](README.zh.md)

## Project information

- **Project name**: `DSH Workbench P1 — Desktop Shell 与右栏仲裁` (desktop shell and right-rail arbitration)
- **Project ID**: `dsh-workbench-p1-shell`
- **Main entry file**: `index.html` (self-contained editable interactive prototype covering Direction A native continuation, Direction B light productization, the same-screen comparison matrix, and 8 core acceptance states)
- **Token and theme specification assets**: `assets/tokens.css`, `assets/theme-schema.json`
- **Paged editable artboards**: `screens/01-home-context.html` through `screens/06-theme-import.html`
- **Design direction comparison and pending decisions**: `DESIGN_COMPARISON.md`

## How to open the project in Open Design and keep editing

1. Start the local Open Design desktop client.
2. Select **DSH Workbench P1 — Desktop Shell 与右栏仲裁** (ID: `dsh-workbench-p1-shell`) in the project list.
3. Open `index.html` to interact with or edit the HTML/CSS/tokens directly on the canvas; the standalone state artboards under `screens/` can also be opened one by one.
4. A URL query parameter jumps straight to a specific review state:
   - `?preset=home-no-session&dir=native`: Direction A · Home + Context (no active Session)
   - `?preset=home-no-session&dir=product`: Direction B · Home + Context (no active Session)
   - `?preset=conv-session&dir=product`: Conversation + native Session right rail (Terminal + Files panes)
   - `?preset=conv-context&dir=product`: Conversation + Global Context (single-rail switch, Session logical state preserved)
   - `?preset=narrow-767&dir=product`: 767px narrow-window degradation with drawer and overlay presentation
   - `?preset=appearance&dir=product`: Appearance settings with glass versus opaque fallback comparison
   - `?preset=theme-import&dir=product`: Custom theme import preview, allowlist validation, and recovery flow

## Boundary statement

This project is a P1 design and interaction review asset. Every data set, path, session, and theme-import flow is an explicitly labeled design sample: production code is not modified, `root` and the native `rightbar` are not replaced, and no real model request is issued.
