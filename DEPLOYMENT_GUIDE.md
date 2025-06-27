# Deployment Guide for Yama (Yet Another Meeting Analyzer)

This guide provides step-by-step instructions for the Nx team to deploy and configure Yama, including all required environment variables and secrets.

---

## 1. Prerequisites

- Access to the Nx team's Supabase project (with admin permissions)
- Access to the OpenAI API (for transcript analysis)
- (Optional) Deployment platform for the frontend (e.g., Vercel, Netlify, or your own infra)

---

## 2. Environment Variables & Secrets

### Frontend (Vite)
Set these in your deployment platform's environment variable settings, or in a `.env` file for local development:

- `VITE_SUPABASE_URL` — Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon public key

**Example `.env` for local dev:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Edge Functions (in `supabase/functions/`)
Set these in the Supabase dashboard under Project Settings > Environment Variables:

- `SUPABASE_URL` — Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (keep this secret!)
- `OPENAI_API_KEY` — Your OpenAI API key (for transcript analysis)

**Note:** These are required for both `analyze-transcript` and `auth` functions.

---

## 3. Deployment Steps

### A. Frontend
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set the required environment variables (see above).
4. Build and deploy using your preferred platform (e.g., Vercel, Netlify, or static hosting):
   ```bash
   npm run build
   # then deploy the contents of the `dist/` folder
   ```

### B. Supabase Backend
1. Go to your Supabase project dashboard.
2. Deploy the Edge Functions:
   - Use the Supabase CLI or dashboard to deploy `supabase/functions/analyze-transcript` and `supabase/functions/auth`.
   - Ensure the required environment variables are set for each function.
3. Apply the database migrations:
   - Use the Supabase CLI or dashboard SQL editor to run the SQL files in `supabase/migrations/` in order.
   - (Optional) Seed the database using `supabase/seed.sql` if needed.

---

## 4. Authentication & Access
- Only users with `@nrwl.io` email addresses can log in (enforced via Google Auth).
- Make sure Google Auth is enabled in your Supabase project and configured for the correct domain.
- Super admin setup is handled via migrations (see `supabase/migrations/`).

---

## 5. Troubleshooting
- If you see errors about missing environment variables, double-check that all required variables are set in both the frontend and Supabase dashboard.
- For OpenAI errors, ensure your API key is valid and has sufficient quota.

---

## 6. Reference
- For general usage and feature overview, see [README.md](./README.md).
- For contributing, see the Nx team guidelines.

---

If you have questions or need access to secrets, contact the Nx platform admin. 