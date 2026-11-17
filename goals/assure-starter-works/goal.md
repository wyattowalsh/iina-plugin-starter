# Assure the IINA starter works

Make the starter do what its manifest, preferences page, and quick start already promise. A built plugin loads its global entry, waits for the player window before loading webviews, shows the overlay, and delivers player status to the dashboard the menu opens. Preference text and the enable flag affect the HUD. `pnpm run validate` fails closed. Docs and the agent skill match `iina-plugin-definition` 0.99.3.

Shared understanding: [facts.md](facts.md).

Execution plan: [plan.md](plan.md).

## Done when

Every fact in `facts.md` holds on this branch. `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, `pnpm run validate`, and `pnpm run build` exit 0. CODEOWNERS, secret scanning, and Cursor MCP config stay out of scope. A live IINA.app is not required for the done condition.
