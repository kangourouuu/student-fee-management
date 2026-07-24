# Frontend contracts

## Current runtime

- Angular dependencies and CLI: major 19
- Change detection: `provideExperimentalZonelessChangeDetection`
- State: Angular signals and computed values
- HTTP: functional auth interceptor plus credentialed service calls

## Stable behavior

- API URLs come from `src/environments`.
- Backend responses use `status` and `response`.
- JWT authentication is cookie-based; never persist tokens in browser storage.
- Attendance and billing inputs represent calendar dates.
- Shared neumorphic/claymorphic styling starts in `src/styles.css`.

## Validation commands

```text
npm ci --prefix frontend
npm run build --prefix frontend
npm start --prefix frontend
```

There is no checked-in frontend test or lint script.
