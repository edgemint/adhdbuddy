# ADHDBuddy

A FocusMate-style accountability app that pairs users for focused work sessions via video calls.

## Features

- **User Authentication** - Sign up/login with Supabase Auth
- **Session Scheduling** - Choose 25, 50, or 75-minute sessions
- **Smart Matching** - Algorithm matches partners by duration, timezone, and preferences
- **P2P Video Calls** - WebRTC-based video with STUN/TURN fallback
- **Goal Tracking** - Declare goals at session start, check in at end
- **Session History** - Track completed sessions, goals, and streaks
- **Freemium Model** - Ads for free users, premium removes ads

## Tech Stack

- **Web**: React + Vite + TailwindCSS
- **Mobile**: React Native + Expo
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Video**: P2P via simple-peer with Supabase Realtime signaling
- **Monorepo**: Turborepo + Bun

## Quick Start

```bash
# Install dependencies
bun install

# Start local Supabase (requires Docker)
bun run db:start

# Run development servers
bun run dev

# Run tests
bun run test

# Run full verification
bun run verify
```

## Project Structure

```
adhdbuddy/
├── apps/
│   ├── web/           # React web app
│   └── mobile/        # Expo mobile app
├── packages/
│   ├── shared/        # Types, utils, matching algorithm
│   ├── ui/            # Shared UI components
│   └── video/         # WebRTC video package
├── supabase/
│   ├── migrations/    # Database schema
│   └── functions/     # Edge functions
└── e2e/               # Playwright E2E tests
```

## Deployment

### Web (Vercel)

1. Create a Supabase project at https://supabase.com
2. Run migrations: `supabase db push`
3. Deploy to Vercel:
   ```bash
   vercel deploy
   ```
4. Set environment variables in Vercel:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

### Mobile (Expo)

1. Install Expo CLI: `npm install -g expo-cli`
2. Navigate to mobile app: `cd apps/mobile`
3. Install dependencies: `bun install`
4. Start Expo: `expo start`
5. Build for stores:
   ```bash
   eas build --platform ios
   eas build --platform android
   ```

## Environment Variables

Create `.env.local` files:

**apps/web/.env.local**
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**apps/mobile/.env**
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Testing

```bash
# Unit tests
bun run test

# E2E tests (requires dev server running)
bun run e2e

# Type checking
bun run typecheck

# Linting
bun run lint
```

## License

MIT
