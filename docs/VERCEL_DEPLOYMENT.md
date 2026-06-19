# Vercel Deployment

This repo is configured as a standalone REI Runner Vercel project. Do not link it to the Signal Forge Vercel project.

## Project Settings

- Framework preset: TanStack Start if available, otherwise Vite/Other.
- Install command: `bun install --frozen-lockfile`
- Build command: `bun run build`
- Output directory: leave blank and let TanStack Start/Nitro provide Vercel output.
- Root directory: repository root.

## Environment Variables

Copy the keys from `.env.example` into Vercel Project Settings > Environment Variables. Keep server secrets only in Vercel; do not commit `.env` files.

## Domain Cutover

1. Deploy and verify the generated Vercel preview/production URL first.
2. Add `reirunner.com` and `www.reirunner.com` to this REI Runner Vercel project.
3. Update DNS using Vercel's instructions.
4. Verify `/`, `/login`, `/signup`, `/dashboard`, and one server-backed flow.
5. Remove the custom domain from Lovable after Vercel shows the domain as valid.
