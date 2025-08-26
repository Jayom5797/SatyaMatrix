# SatyaMatrix

A full‑stack misinformation detection and community verification app.

- Frontend: React + Vite (`main/frontend/`)
- Backend: Express + Supabase (`main/backend/`)
- Storage/Auth/DB: Supabase

## Features
- Trending feed of community‑reported items with reliability score.
- Upvotes/Downvotes per report (`report_votes`).
- Admin login (email/password via Supabase) with per‑card Delete.
- Image uploads to Supabase Storage; deletes cascade to storage when report is removed.

## Project Structure
```
main/
  frontend/           # React app (Vite)
  backend/            # Express API
  package.json        # root workspace runner (concurrently)
```

## Prerequisites
- Node.js 18+
- Supabase project with tables/bucket from `main/backend/schema.sql`

## Environment Variables

Frontend (`main/frontend/.env`):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

VITE_API_BASE=http://localhost:5050
```

Backend (`main/backend/.env`):
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # keep private

ADMIN_EMAILS=admin1@example.com,admin2@example.com

STORAGE_BUCKET=reports-media

PORT=5050
```

## Install & Run (one terminal)
From `main/`:
```
npm install
npm run dev
```
- Starts backend at `http://localhost:5050` and frontend at Vite port (e.g., `5173`).
- Root `package.json` uses npm workspaces and `concurrently`.
  - If your npm < 7, switch to `--prefix` scripts or update npm.

## Admin Setup
SatyaMatrix protects destructive actions (delete) with server‑side admin checks in `backend/src/routes/reports.js`:
- Accepts users whose Supabase JWT contains `app_metadata.role === 'admin'` or includes `"admin"` in `app_metadata.roles`.
- Or users with email in `ADMIN_EMAILS`.

Mark users as admin (SQL in Supabase SQL Editor):
```sql
-- Role as string
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email in ('admin1@example.com','admin2@example.com');
```
After updating, log out/in to refresh the JWT.

## API Overview (backend)
- `GET /api/health` → status.
- `POST /api/upload-image` (multipart/form-data `file`) → `{ url, path }` public image URL saved to reports.
- `POST /api/reports` → create report payload:
  ```json
  {
    "title": "...",
    "source_type": "image|headline|link",
    "source_url": "...",
    "image_url": "https://.../object/public/reports-media/uploads/...",
    "headline": "...",
    "link": "...",
    "analysis_text": "...",
    "reliability": 0-100,
    "tags": ["#tag"],
    "reasons": ["reason"],
    "status": "published"
  }
  ```
- `GET /api/trending?limit=20` → list reports with `likes`/`dislikes` counts.
- `GET /api/reports/:id/votes` → `{ likes, dislikes }`.
- `POST /api/reports/:id/vote` → `{ voter_id, vote }` where vote is `1` or `-1`.
- `DELETE /api/reports/:id` (Admin only, Bearer JWT) → removes votes, report, and associated storage file if any.

## Frontend Notes
- Supabase client: `frontend/src/lib/supabase.ts` uses Vite envs.
- Trending page: `frontend/src/components/TrendingPage.tsx`
  - Top‑right Admin Login modal (email/password).
  - Shows Delete button when logged in; sends Bearer token to backend.
  - Local persistence for user votes in `localStorage`.
- Styles: `frontend/src/components/TrendingPage.css`.

## Database & Storage
- Initialize tables/bucket using `main/backend/schema.sql` (run in Supabase SQL).
- Storage bucket (default `reports-media`) auto‑created on server start.

## Troubleshooting
- Missing `@supabase/supabase-js` in frontend: run `npm install` at `main/`.
- 403 on delete: ensure user is admin (via SQL or `ADMIN_EMAILS`) and JWT refreshed.
- Image not deleting: confirm `reports.image_url` is a public URL (created by `/upload-image`).


