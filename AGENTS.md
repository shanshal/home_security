# Repository Guidelines

## Project Structure & Module Organization
- `src/` — application code
  - `components/` reusable UI (PascalCase files)
  - `pages/` route components wired via React Router
  - `lib/` small utilities (e.g., `api.js`, `store.js`)
  - `assets/` static JSON/Lottie and media
  - `index.css`, `i18n.js`, `main.jsx`, `App.jsx`
- `public/` — static assets served as‑is
- `dist/` — build output (ignored)
- Root config: `vite.config.js`, `eslint.config.js`, `tailwind.config.js`, `postcss.config.js`, `package.json`.

## Build, Test, and Development Commands
- `npm run dev` — start Vite dev server with HMR.
- `npm run build` — production build to `dist/`.
- `npm run preview` — serve the built app locally.
- `npm run lint` — lint JS/JSX using ESLint.

## Coding Style & Naming Conventions
- JavaScript (ES modules), React 19 + JSX; no TypeScript.
- Indentation: 2 spaces; semicolons optional (match existing files).
- Components: PascalCase (`Navbar.jsx`, `LockCard.jsx`). Non‑component helpers: camelCase (`api.js` exports `registerFingerprint`).
- Hooks follow `useX` naming; files live near usage or under `lib/`.
- Styling: Tailwind utility classes; prefer class names over inline styles. Keep components focused and composable.
- Use daisy UI when possible ask for the daisy component and the user will provide it 
- Linting: ESLint with `react-hooks` and Vite refresh rules; `no-unused-vars` is enforced (vars starting with `A-Z_` are ignored by rule config).
- Never add comments unless specified by user

## Testing Guidelines
- No test runner is configured yet. If adding tests, prefer Vitest + React Testing Library.
- Place tests alongside code as `*.test.jsx` (e.g., `components/Button.test.jsx`).
- Aim for critical path coverage (routing, API helpers, i18n toggles). Update this guide with the chosen commands.

## Commit & Pull Request Guidelines
- Use clear, imperative commits. Conventional Commits are welcome: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`.
- PRs should include: purpose/summary, linked issues, screenshots for UI changes, test plan, and any config/env notes.
- Keep diffs focused; avoid unrelated refactors. Ensure `npm run lint` passes and the app builds.
- Never mess with git let the user decide for that

## Security & Configuration Tips
- API base: `src/lib/api.js` uses `VITE_API_BASE` (default `/api`). Dev proxy is set in `vite.config.js` for `/api`.
- Use `.env.local` for secrets; only expose variables prefixed with `VITE_`.
- i18n: English/Arabic with RTL support; update `src/i18n.js` and translation keys when adding UI strings.

## API Fetching & Endpoints
- Centralize client calls in `src/lib/api.js`.
  - Build URLs with `getApiBase()` or `VITE_API_BASE` (defaults to `/api`).
  - Use the platform `fetch`; pass an `AbortSignal` when wiring to UI for cancelation.
  - Check `res.ok`; throw on errors with a helpful message and optionally include response text.
- Dev/prod routing
  - During development, calls to `/api/*` are proxied by Vite per `vite.config.js`.
  - In production, set `VITE_API_BASE` to your backend’s public base URL (e.g., `https://api.example.com`).
- Secrets & headers
  - Keep tokens in `.env.local` as `VITE_*` (e.g., `VITE_API_TOKEN`) and add them as `Authorization` headers in `src/lib/api.js` if needed.
- Naming & usage
  - Add new helpers with camelCase names (e.g., `fetchLocks`, `createDoor`, `listAccessLogs`).
  - Keep helpers small and focused on the request/response; map JSON in pages/components.

Example pattern

```js
// src/lib/api.js
const API_BASE = (import.meta?.env?.VITE_API_BASE || '/api').replace(/\/$/, '')

export async function fetchLocks({ signal } = {}) {
  const res = await fetch(`${API_BASE}/locks`, { signal })
  if (!res.ok) throw new Error(`Locks failed: ${res.status}`)
  return res.json()
}

export async function createDoor({ id, name, signal } = {}) {
  const res = await fetch(`${API_BASE}/doors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name }),
    signal,
  })
  if (!res.ok) throw new Error(`Create door failed: ${res.status}`)
  return res.json()
}
```

Notes
- Prefer `src/lib/securityStore.js` only for local/demo state. For real backends, fetch via `src/lib/api.js` and keep UI logic separated from storage.

## Security Page Implementation Notes
- Rooms/doors
  - Map rooms to `{ id: String(id), name, status }` where `status` comes from `state || status`.
  - Render doors directly from `doors` with stable `key={String(id)}`.
  - Sorted by id ascending (numeric if possible, otherwise natural string).
  - Single-door actions: `secUpdateRoom({ roomId, state: 'locked'|'unlocked' })` then refresh rooms.
  - Bulk actions: `Lock All` and `Unlock All` iterate all doors in parallel and refresh.
- Access rules
  - Form fields: user id (number), door id (select), optional window (`start`, `end`), and `all_time_access` checkbox.
  - When `all_time_access` is checked, send `{ all_time_access: true, from_hour: null, to_hour: null }` and disable time inputs.
  - Display “Anytime” when `always` is true or both times are empty.
- Logs
  - Endpoint: `GET {VITE_SECURITY_API_BASE||http://matching-api.yousified.xyz}/logs/` with `Accept: application/json`.
  - Parse arrays from root or from `logs|data|results`.
  - Map fields robustly: time (`datetime|date_time|timestamp|time|createdAt|created_at`), user (`user_id|userId|user|username|name`), room (`room_id|roomId|room|doorId`), action (`action|status|result`).
  - Show action text in the logs table.
- Add User
  - Simple input + button on Security page calling `secCreateUser({ name })`, with toasts on success/failure.

## Theme and DaisyUI
- DaisyUI themes configured in `src/index.css` plugin block: `light --default, dark --prefersdark, nord, dracula`.
- Navbar toggle switches between `nord` and `dracula` by setting `document.documentElement.dataset.theme` and persisting `localStorage['theme']`.

## Security API Base
- Security API helpers use `VITE_SECURITY_API_BASE` (default `http://matching-api.yousified.xyz`).
- For HTTPS deployments, avoid mixed content by setting `VITE_SECURITY_API_BASE` to an HTTPS origin or proxying via the app domain.
