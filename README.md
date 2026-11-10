# Plant Health Tracker

A plant-care dashboard that turns everyday observations into a structured care journal and clear visual summaries.

**[Try the live demo](https://plant-health-tracker.xantgeor80.chatgpt.site)** — no sign-in needed.

Created by Georgios Xanthakis with AI assistance. This project connects an agricultural-science background with software, data quality and user-focused product design.

## Explore the demo

1. Open a plant card to see its care history and illustrative measurements.
2. Filter the collection by species/name, location or latest recorded health.
3. Add a plant, upload a photo or record watering and observations.
4. Explore the care journal and analytics tabs.
5. Use **Reset demo** to restore the examples.

The sample collection includes a large-leaf monstera, lush pothos, flowering bird of paradise and crimson camellia. Plant-specific photographic backgrounds transition smoothly when details open. Sample photography is AI-generated.

## Features

- Plant profiles with species, location and manually assessed health.
- Watering, symptom and observation records.
- Health distribution and recent-care charts that follow the active filters.
- Sample height, spread, leaf size, moisture, light, temperature, humidity and pH.
- Mobile-friendly layout, keyboard-accessible controls and reduced-motion support.
- Camera/file upload with compressed, metadata-stripped JPEG previews.
- Separate authenticated personal tracker backed by Supabase.

All sample measurements are fictional demonstration values, not live sensor readings or diagnoses.

## Technology

React 19 · TypeScript · Vinext/Vite · Tailwind CSS · shadcn/ui · Recharts · Supabase PostgreSQL and Edge Functions · Cloudflare Workers / Sites hosting.

This is a TypeScript web application. It is separate from the earlier Python/pandas command-line Plant Health Tracker.

## Demo and personal data

**Demo:** four plants and eight care records are generated on first use. Changes and uploaded thumbnails stay in the visitor's localStorage. No database or AI requests are made in demo mode.

**Personal tracker:** uses ChatGPT sign-in on the deployed Site. The server signs short-lived, request-bound requests to a Supabase Edge Function, scoped to the signed-in user. Database row-level security and ownership checks protect personal records.

Personal mode depends on the original hosting authentication context and configured backend. Cloning this repository does not create those services.

## Local setup

Requires Node.js 22.13 or later and pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by the development server. The public demo works without service secrets.

```sh
pnpm exec tsc --noEmit
pnpm build
```

For a personal backend, configure your own Supabase project, schema and gateway function. Configure SUPABASE_URL and PLANT_GATEWAY_PRIVATE_JWK as server-side runtime settings. Keep private signing keys and service-role credentials out of Git and browser code. See db/supabase-schema.sql and supabase/functions/plant-records/index.ts.

The included hosting configuration is an example for a separate deployment. Replace its placeholder project identity with your own Site identity before publishing.

## Optional AI analysis

Photo identification is prepared in the personal tracker but requires a server-side OPENAI_API_KEY. It sends an image only when the user explicitly chooses analysis. AI suggestions are not diagnoses and require review. This feature is disabled in the public demo.

## Source guide

| Path | Purpose |
| --- | --- |
| app/page.tsx | Collection, journal, charts and plant details |
| lib/demo-data.ts | Sample data and browser-only update logic |
| lib/plant-measurements.ts | Illustrative measurement profiles |
| components/photo-add.tsx | Camera/upload review workflow |
| app/api/ | Authenticated backend and optional analysis |
| supabase/functions/plant-records/ | Signed-request data gateway |
| public/botanical/ | Plant illustrations and AI-generated photography |

## Limitations and validation

Measurements and charts demonstrate data workflows, not calibrated instrumentation. Photos cannot confirm plant disease. Personal sign-in is hosting-specific. Type checks, production builds and demo-data checks were run during development; browser visual QA was unavailable in the authoring session.

## Development approach

Designed and iterated by Georgios Xanthakis using AI-assisted tools. The repository is intended to demonstrate product thinking, structured data, functional testing, documentation and continued learning.
