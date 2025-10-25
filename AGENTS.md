# Repository Guidelines

## Project Structure & Module Organization

The app uses Next.js 15 with the App Router: routing, top-level layouts, and global styles live in `src/app`. Reusable UI sits in `src/components`, with shadcn/ui primitives under `src/components/ui` and domain widgets such as `Dashboard` alongside them. Shared helpers (for example the `cn` class combiner) live in `src/lib`, while Convex server code and generated bindings stay isolated in `convex/`; avoid editing the `_generated` artifacts directly. Authentication middleware is configured in `middleware.ts` for Clerk-protected routes.

## Build, Test, and Development Commands

Use `pnpm install` to sync dependencies. Run the web app with `pnpm dev`, and start the Convex dev backend in a second terminal via `pnpm dev:convex`. Create production builds with `pnpm build` and serve them locally using `pnpm start`. Keep linting clean with `pnpm lint`, which applies the `next/core-web-vitals` ESLint ruleset.

## Coding Style & Naming Conventions

Follow the existing TypeScript+React style: client components declare `"use client"`, imports favor the `@/` alias, and indentation is two spaces without semicolons. Use functional components, Tailwind utility classes, and the shared `cn` helper for composing class names. Run `pnpm lint` before committing to catch style drift; add formatting to match the surrounding context when editing shadcn-derived files.

## Testing Guidelines

Automated tests are not configured yet, so pair linting with manual checks in the browser. When introducing tests, co-locate them near the feature (`*.test.ts[x]` or `*.spec.ts[x]`) and wire a `pnpm test` script so the suite can run in CI. Document any new testing toolchain in this guide and the PR description.

## Commit & Pull Request Guidelines

Commit messages follow short, imperative headlines (e.g. `improved styling`, `set up clerk with convex`). Keep related changes together and rebase noisy commits before opening a PR. PRs should describe the change, list manual verification steps, link relevant issues, and include screenshots or screen recordings for visible UI updates. Call out any new env vars or migrations so reviewers can reproduce locally.

## Environment & Access Notes

Store secrets in `.env.local`, and make sure `NEXT_PUBLIC_CONVEX_URL` is set for the web client while `CLERK_JWT_ISSUER_DOMAIN` remains available for Convex auth. Without those values the client provider will throw during render and Convex will reject Clerk tokens. Coordinate secret rotations through the shared vault, and update both local env files and the Convex dashboard when keys change.
