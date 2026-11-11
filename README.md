# Srikesh TR Portfolio

A Next.js portfolio with a Supabase-backed signature wall and Redis view counter.

## Project structure

- `frontend/`: Next.js app, pages, components, assets and API route entry points.
- `backend/api/`: Server-side API handlers used by the Next.js routes.
- `backend/lib/`: Server-only helpers for signature moderation.
- `backend/supabase/`: Signature wall database setup and migration SQL.

The backend is part of the same Next.js deployment, not a separate server.

## Development

Install dependencies and start the app from the repository root:

```bash
npm install
npm run dev
```

The local environment file lives at `frontend/.env.local`. See [signature wall setup](frontend/docs/signature-wall-setup.md) for the required variables and database setup.

## Deploying to Vercel

Set the project **Root Directory** to `frontend` and enable **Include source files outside of the Root Directory in the Build Step**, so Vercel can include `backend` and the workspace lockfile. Select the Next.js framework preset and configure the environment variables on Vercel. Deploy this repository as one project.

Keep **Skip unaffected projects** disabled so changes under `backend` also trigger a deployment.
