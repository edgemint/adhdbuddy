# ADHDBuddy - FocusMate Competitor Implementation Plan

## Executive Summary
Build a cross-platform video accountability buddy app (web, iOS, Android) that connects users for focused work sessions with goal-setting and check-ins.

**Key Differentiators**: Lower price/free tier, smarter matching, social features
**Monetization**: Freemium with ads OR subscription for higher usage tiers
**Developer**: Solo (prioritize managed services, keep architecture simple but extensible)

---

## Core Product Features

### MVP (Phase 1)
- User registration/authentication
- Session scheduling (25, 50, 75-minute options)
- Automatic user matching
- 1:1 video calls with timer
- Goal declaration at session start
- End-of-session check-in
- Basic user profiles
- **Free tier**: Unlimited with ads during non-session screens

### Phase 2
- Recurring session scheduling
- Favorite partners / friend system
- Session history and streaks
- Push notifications
- **Smart matching**: Match by goals, work style, timezone preferences
- **Social**: Public profiles, follow users, see friends' sessions

### Phase 3
- **Premium tier**: Ad-free, priority matching, group sessions
- Analytics dashboard (personal productivity insights)
- Community features (public rooms, topic-based sessions)
- Calendar integrations (Google, Outlook)
- Group sessions (2-4 people)

---

## Recommended Tech Stack

### Frontend - Cross-Platform

**React Native + React (Chosen)**
```
Mobile: React Native (iOS + Android from single codebase)
Web: React with shared business logic
UI: React Native Paper or Tamagui (cross-platform components)
```
- Pros: Large ecosystem, easy hiring, code sharing between platforms
- Cons: Some native modules needed for video

### Backend

```
Runtime: Node.js with TypeScript
Framework: NestJS or Fastify
Database: PostgreSQL (primary) + Redis (caching, sessions, queues)
ORM: Prisma
Auth: Supabase Auth
Real-time: Supabase Realtime (for signaling + presence)
Queue: BullMQ (for matching, notifications)
```

### Video Infrastructure

**How WebRTC Works:**
- WebRTC is **peer-to-peer by default** - video flows directly between users
- STUN servers: Free, help users discover their public IP (Google provides free ones)
- TURN servers: Expensive, relay video when P2P fails (NAT/firewall issues)
- SFU servers: Required for group calls, route video between multiple participants

**For 1:1 calls, P2P works ~70-85% of the time** - the cost is mainly TURN relay for the remaining 15-30%.

---

**Chosen Approach: P2P from Day 1**
```
Library: simple-peer (battle-tested WebRTC wrapper)
Signaling: Supabase Realtime (already using for other features)
STUN: Google's free STUN servers
TURN: Metered.ca free tier → self-host if needed
```
- Total video cost: ~$5-20/month regardless of user count
- Full control over the stack
- Add managed SFU later only if group calls become a priority

### Infrastructure

```
Hosting: Vercel (web) + Railway or Render (backend) for MVP
         AWS/GCP for production scale
Database: Supabase (PostgreSQL + Auth + Realtime)
CDN: Cloudflare
Monitoring: Sentry + LogRocket
Analytics: Mixpanel or PostHog
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                               │
├─────────────┬─────────────────────┬─────────────────────────┤
│   React     │   React Native      │   React Native          │
│   (Web)     │   (iOS)             │   (Android)             │
└──────┬──────┴──────────┬──────────┴───────────┬─────────────┘
       │                 │                      │
       └─────────────────┼──────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Supabase          │
              │   (Auth + DB +      │
              │    Realtime)        │
              └──────────┬──────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ PostgreSQL  │  │   Realtime  │  │   Edge      │
│             │  │  (Signaling)│  │  Functions  │
└─────────────┘  └─────────────┘  └─────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   P2P Video         │
              │   (simple-peer)     │
              └─────────────────────┘
```

---

## Monorepo Structure

```
adhdbuddy/
├── apps/
│   ├── web/                 # React web app (Vite)
│   ├── mobile/              # React Native app (Expo)
│   └── api/                 # Edge functions / API routes
├── packages/
│   ├── shared/              # Shared types, utils, constants
│   ├── ui/                  # Shared UI components
│   └── video/               # WebRTC / simple-peer wrapper
├── supabase/
│   ├── migrations/          # Database migrations
│   └── functions/           # Edge functions
├── package.json
├── turbo.json               # Turborepo config
└── pnpm-workspace.yaml
```

**Tooling:**
- Package manager: pnpm
- Monorepo: Turborepo
- Linting: ESLint + Prettier
- Testing: Vitest (unit), Playwright (e2e)
- CI/CD: GitHub Actions

---

## Database Schema (Core Tables)

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions (scheduled time slots)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL CHECK (duration_minutes IN (25, 50, 75)),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session participants
CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  goal TEXT,
  goal_completed BOOLEAN,
  joined_at TIMESTAMPTZ,
  UNIQUE(session_id, user_id)
);

-- User preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  notifications_enabled BOOLEAN DEFAULT true,
  preferred_duration INT DEFAULT 50,
  is_premium BOOLEAN DEFAULT false
);

