# Page Setup preview outlines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give every Page Setup tab the same visible label-face edges as Layout.

**Architecture:** Reuse the existing Layout SVG face markup in `gui/modal-preview.js` for Page Setup. Keep faces outside the artwork clip and keep print-border properties unchanged.

**Tech Stack:** JavaScript, SVG, Node test runner, Electron.

**Spec:** `docs/superpowers/specs/2026-10-27-page-setup-outlines-design.md`

- [x] Add a failing regression in `test/page-setup.test.js` comparing all eight tabs across four shapes and both Print borders states.
- [x] Reuse Layout face outlines in the other Page Setup tabs. Retain the actual printed-border overlay when enabled so Border width still previews correctly.
- [x] Expand the Electron preview runtime to verify every tab and capture Page versus Layout; verify Print borders width/off as well.
- [x] Increment version, update Thai changelog, REA evidence and test checklist; run focused, Electron and whole basic checks. Final focused review: no findings. Whole basic: 1,250 passed, 0 failed/0 skipped, all legacy stages passed.
