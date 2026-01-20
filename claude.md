# ADHDBuddy - Project Context

## What This Project Is

ADHDBuddy is a FocusMate competitor - a video accountability app that pairs users for focused work sessions. Users schedule sessions, get matched with a partner, declare their goals, work together via video, and check in at the end.

**Key Differentiators:** Lower price/free tier, smarter matching, social features

## Tech Stack

- **Frontend:** React (web) + React Native/Expo (mobile)
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Video:** P2P with simple-peer, Supabase Realtime for signaling
- **Monorepo:** Turborepo + pnpm
- **Hosting:** Vercel (web), Supabase (backend)

## Project Structure

```
adhdbuddy/
├── apps/
│   ├── web/          # React web app (Vite)
│   └── mobile/       # React Native app (Expo)
├── packages/
│   ├── shared/       # Shared types, utils, constants
│   ├── ui/           # Shared UI components
│   └── video/        # WebRTC / simple-peer wrapper
├── supabase/
│   ├── migrations/   # Database migrations
│   └── functions/    # Edge functions
├── PLAN.md           # Implementation plan (modify as you expand scope)
├── progress.md       # Progress tracking (update after each chunk)
├── workflow.md       # Workflow instructions (read-only reference)
└── claude.md         # This file - project context
```

## Key Files

| File | Purpose |
|------|---------|
| `PLAN.md` | Detailed implementation plan - expand with sub-steps as needed |
| `progress.md` | Track what's done, in progress, and upcoming |
| `workflow.md` | Continuous development loop instructions |
| `turbo.json` | Monorepo task configuration |
| `supabase/migrations/` | Database schema evolution |

## Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev              # Run all apps in dev mode
pnpm dev:web          # Run web app only
pnpm dev:mobile       # Run mobile app only

# Testing
pnpm test             # Run all tests
pnpm test:web         # Run web tests
pnpm typecheck        # TypeScript checking
pnpm lint             # Linting

# Building
pnpm build            # Build all packages
pnpm build:web        # Build web app

# Supabase
supabase start        # Start local Supabase
supabase db push      # Push migrations
supabase gen types    # Generate TypeScript types
```

## Database Schema

Core tables:
- `profiles` - User profiles (extends Supabase auth)
- `sessions` - Scheduled work sessions
- `session_participants` - Who's in each session + their goals
- `user_preferences` - Notification settings, premium status
- `user_connections` - Friend/favorite relationships

## Development Workflow

This project uses an autonomous development workflow (see `workflow.md`):

1. **Assess** - Read progress.md, identify next step
2. **Plan** - Break down steps if needed in PLAN.md
3. **Implement** - Use parallel subagents when possible
4. **Verify** - Run tests/builds, don't proceed if failing
5. **Update** - progress.md, git commit, claude.md files
6. **Loop** - Continue until overall goal is met

## Current State

**Status:** Planning complete, ready to begin implementation

**Next Steps:**
1. Initialize monorepo with Turborepo + pnpm
2. Set up Supabase project
3. Create database migrations
4. Build web app shell

## Testing Strategy

Every feature needs:
- Unit tests for business logic
- Integration tests for Supabase interactions
- E2E tests for critical user flows
- CLI verification where automated tests aren't practical

**Verification is required before marking any step complete.**

## Known Considerations

- P2P video works ~70-85% of the time; need TURN fallback for rest
- Matching algorithm needs to handle edge cases (no partner, drops, etc.)
- Timer sync between peers needs careful handling
- Mobile will need native modules for WebRTC
