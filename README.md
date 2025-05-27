# AuraTune

AuraTune is a full-stack web application designed to showcase the power of Large Language Models (LLMs) in music curation. It integrates with the Spotify API for user authentication, playlist creation/management, and full music playback control. Users can leverage AI, via the OpenRouter API, to generate personalized Spotify playlists through several distinct methods.

The application boasts a premium, modern, and aesthetically pleasing user interface, inspired by platforms like Airbnb.com, aiming to make the user experience as vital as its functional capabilities.

## Key Features

*   **Spotify Integration:** Secure login, playlist management, music playback.
*   **AI-Powered Playlist Generation:**
    *   **Curated Templates:** Visually presented themes for quick playlist creation.
    *   **Track Match:** Generate playlists based on a seed song.
    *   (Future) Listening Habits, Artist-Based, Genre Blend.
*   **AI-Generated Names & Descriptions:** Unique, editable names and descriptions for playlists.
*   **Playlist Preview & Management:** Review generated playlists before saving to Spotify.
*   **Spotify Music Playback Control:** Full in-app playback controls.
*   **Analytics Dashboard:** View AuraTune playlist stats and Spotify listening habits.
*   **Premium UI/UX:** Modern, clean, and intuitive design.

## Technology Stack

*   **Frontend:** Next.js (App Router) with TypeScript, React, Tailwind CSS, Shadcn UI, Framer Motion.
*   **Backend:** Next.js API Routes and Server Actions with TypeScript.
*   **Database:** Supabase (PostgreSQL) using Drizzle ORM.
*   **Authentication:** NextAuth.js with Spotify Provider.
*   **AI Inference:** OpenRouter API.
*   **Music Platform:** Spotify API.

## Project Structure

*   `src/actions/`: Server actions (database, Spotify, LLM, etc.).
*   `src/app/`: Next.js app router (pages, layouts, API routes).
*   `src/components/`: Shared React components (UI, layout, shared logic).
*   `src/db/`: Drizzle ORM setup (schemas, client).
*   `src/lib/`: Library code and utilities (auth config, SDKs, hooks).
*   `src/prompts/`: System prompts for LLM interactions.
*   `src/types/`: TypeScript type definitions.
*   `public/`: Static assets.
*   `drizzle/`: Drizzle Kit migration files.

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/)
*   A Spotify Developer account and application.
*   A Supabase account and project.
*   An OpenRouter API key.

### Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/auratune.git
    cd auratune
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```

3.  **Set up environment variables:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env.local
        ```
    *   Open `.env.local` and fill in the required values. See the "Environment Variables" section below for details on how to obtain these.