-- Friendships / favorites
CREATE TABLE user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  connected_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id)
);
```

---

## Key Technical Challenges

### 1. User Matching Algorithm
- Match users at session start time
- Handle timezone differences
- Balance wait times vs. match quality
- Fallback for unmatched users (solo mode or reschedule)

### 2. Video Reliability (P2P)
- Handle network interruptions gracefully
- Reconnection logic with exponential backoff
- Fallback to audio-only when video fails
- Device/permission handling across browsers

### 3. Real-time Synchronization
- Session timer sync between participants
- Connection state management
- Presence indicators (online/away/in-session)

### 4. Signaling via Supabase Realtime
- Use channels for peer discovery
- Exchange SDP offers/answers
- Handle ICE candidates
- Clean up on disconnect

---

## Monetization & Ads Integration

### Free Tier (Ad-Supported)
- Show ads on: Home screen, session list, profile pages
- **No ads during**: Active video sessions (disrupts focus)
- Ad providers: Google AdMob (mobile), Google AdSense (web)
- Estimated revenue: $1-5 CPM (varies by region)

### Premium Tier ($5-8/month)
- Ad-free experience
- Priority matching (shorter wait times)
- Group sessions
- Advanced analytics
- Exclusive features

### Revenue Math (Example)
- 10K free users × 10 sessions/month × 3 ad views/session = 300K impressions
- At $2 CPM = $600/month from ads
- 500 premium users × $6/month = $3,000/month
- **Total**: $3,600/month (covers infrastructure with margin)

---

## Cost Estimates (Monthly at Scale)

### With P2P Video (simple-peer + TURN)
| Component | 1K Users | 10K Users | 100K Users |
|-----------|----------|-----------|------------|
| Video (P2P + TURN) | $10 | $50 | $200 |
| Hosting (Vercel) | $20 | $50 | $200+ |
| Database (Supabase) | Free | $25 | $100+ |
| Auth (Supabase) | Free | Free | $25+ |
| **Total** | ~$30 | ~$125 | ~$525 |

**P2P saves ~70-90% on video costs compared to managed services!**

---

## Solo Developer Optimizations

### Use Managed Services
- **Supabase**: Database + Auth + Realtime in one (free tier is generous)
- **Vercel**: Web hosting with zero config
- **Expo**: Simplifies React Native builds and OTA updates

### Keep It Simple
- Start with monolith, extract services only when needed
- Use Supabase Edge Functions instead of separate backend
- Delay group sessions until 1:1 is rock solid
- Ship web first, add mobile after validating core flow

### Automation Priorities
- GitHub Actions for CI/CD (auto-deploy on push)
- Sentry for error tracking (catch issues before users report)
- Uptime monitoring (simple ping check)

---

## Immediate Next Steps

### Step 1: Project Foundation
1. Initialize monorepo with Turborepo + pnpm
2. Set up Supabase project (database + auth + realtime)
3. Create database schema (users, sessions, participants)
4. Build basic React web app shell with Vite

### Step 2: Core Features
5. Build auth flow (signup, login, profile)
6. Create session scheduling UI (pick time + duration)
7. Implement matching algorithm (pair users at session time)

### Step 3: Video Integration (P2P)
8. Set up simple-peer with Supabase Realtime for signaling
9. Build video call UI (local/remote video, controls)
10. Add STUN/TURN configuration
11. Handle reconnection and error states

### Step 4: Session Flow
12. Goal declaration screen (start of session)
13. Timer synchronization between peers
14. End-of-session check-in
15. Session history tracking

### Step 5: Polish & Ads
16. Integrate AdMob/AdSense
17. Add premium tier logic
18. Mobile app with React Native + Expo

---

## Autonomous Development Requirements

**CRITICAL**: This project is developed autonomously by AI with minimal human supervision. Every feature MUST have automated verification so progress can be validated without manual intervention.

### CLI Tools Required

The following CLI tools must be available and functional:

```bash
# Package management
pnpm --version              # Package manager
node --version              # Node.js runtime

# Monorepo
npx turbo --version         # Turborepo for monorepo management

# Supabase
supabase --version          # Supabase CLI for local dev
supabase start              # Start local Supabase instance
supabase stop               # Stop local instance
supabase db reset           # Reset database
supabase db push            # Push migrations
supabase gen types typescript --local  # Generate TypeScript types

# Testing
npx vitest --version        # Unit/integration testing
npx playwright --version    # E2E testing

# Mobile (later phases)
npx expo --version          # Expo CLI for React Native
```

### Self-Verification Scripts

Create these scripts in `package.json` for autonomous verification:

```json
{
  "scripts": {
    "verify": "pnpm typecheck && pnpm lint && pnpm test && pnpm build",
    "verify:quick": "pnpm typecheck && pnpm lint",
    "verify:full": "pnpm verify && pnpm test:e2e",

    "test": "turbo run test",
    "test:unit": "turbo run test:unit",
    "test:e2e": "playwright test",
    "test:video": "vitest run --project video",
    "test:coverage": "vitest run --coverage",

    "typecheck": "turbo run typecheck",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "build": "turbo run build",

    "dev": "turbo run dev",
    "dev:web": "turbo run dev --filter=web",

    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:reset": "supabase db reset",
    "db:types": "supabase gen types typescript --local > packages/shared/src/database.types.ts",

    "clean": "turbo run clean && rm -rf node_modules",
    "check:deps": "pnpm outdated"
  }
}
```

### Verification Workflow for AI

Before marking ANY task complete, run:

```bash
# Quick check (run frequently during development)
pnpm verify:quick

