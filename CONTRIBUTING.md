# Contributing & Onboarding Guide for Yama (Yet Another Meeting Analyzer)

Welcome! This guide is for anyone looking to contribute to Yama, the Nx team's meeting analysis tool. Here you'll find everything you need to get started as a developer or contributor: codebase structure, setup instructions, deployment steps, and environment configuration.

Whether you're new to the project or looking to deploy your own instance, this document will help you understand how Yama works and how to get involved.

---

## Codebase Map

This section provides an overview of the main parts of the codebase to help new contributors quickly understand the structure and responsibilities of each part.

### Top-Level Structure

- **`src/`** — Main application source code.
  - **`main.tsx`** — App entry point; renders the root React component.
  - **`App.tsx`** — Main app component; sets up routing and authentication guards.
  - **`index.css`** — Global styles (Tailwind CSS).
  - **`assets/`** — Static assets (e.g., logo).

---

### Core Directories

- **`components/`** — Reusable UI and feature components.

  - **`layout/`** — App shell components (e.g., `AppLayout`, `Header`, `Sidebar`).
  - **`auth/`** — Authentication helpers (e.g., `RequireAuth`).
  - **`transcript/`** — Transcript-related UI (e.g., `TranscriptForm`).
  - **`ui/`** — Generic UI elements (e.g., `Button`, `Card`, `Badge`, `FormElements`).

- **`pages/`** — Main application pages, each corresponding to a route.

  - **`Dashboard.tsx`** — Main dashboard view.
  - **`Login.tsx`** — Login page.
  - **`SubmitTranscript.tsx`** — Form to submit new meeting transcripts.
  - **`AnalysisResults.tsx`** — Detailed analysis of a meeting.
  - **`HistoricalData.tsx`** — Timeline and trends of past meetings.
  - **`FollowUps.tsx`** — Task management and follow-up tracking.
  - **`Companies.tsx`** — List of companies.
  - **`CompanyProfile.tsx`** — Detailed company profile and meeting history.
  - **`PainPoints.tsx`** — Technical challenges and pain points.
  - **`Opportunities.tsx`** — Nx solution opportunities.
  - **`admin/`** — Admin-only pages (e.g., `Dashboard.tsx`).
  - **`NotFound.tsx`** — 404 page.
  - **`Unauthorized.tsx`** — Shown when access is denied.
  - **`AuthCallback.tsx`** — Handles OAuth callback.

- **`lib/`** — Utility and integration code.

  - **`supabase.ts`** — Supabase client setup and all backend API calls.
  - **`auth.ts`** — Auth helpers.

- **`stores/`** — State management (using Zustand).

  - **`authStore.ts`** — Authentication state.
  - **`companyStore.ts`** — Company data state.
  - **`dashboardStore.ts`** — Dashboard state.
  - **`transcriptStore.ts`** — Transcript state.

- **`context/`** — React context providers.

  - **`AuthContext.tsx`** — Provides authentication context.

- **`types/`** — TypeScript type definitions.
  - **`supabase.ts`** — Database types for Supabase integration.

---

### Backend (Supabase)

- **`supabase/functions/`** — Supabase Edge Functions (serverless backend logic).

  - **`analyze-transcript/`** — Handles transcript analysis using OpenAI and updates the database.
  - **`auth/`** — Handles authentication events and audit logging.

- **`supabase/migrations/`** — SQL migration scripts for database schema changes.
- **`supabase/seed.sql`** — Optional: seed data for local development/testing.

---

### Other

- **`README.md`** — General project overview and features.
- **`CONTRIBUTING.md`** — Contributor and onboarding guide (this file).

---

**How to Use This Map:**

- Start with `App.tsx` and `main.tsx` to understand app flow and routing.
- Explore `pages/` for main features and navigation.
- Check `lib/supabase.ts` for all backend interactions.
- Use `components/` for reusable UI and layout.
- See `stores/` for state management patterns.
- Backend logic and migrations are in `supabase/`.

---

## 1. Prerequisites

- Access to the Nx team's Supabase project
- Access to the OpenAI API (to get the API key for transcript analysis) - it is already set up
- Deployment platform for the frontend (access to Nx's Netlify account)

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
