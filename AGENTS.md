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
- Linting: ESLint with `react-hooks` and Vite refresh rules; `no-unused-vars` is enforced (vars starting with `A-Z_` are ignored by rule config).

## Testing Guidelines
- No test runner is configured yet. If adding tests, prefer Vitest + React Testing Library.
- Place tests alongside code as `*.test.jsx` (e.g., `components/Button.test.jsx`).
- Aim for critical path coverage (routing, API helpers, i18n toggles). Update this guide with the chosen commands.

## Commit & Pull Request Guidelines
- Use clear, imperative commits. Conventional Commits are welcome: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`.
- PRs should include: purpose/summary, linked issues, screenshots for UI changes, test plan, and any config/env notes.
- Keep diffs focused; avoid unrelated refactors. Ensure `npm run lint` passes and the app builds.

## Security & Configuration Tips
- API base: `src/lib/api.js` uses `VITE_API_BASE` (default `/api`). Dev proxy is set in `vite.config.js` for `/api`.
- Use `.env.local` for secrets; only expose variables prefixed with `VITE_`.
- i18n: English/Arabic with RTL support; update `src/i18n.js` and translation keys when adding UI strings.
