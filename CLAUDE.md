# CLAUDE.md

## Verification / Branching

Always verify fixes on the branch/environment the user is actually testing (typically main with hot-reload), not just the worktree branch. Confirm a change is merged before reporting it as fixed. Verify, don't assume — run the app/tests and observe the actual result before reporting something as working.

## Test Net

The two-layer test net is mandatory: fast vitest unit tests (`src/state/`, `src/components/**/*.test.js`) plus the jsdom app-boot smoke (`DashboardView` inside `GameStateProvider`), with the fitness guards in `src/fitness/` (ratcheting file-size budget + import boundaries). Run `npm run build` and `npm test` green before landing any change, and extend the net with new behavior — add or update a test when you add logic. When a refactor shrinks a budgeted file, ratchet its cap in `src/fitness/file-size-budget.test.js` down, never up.

## Scope / Working Style

Keep changes minimal and scoped to exactly what was requested. Do not create extra files, fix unrequested issues, or run long verification sessions without confirming the user wants them.

## UI / Styling Conventions

For styling/highlighting work, start simple (single accent, minimal coloring) and add complexity only on request — avoid chaotic multi-color schemes and overly broad keyword matching.

## Dev Server / Preview

Don't start your own `npm run dev` — Claude Code's preview owns this worktree's dev server (`.claude/launch.json`, `autoPort: true`), and each worktree gets its own port. A second server in the same worktree bumps the preview onto a phantom port and the panes diverge (the "stale dev server" gotcha). For verification, rely on the preview's already-running server; only start one if none is detected for this worktree.

## Versioning

Bump the patch version in `package.json` (`0.11.11` → `0.11.12`) as part of any change landing on `main` — this repo doesn't do minor/major semver bumps, just an incrementing patch counter per shipped change. Bump it in the same PR as the change (no need for a separate `chore: bump version` commit unless the change is otherwise unrelated to a landed PR).