# Full check (run before committing)
pnpm verify

# After database changes
pnpm db:types && pnpm typecheck
```

### Testing at Every Step

Each implementation step must include:

1. **Automated Tests** - Unit/integration tests that can be run via CLI
2. **Build Verification** - `pnpm build` must pass
3. **Type Checking** - `pnpm typecheck` must pass
4. **Linting** - `pnpm lint` must pass

### CLI Verification Commands

```bash
# Core verification (run after every change)
pnpm test           # All tests
pnpm build          # Build all packages
pnpm typecheck      # TypeScript checking
pnpm lint           # Code quality

# Specific verifications
pnpm test:unit      # Unit tests only
pnpm test:e2e       # End-to-end tests
pnpm test:video     # Video-specific tests (P2P connection, signaling)

# Database
supabase db push    # Apply migrations
supabase gen types  # Generate TypeScript types

# Development
pnpm dev            # Start dev server (for manual spot-checks)
```

### Automated Test Patterns

For each feature, create tests that can verify functionality via CLI:

**Auth Tests (packages/shared/src/auth.test.ts)**
```typescript
// Can verify: signup creates user, login returns session, logout clears session
test('signup flow creates user profile', async () => { ... })
test('login returns valid session', async () => { ... })
test('invalid credentials rejected', async () => { ... })
```

**Matching Tests (packages/shared/src/matching.test.ts)**
```typescript
// Can verify: algorithm pairs correctly, handles edge cases
test('two users at same time get matched', async () => { ... })
test('user alone gets solo mode or retry', async () => { ... })
test('matching respects timezone preferences', async () => { ... })
```

**Video Signaling Tests (packages/video/src/signaling.test.ts)**
```typescript
// Can verify: signaling works without actual video
test('offer/answer exchange succeeds', async () => { ... })
test('ICE candidates exchanged', async () => { ... })
test('connection cleanup on disconnect', async () => { ... })
```

**E2E Tests (apps/web/e2e/session.spec.ts)**
```typescript
// Can verify: full user journey works
test('user can complete full session flow', async ({ page }) => {
  // signup -> schedule -> (simulated) match -> goal -> complete
})
```

### Database Seeding for Tests

Create seed data for testing:

```bash
# Seed test data
pnpm db:seed

# Reset and reseed
pnpm db:reset && pnpm db:seed
```

### Health Check Endpoints

Add API endpoints that can verify system health:

```
GET /api/health         # Basic health check
GET /api/health/db      # Database connectivity
GET /api/health/realtime # Supabase realtime working
```

Can verify via:
```bash
curl http://localhost:3000/api/health | jq
```

### Verification Requirements by Step

| Step | Required Verifications |
|------|----------------------|
| 1. Monorepo setup | `pnpm install` succeeds, `pnpm build` succeeds |
| 2. Supabase setup | `supabase start` works, migrations apply |
| 3. Auth flow | Unit tests for auth logic, integration test for signup/login |
| 4. Scheduling UI | Component tests, can create session in DB |
| 5. Matching | Unit tests for algorithm, integration test for pairing |
| 6. Video P2P | Connection tests, signaling tests, TURN fallback test |
| 7. Session flow | E2E test: full session from goal to check-in |
| 8. Ads | Integration test: ads load, premium users don't see ads |
| 9. Mobile | Build succeeds, core flows work on simulator |

### Test Coverage Targets

- **Matching algorithm**: 100% coverage (critical path)
- **Auth flows**: 90% coverage
- **Video signaling**: 80% coverage
- **UI components**: 70% coverage
- **Overall**: >80% on critical paths

---

## Verification / Testing Strategy

1. **Unit Tests**: Core matching logic, timer sync, signaling
2. **Integration Tests**: Auth flow, session creation, P2P connection
3. **E2E Tests**: Full user journey from signup to completed session
4. **CLI Scripts**: Helper scripts for verifications that need manual checks
5. **Load Testing**: Matching algorithm under concurrent users

### Test Infrastructure Setup (Part of Step 1)
- Vitest for unit/integration tests
- Playwright for E2E tests
- Test utilities for Supabase mocking
- CI pipeline with GitHub Actions

---

## Future Ideas (Out of Scope for MVP)

*Add ideas here during development - don't implement until core is complete*

- AI-powered goal suggestions based on past sessions
- Pomodoro integration / break reminders
- Screen sharing for pair programming sessions
- Voice-only mode for low bandwidth
- Integration with task managers (Todoist, Notion, etc.)
- Leaderboards and gamification
- Corporate/team accounts
- API for third-party integrations
