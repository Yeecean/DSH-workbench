# P1 Desktop design brief

English | [中文](DESIGN_BRIEF.zh.md)

## Summary

Design a calm, legible desktop workspace with a distinct Workbench identity, while retaining the native Conversation and Session tools. The design is a proposal for review and does not authorize production UI changes.

## Design directions

Explore the same Home, Conversation, Session rightbar, Context, appearance, import, and narrow-window states in two directions: A continues the native visual language; B adds a restrained Workbench identity while keeping native components recognizable. B is the initial exploration priority, not an approved final direction. Follow the upstream [brand guidelines](../../../../BRAND_GUIDELINES.md) and do not imply official endorsement.

## Visual principles

Use comfortable spacing where it improves scanning, and retain compact rows for files, Terminal, and technical output. Limit translucent materials to selected navigation, controls, or floating surfaces; long-form reading and dense content remain stable and opaque. Light and dark appearances, visible focus, reduced transparency, and an opaque fallback are part of the design.

## Scope and acceptance

Show Home with global Context, Conversation with the native Session rail, Conversation with Context, responsive concession, Appearance Settings, and theme import with validation, preview, cancellation, and recovery. The visual prototype may simulate these flows; it must label simulated data and not imply the product features already exist.

Review both directions for native compatibility, identification, density, readability, performance, accessibility, customization, and implementation cost. The [rightbar ADR](../../GLOBAL_RIGHTBAR_ADR.md) remains proposed; this design does not establish its runtime behavior.

## Dev Note

No production UI implementation is authorized by this brief.
