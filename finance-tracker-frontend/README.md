# Ledgerly frontend

A standalone React client for the Laravel finance tracker API.

## Requirements

- Node.js 22+
- The Laravel API running separately

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` to the API root, including `/api`:

```env
VITE_API_URL=http://localhost:8000/api
```

The dev server intentionally uses port `3000`, which is included in the API's default local CORS allowlist. For another frontend origin, configure the backend's `CORS_ALLOWED_ORIGINS` value as well.

## Commands

- `npm run dev` — start the Vite development server
- `npm run build` — type-check and build production assets
- `npm run typecheck` — run TypeScript checks only
- `npm run preview` — serve the production build locally
- `npm run lint` — run ESLint over the frontend source
- `npm run test` — run the Vitest component and unit tests
- `npm run test:watch` — run tests interactively

The client uses the API's bearer token returned by `/api/register` or `/api/login`. The API's `/api/logout` route revokes the current token. No token is displayed in the UI.
