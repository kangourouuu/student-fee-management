# Angular frontend instructions

These instructions apply below `frontend/`.

## Current platform

- The checked-in dependency and CLI major is Angular 19.
- The app uses `provideExperimentalZonelessChangeDetection`; do not add code that relies on Zone.js-triggered incidental refreshes.
- Prefer signals, `computed`, and immutable signal updates for local state.
- Preserve standalone application configuration and functional interceptors.

## Contracts and UI

- Keep API base URLs in `src/environments`.
- Send authenticated requests with `withCredentials: true` and consume the backend envelope before reading payload fields.
- Keep frontend models synchronized with backend DTOs; encrypted persistence fields are not client-visible.
- Treat attendance and billing dates as calendar dates, not browser-local timestamps.
- Reuse tokens and shared rules in `src/styles.css`.
- Preserve responsive behavior, keyboard access, focus states, semantic labels, and adequate contrast while maintaining the existing visual style.
- Keep component TypeScript, template, and SCSS changes aligned.

## Verification

- Install reproducibly with `npm ci --prefix frontend`.
- Build with `npm run build --prefix frontend`.
- Use browser control for interaction or visual checks when visible behavior changes.
- The project has no frontend test or lint script; do not invent one in reports.
