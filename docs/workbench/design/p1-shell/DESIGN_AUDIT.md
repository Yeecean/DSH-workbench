# Native Desktop design audit

English | [中文](DESIGN_AUDIT.zh.md)

## Summary

This audit separates source observations from a visual inspection. An isolated native Desktop instance displayed its first-run welcome screen, which was visually inspected. Conversation, Terminal, Files, and settings were not visually inspected because access requires authentication or an API key.

## Source observations

The native layout keeps sidebar, keyed main panels, and a Session rightbar under AppFrame ([layout declarations](../../../../packages/client/ui-layout/src/client/index.ts#L59)). The rightbar hides Session views on global panels ([RightbarRoot](../../../../packages/client/ui-sidebar-right/src/client/shell/RightbarRoot.tsx#L34)); Workbench's proposed global Context is not an existing native view.

Theme ownership, actual token names, fonts, and settings are documented in the [theme system](THEME_SYSTEM_SPEC.md) and [token mapping](TOKEN_MAPPING.md). Source presence is not visual evidence for every light, dark, high-DPI, or accessibility state.

The [native welcome screenshot](exports/native-welcome.png) shows a dark opaque surface, the native product mark, and sign-in and API-key entry points. It does not establish how the working interface looks or whether its contrast satisfies accessibility requirements.

## Required visual follow-up

Inspect the actual Windows Desktop in light and dark appearances, including Conversation, Session rightbar, Terminal, Files, settings, and a narrow window. Record screenshots and compare readability, density, focus, and native controls before approving the final visual direction. Use an isolated test home and inspect the fixed development project path before any launcher preparation, as described in the [Desktop profile report](../../DESKTOP_PROFILE_FEASIBILITY.md).

## Dev Note

No model request or production UI modification was performed for this audit.
