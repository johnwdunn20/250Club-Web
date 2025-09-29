# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `npm run dev` - Start Next.js development server with Turbopack
- `npm run dev:convex` - Start Convex development server (run in parallel with main dev server)

### Building and Deployment
- `npm run build` - Build the Next.js application with Turbopack
- `npm start` - Start the production server

### Code Quality
- `npm run lint` - Run ESLint for code linting

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

### Key Directories
- `src/app/` - Next.js App Router pages and layouts
- `src/lib/` - Shared utilities (includes shadcn/ui `cn` helper)
- `convex/` - Convex backend functions and schema

## Development Workflow

### Convex Development
- Always run both `npm run dev` and `npm run dev:convex` in parallel for full development experience
- Convex functions follow new function syntax with explicit validators
- Use the comprehensive Convex guidelines in `.cursor/rules/convex.mdc` for all database interactions
- Schema defined in `convex/schema.ts`
- Generated types available from `convex/_generated/`

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