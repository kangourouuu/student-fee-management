---
name: change-student-fee-frontend
description: Implement, review, debug, or verify Angular frontend changes in the Student Fee Management repository, including standalone configuration, zoneless signal state, components, services, guards, interceptors, accessibility, responsive neumorphic styling, and backend API integration. Use for substantial work under frontend; do not use for backend-only or database-only tasks.
---

# Change the student fee frontend

## Prepare

1. Read the root and `frontend/AGENTS.md` files.
2. Inspect the component, service, model, environment, and route involved.
3. Read [references/contracts.md](references/contracts.md) for API and UI invariants.
4. Use the Angular major in `frontend/package.json`, not a future version mentioned only in prose.

## Implement

- Use signals and `computed` for local reactive state.
- Keep zoneless rendering explicit; do not depend on incidental Zone.js work.
- Preserve `withCredentials: true` for authenticated API calls.
- Check the API envelope before consuming payloads.
- Keep component TypeScript, HTML, and SCSS synchronized.
- Reuse global visual tokens and preserve accessibility and responsive behavior.
- Keep environment-specific URLs out of component code.

## Verify

1. Run `npm ci --prefix frontend` only when dependencies are unavailable or changed.
2. Run `npm run build --prefix frontend`.
3. For visible changes, run the app and use browser control to exercise the affected flow when feasible.
4. Do not report frontend tests or lint as passing: neither script currently exists.
