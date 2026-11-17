# Plan

## Approach

Keep the starter's three webviews. Move each call to the IINA lifecycle event that actually accepts it, and send dashboard traffic across `iina.global` because the menu window and the player window are different objects. Prove the sequence with Vitest entry tests. The interactive Plannotator gate is unavailable here (`plannotator` is not installed); this plan is the contract the implementation follows.

## Steps

1. **Manifest and validator.** Touch `Info.json`, `info.schema.json`, `scripts/validate-info.mjs`, `scripts/fixtures/info/*`, `package.json`, both GitHub workflows. Rename `global` to `globalEntry`. Require `author`. Validate with Ajv. CI runs `pnpm run validate` before the build. Pin pnpm `10.33.4` via `packageManager`.
2. **Player entry.** Touch `src/index.ts`, `src/playlist.ts`, `src/pref-store.ts`, `src/preferences.ts`, `src/types.ts`, `tsconfig.entry.json`. Subscribe to events before any `loadFile`. Load pages on `iina.window-loaded` (and immediately when `core.window.loaded` is already true). Show the overlay on `iina.plugin-overlay-loaded`. Post status to overlay, sidebar, and `iina.global`. Post `playlist-update` from `playlist.list()`. Flush the 250ms time-pos throttle.
3. **Global entry.** Touch `src/global.ts`. Open the dashboard, bind `request-status` and `set-preference` after `loadFile`, remember players by the `onMessage` player argument (pass that string back unchanged), and forward `player-status` as `status-update`.
4. **Webviews.** Touch `src/ui/**`. Bridge preferences through `postMessage`. One `onMessage` registration per name. Overlay renders `customText` and hides when `enabled` is false. Dashboard shows Waiting. Sidebar seek commits on pointer up.
5. **Tests.** Replace `src/__mocks__/iina.ts` with an entry mock and a webview mock. Vitest 3 projects: node for `*.entry.test.ts`, jsdom for bridge and utils. `tsconfig.tests.json` is part of `pnpm run typecheck`.
6. **Docs.** Correct the skill, info spec, starter structure, README, CONTRIBUTING, and AGENTS so they describe `globalEntry`, `window-loaded`, `overlay.show`, the real menu API, and the PATH step for `iina-plugin`.
7. **Init and reload.** `scripts/init.mjs` refuses a non-TTY and migrates `global` to `globalEntry`. `scripts/dev-reload.mjs` prints the context-menu reload steps and does not call `osascript`.

## Verification

- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test`
- `pnpm run validate`
- `pnpm run build`
- `node scripts/init.mjs` with stdin closed exits 1
- `pnpm run dev:reload` exits 0 and does not mention a successful reload

## Risks

- `overlay.show` in the same turn as `loadFile` is a no-op because IINA sets `overlayViewLoaded` on a later main-queue turn. Tests must expect `show` only after `iina.plugin-overlay-loaded`.
- `iina.global.postMessage(null, ...)` does not reach ordinary player windows. Replies use the string player argument from `onMessage`.
- `iina.plugin-overlay-loaded` can also be emitted for another plugin's overlay. Re-apply `show` and listeners on every delivery after this plugin has called `loadFile`.
- Live IINA is not available on this machine. The tests lock the call order, not pixel output inside WKWebView.
