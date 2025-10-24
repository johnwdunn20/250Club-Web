# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager

**IMPORTANT: This project uses `pnpm` as the package manager. Always use `pnpm` commands, never `npm`.**

## Common Commands

### Development
- `pnpm dev` - Start Next.js development server with Turbopack
- `pnpm dev:convex` - Start Convex development server (run in parallel with main dev server)

### Building and Deployment
- `pnpm build` - Build the Next.js application with Turbopack
- `pnpm start` - Start the production server

### Code Quality
- `pnpm lint` - Run ESLint for code linting

### Package Management
- `pnpm add <package>` - Add a new dependency
- `pnpm add -D <package>` - Add a new dev dependency
- `pnpm install` - Install all dependencies

## Architecture Overview

This is a **Next.js 15** application using the **App Router** pattern with **Convex** as the backend/database solution. Key architectural components:

### Frontend Stack
- **Next.js 15** with App Router (`src/app/` structure)
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling with shadcn/ui components
- **Geist** fonts (Sans and Mono) for typography

### Backend Stack
- **Convex** for real-time database and serverless functions
- Functions located in `convex/` directory
- Generated TypeScript types in `convex/_generated/`
- **Clerk** for authentication and user management

### Authentication Stack
- **Clerk** integrated with Next.js (`@clerk/nextjs`)
- Clerk middleware configured in `middleware.ts`
- Convex-Clerk integration via `ConvexProviderWithClerk`
- Auth configuration in `convex/auth.config.ts`
- **User sync pattern**: Uses `useStoreUserEffect` hook (in `src/hooks/useStoreUserEffect.ts`) to automatically sync Clerk users to Convex database on authentication
- All Convex functions requiring authentication should use the `getCurrentUser` utility from `convex/utils.ts`

### Key Directories
- `src/app/` - Next.js App Router pages and layouts
- `src/lib/` - Shared utilities (includes shadcn/ui `cn` helper)
- `src/components/` - React components (includes `ConvexClientProvider`)
- `src/hooks/` - Custom React hooks (includes `useStoreUserEffect`)
- `convex/` - Convex backend functions and schema
- `middleware.ts` - Clerk authentication middleware

## Application Domain Model

This is a **fitness challenge application** called "250 Club" where users create and participate in daily exercise challenges with friends.

### Core Entities
- **Users**: Authenticated via Clerk, synced to Convex with `tokenIdentifier` for lookups
- **Friendships**: Bidirectional relationships between users (stored as two separate documents)
- **Friend Requests**: Pending friendship invitations with requester/recipient
- **Challenges**: Daily fitness challenges with a name, date, and exercises
- **Exercises**: Individual exercises within a challenge (e.g., "Push-ups: 50 reps")
- **Challenge Participants**: Join table linking users to challenges with status (invited/active/completed)
- **Exercise Progress**: Tracks completed reps per user per exercise

### Key Data Relationships
- Each challenge has multiple exercises (ordered by `order` field)
- Each challenge has multiple participants (creator is auto-active, others are invited)
- Each user can track progress on each exercise in a challenge
- Challenges are date-specific (YYYY-MM-DD format) and timezone-aware
- The schema uses Convex indexes extensively for efficient queries (see `convex/schema.ts`)

### Important Convex Files
- `convex/schema.ts` - Database schema with all tables and indexes
- `convex/users.ts` - User storage and syncing with Clerk
- `convex/friendships.ts` - Friend request and friendship management
- `convex/challenges.ts` - Challenge creation, querying, and progress tracking
- `convex/utils.ts` - Shared utilities like `getCurrentUser()` and `getTodayDateFromTimezone()`

## Development Workflow

### Convex Development
- Always run both `pnpm dev` and `pnpm dev:convex` in parallel for full development experience
- Convex functions follow new function syntax with explicit validators
- Use the comprehensive Convex guidelines in `.cursor/rules/convex.mdc` for all database interactions
- Schema defined in `convex/schema.ts`
- Generated types available from `convex/_generated/`
- **IMPORTANT**: Use `getCurrentUser(ctx)` from `convex/utils.ts` in all authenticated Convex functions (it handles auth checking and user lookup)

### Component Development
- Uses shadcn/ui component patterns
- Utility classes combined with `cn()` helper from `src/lib/utils.ts`
- Tailwind CSS 4 with `tw-animate-css` for animations
- **Mobile-first approach**: All components must be designed for mobile devices first, then enhanced for larger screens using responsive breakpoints (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`)

### TypeScript Configuration
- Main config: `tsconfig.json` (Next.js app)
- Convex config: `convex/tsconfig.json` (Convex functions)
- Path aliasing: `@/*` maps to `src/*`

## Important Notes

### Convex Function Guidelines
- Follow the extensive Convex guidelines in `.cursor/rules/convex.mdc`
- Always use new function syntax with `args` and `returns` validators
- Use `internal` functions for private operations
- Properly structure queries, mutations, and actions
- **Always use `getCurrentUser(ctx)` instead of manually handling auth** - this utility from `convex/utils.ts` handles both authentication checking and user lookup

### Styling Guidelines
- Tailwind CSS 4 is configured
- Use `cn()` utility for conditional classes
- shadcn/ui components available
- **Mobile-first responsive design**: Start with mobile styles (base classes), then add responsive variants (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) for larger screens
- Ensure touch-friendly interfaces with adequate spacing and button sizes for mobile devices

### Development Requirements
- Node.js environment
- Both Next.js and Convex dev servers should run simultaneously
- Environment variables configured in `.env`
- Clerk application configured with proper environment variables

### Environment Variables
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL
- `CLERK_JWT_ISSUER_DOMAIN` - Clerk JWT issuer domain for Convex integration
- Standard Clerk environment variables for Next.js integration

### Authentication Guidelines
- Clerk is integrated at the root layout level via `ClerkProvider`
- Convex uses Clerk authentication through `ConvexProviderWithClerk`
- Authentication state is managed by Clerk's `useAuth` hook
- Protected routes can be configured via Clerk middleware
- User authentication flows handled by Clerk's built-in components
- **User syncing**: The `useStoreUserEffect` hook automatically creates/updates Convex user records when users authenticate with Clerk

### Timezone Handling
- Challenges are date-specific and use YYYY-MM-DD format
- Use `getTodayDateFromTimezone(timezone)` from `convex/utils.ts` for client timezone support
- Pass user's timezone from the client when querying date-specific challenges (e.g., `getTodaysChallenge`)