4.  **Set up Supabase Database:**
    *   Ensure your Supabase project is running and you have the database connection string (`DATABASE_URL`).
    *   The initial database schema is defined in `src/db/schema/`.
    *   Drizzle migrations are used to manage the schema. The first migration is already generated in `drizzle/migrations/`.
    *   If you need to apply migrations (e.g., if starting from scratch and Supabase doesn't auto-apply from `drizzle.config.ts` upon first connection, though typically it uses its own schema management after initial setup):
        *   Run `npm run db:generate` if you make schema changes.
        *   Run `npm run db:migrate` to apply migrations (ensure `DATABASE_URL` is correct).
        *   *Note: For Supabase, you might apply the initial schema SQL directly in the Supabase SQL editor or let Drizzle handle it if configured.*
    *   **Manually add Curated Templates:**
        After your tables are created, you need to manually insert some data into the `curated_templates` table for the "Curated Templates" feature to work. You can do this via the Supabase Table Editor or SQL Editor. Example SQL:
        ```sql
        INSERT INTO curated_templates (name, description, system_prompt, icon_url, is_active) VALUES
        ('Focus Mode', 'Deep concentration music.', 'Generate a 10-track playlist of instrumental electronic music suitable for deep work and focus. Avoid vocals.', 'lucide:brain', true),
        ('Workout Energy', 'High-energy tracks for your workout.', 'Create a 15-track playlist with upbeat pop and electronic dance music perfect for an intense workout session.', 'lucide:dumbbell', true),
        ('Chill Vibes', 'Relax and unwind with soothing tunes.', 'Craft a 12-track playlist featuring lo-fi hip hop, ambient, and acoustic tracks perfect for chilling out.', 'lucide:coffee', true),
        ('Sunset Drive', 'Perfect soundtrack for a scenic drive as the sun sets.', 'Generate a 10-track playlist with indie pop, synthwave, and classic driving anthems suitable for a sunset drive.', 'lucide:car', true),
        ('Rainy Day', 'Cozy up with music for a rainy day.', 'Curate a 10-track playlist of mellow acoustic songs, soft jazz, and calming instrumentals ideal for a rainy day indoors.', 'lucide:cloud-rain', true),
        ('Party Mix', 'Get the party started with these upbeat tracks.', 'Create an energetic 15-track playlist with popular dance hits, EDM, and throwback anthems to liven up any party.', 'lucide:party-popper', true),
        ('Late Nights', 'Music for late-night coding or quiet contemplation.', 'Generate a 10-track playlist of ambient electronic, downtempo, and instrumental tracks suitable for late-night focus or relaxation.', 'lucide:moon', true),
        ('Coffee Shop', 'Acoustic and indie tunes for a coffee shop atmosphere.', 'Craft a 12-track playlist with singer-songwriter, folk, and light indie pop music, perfect for a coffee shop vibe.', 'lucide:bean', true);
        ```
        (Ensure you generate UUIDs for the `id` column or let the database default handle it if `gen_random_uuid()` is set as default.)

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) (or [http://127.0.0.1:3000](http://127.0.0.1:3000) if specified by Turbopack) with your browser to see the result.

### Environment Variables

The following environment variables need to be set in your `.env.local` file:

*   `NEXTAUTH_URL`: The canonical URL of your Next.js application. For local development, this is typically `http://127.0.0.1:3000` or `http://localhost:3000`.
*   `NEXTAUTH_SECRET`: A secret string used to sign cookies and tokens by NextAuth.js. Generate a strong, random string (e.g., using `openssl rand -base64 32`).
*   `SPOTIFY_CLIENT_ID`: Your Spotify application's Client ID.
    *   Obtain this from the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
    *   Create a new application or use an existing one.
    *   In your Spotify app settings, add `http://127.0.0.1:3000/api/auth/callback/spotify` (or your `NEXTAUTH_URL` equivalent) as a Redirect URI.
*   `SPOTIFY_CLIENT_SECRET`: Your Spotify application's Client Secret.
    *   Available in your Spotify Developer Dashboard alongside the Client ID.
*   `NEXT_PUBLIC_SUPABASE_URL`: The public URL for your Supabase project.
    *   Find this in your Supabase project settings (API section).
*   `SUPABASE_SERVICE_ROLE_KEY`: A secret key for administrative access to your Supabase backend.
    *   Find this in your Supabase project settings (API section). **Keep this key confidential.**
*   `DATABASE_URL`: The connection string for your Supabase PostgreSQL database.
    *   Format: `postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST].supabase.co:5432/postgres`
    *   Find this in your Supabase project settings (Database section -> Connection string). Replace `[YOUR-PASSWORD]` with your database password and `[YOUR-HOST]` with your project's DB host.
*   `OPENROUTER_API_KEY`: Your API key for OpenRouter.
    *   Obtain this from [OpenRouter Keys](https://openrouter.ai/keys).

## Available Scripts

*   `npm run dev`: Starts the Next.js development server (with Turbopack).
*   `npm run build`: Builds the application for production.
*   `npm run start`: Starts a Next.js production server (after building).
*   `npm run lint`: Runs ESLint to check for code quality issues.
*   `npm run db:generate`: Generates SQL migration files based on Drizzle schema changes.
*   `npm run db:migrate`: Applies pending Drizzle migrations to the database.
*   `npm run db:studio`: Opens Drizzle Studio to browse your database.
*   `npm run test`: Runs Jest unit/integration tests. (Setup needed if not already)
*   `npm run test:e2e`: Runs Playwright end-to-end tests.

## Testing

*   **Unit/Integration Tests:** (Jest/Vitest & React Testing Library)
    *   Run with `npm run test`.
    *   Test files are typically located alongside the components/actions they test (e.g., `src/actions/**/*.test.ts`).
*   **End-to-End Tests:** (Playwright)
    *   Run with `npm run test:e2e`.
    *   Test files are in the `tests/` directory at the project root.
    *   Run in UI mode with `npm run test:e2e:ui`.

## Deployment

This Next.js application is designed to be easily deployable on platforms like [Vercel](https://vercel.com/), the creators of Next.js.
Ensure all environment variables are configured in your deployment environment.

