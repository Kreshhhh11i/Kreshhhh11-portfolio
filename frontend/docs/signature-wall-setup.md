# Shared signature wall setup

The wall uses a private server-side Supabase REST connection. No Supabase key is sent to visitors.

1. Create a Supabase project, then open its SQL Editor and run `backend/supabase/signature-wall.sql`, `backend/supabase/signature-wall-one-per-browser.sql`, and `backend/supabase/signature-wall-moderation.sql` in that order. For an existing wall, run the new moderation file. Existing drawings stay approved; new ones are private until approved.
2. In Supabase **Storage**, create a bucket named `signature-previews` and leave it **private**. The app generates PNGs from the stored strokes on the server and saves them in this bucket. Never make this bucket public: it contains unapproved drawings.
3. Fill in `frontend/.env.local`:
   - `SUPABASE_URL`: the project's URL, e.g. `https://your-project.supabase.co`.
   - `SUPABASE_SECRET_KEY`: the project's **secret** API key (`sb_secret_...`), not its publishable key. Keep it private.
   - `SIGNATURE_RATE_LIMIT_SECRET`: a unique random secret of at least 32 characters. Generate one locally with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
   - `SIGNATURE_ADMIN_PASSWORD`: a unique, hard-to-guess password of at least 16 characters for the private review page. It is never exposed to the browser.
   - `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: the existing Redis view-counter credentials, also used to limit admin login attempts.
4. Restart the local Next.js server so the new environment variables are loaded. Add the same variables to the Vercel project settings before deployment; do not commit `.env.local`.

## Review drawings

Open `/admin/signatures` directly on your site (locally: `http://localhost:3000/admin/signatures`). It is intentionally not linked from the portfolio. Sign in with `SIGNATURE_ADMIN_PASSWORD`, view the private previews, and choose **Approve** or **Reject**. The dashboard requires a working Redis connection and enforces a limit of five login attempts per 15 minutes per visitor address. Sessions expire after one hour; changing the password signs out existing sessions. No notification is sent automatically.

The URL is merely unlisted, not a security boundary: anyone who discovers it can see the login screen. Keep your password and Supabase/Redis keys private, and use HTTPS for the deployed site. Add `SIGNATURE_ADMIN_PASSWORD` to Vercel's environment variables and redeploy. A password manager-generated random password is recommended.

You can also use the Supabase dashboard directly:

1. Open Supabase **Table Editor → signature_wall** and filter `moderation_status` to `pending`. Copy the row's `preview_path` (the image filename).
2. Open **Storage → signature-previews**, find that filename, and preview the private image. The image is generated from the actual stored drawing, not a visitor-supplied image.
3. Return to the table row and change `moderation_status` to `approved` to publish it, or `rejected` to keep it hidden and let the visitor submit a replacement. Never approve rows still marked `processing`: their preview hasn't been saved yet.

Pending previews are visible only to the signed-in admin or in your Supabase dashboard. Visitors can see and cancel their own pending drawing from the same browser, but cannot see other pending drawings. Browser storage holds their ownership tokens; clearing it or changing browsers removes their ability to manage those entries. If a visitor removes their drawing, the app attempts to delete its preview from Storage; if you delete a row directly in the dashboard, remove its image in Storage separately.

The API limits each visitor identifier to five successful new drawings per hour. On Vercel it uses Vercel's forwarded client IP, hashed with your rate-limit secret; locally it uses a shared development identifier. This is a basic deterrent, not a guarantee against abuse. For stronger protection configure a bot challenge with server-side verification before exposing a high-traffic public wall.

Each browser can have one active drawing. Its anonymous identity is stored locally; clearing browser data, using another browser or device, or modifying client storage creates a new identity. Without login, it cannot guarantee one drawing per person. Older drawings remain in the gallery and can be deleted using their original browser's saved tokens.

Existing installations created without a primary key on `signature_wall_rate_limits` can run `backend/supabase/signature-wall-rate-limit-id.sql` to add one without removing rows. New installations get the key from the initial setup script.

Previous browser-only drawings in `portfolio_signingbox_wall` are left untouched and are not automatically published. The wall reads only the new shared entries. Supabase must be configured for the wall to load; failure leaves the drawing on the pad so the visitor can retry.
