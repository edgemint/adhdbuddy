# ADHDBuddy Development Workflow

## Overall Goal (Stop Condition)

**The project is COMPLETE when:**
1. A user can sign up, schedule a session, get matched with another user, and complete a video accountability session with goal-setting and check-in
2. The web app is deployed and functional on Vercel
3. P2P video calls work reliably with STUN/TURN fallback
4. Ads are integrated for free tier users
5. Premium subscription flow is implemented
6. Mobile apps (iOS + Android) are built with Expo and ready for app store submission
7. All core features have automated tests with >80% coverage on critical paths
8. The matching algorithm handles edge cases (no match available, user drops, etc.)

**Until ALL of the above are complete, continue the workflow loop.**

When all of the above are complete, say the exact phrase: TASK FULLY COMPLETE.

---

## Prerequisites Check

Before starting the workflow loop, verify these are available:

```bash
# Required tools - run these to verify installation
node --version          # Need Node.js 18+
pnpm --version          # Package manager
git --version           # Version control
supabase --version      # Supabase CLI (install: npm i -g supabase)

# These get installed via pnpm install:
# - turbo (monorepo)
# - vitest (testing)
# - playwright (e2e)
# - typescript
# - eslint
```

If any tool is missing, install it before proceeding.

---

## Continuous Workflow Loop

This workflow runs in a ralph-loop/mod-loop. Each iteration:

### Step 1: Assess Current State
- Read `progress.md` to understand what's been completed
- Read `PLAN.md` to see the current task breakdown
- Identify the next incomplete phase/step

### Step 2: Plan Expansion (if needed)
For the current step/phase, ask:
- **Is this step atomic enough to implement directly?**
  - If YES → proceed to Step 3
  - If NO → break it down into sub-steps in `PLAN.md`

- **Are there missing prerequisites or dependencies?**
  - If YES → add them to `PLAN.md` before this step

- **Is there a feature that would be beneficial to add?**
  - If YES → add it to the appropriate phase in `PLAN.md`

**Atomicity guideline**: A step is atomic if it can be:
- Implemented in a single focused session
- Verified with a specific test or CLI command
- Committed as a logical unit

### Step 3: Implement
- **Delegate to subagents in parallel** whenever tasks are independent
- Examples of parallelizable work:
  - Multiple independent components
  - Tests for different modules
  - Documentation updates
  - Different packages in the monorepo

- **Work sequentially** when there are dependencies:
  - Database schema before API routes
  - API routes before frontend integration
  - Core logic before tests that verify it

### Step 4: Verify
**CRITICAL: Every implementation must be verified before marking complete.**

#### Quick Verification (run frequently)
```bash
pnpm verify:quick    # typecheck + lint
```

#### Full Verification (run before committing)
```bash
pnpm verify          # typecheck + lint + test + build
```

#### Specific Verifications
```bash
# Tests
pnpm test            # All tests
pnpm test:unit       # Unit tests only
pnpm test:e2e        # E2E tests (Playwright)
pnpm test:video      # Video/signaling tests
pnpm test:coverage   # With coverage report

# Code Quality
pnpm typecheck       # TypeScript
pnpm lint            # ESLint
pnpm build           # Build all packages

# Database
supabase start       # Start local Supabase
pnpm db:types        # Generate TypeScript types
pnpm db:reset        # Reset and re-run migrations

# Health Checks
curl http://localhost:3000/api/health | jq
```

#### Verification Checklist
Before marking a step complete, confirm:
- [ ] `pnpm verify` passes (all green)
- [ ] New code has tests
- [ ] Database types are regenerated if schema changed
- [ ] No TypeScript errors
- [ ] No ESLint warnings (or justified exceptions)

**Do NOT mark a step complete without verification passing.**

### Step 5: Update Progress
1. Update `progress.md` with:
   - What was completed
   - Verification results
   - Any issues encountered
   - Next steps

2. Git commit the changes:
   ```bash
   git add -A
   git commit -m "descriptive message of what was done"
   ```

3. Update `claude.md` files:
   - Main `claude.md` - overall project context
   - Subdirectory `claude.md` files - package-specific context

   These files help maintain context across sessions and should include:
   - What this directory/package does
   - Key files and their purposes
   - How to run/test this part
   - Current state and known issues

### Step 6: Loop
- Return to Step 1
- Continue until Overall Goal is met

---

## Subagent Delegation Guidelines

### When to use parallel subagents:
- Setting up independent packages in the monorepo
- Writing tests for different modules
- Implementing independent UI components
- Creating documentation for different areas

### When to work sequentially:
- Database schema → migrations → seed data
- API design → implementation → client integration
- Core video logic → UI integration → error handling

### Subagent task format:
Provide clear, atomic instructions:
```
Task: [specific deliverable]
Context: [relevant background]
Files: [files to create/modify]
Verification: [how to test this works]
```

---

## Testing Requirements

Every feature must have:

1. **Unit tests** for business logic
   - Matching algorithm
   - Timer synchronization logic
   - Session state management

2. **Integration tests** for system interactions
   - Supabase auth flow
   - Database operations
   - Realtime subscriptions

3. **E2E tests** for critical user journeys
   - Sign up → Schedule → Join → Complete session

4. **CLI verification scripts** where automated tests aren't practical
   - Video call quality (manual but with helper scripts)
   - Cross-browser testing helpers

---

## File Responsibilities

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `PLAN.md` | Task breakdown, expanded as needed | When planning/breaking down steps |
| `progress.md` | Completed work log | After each implementation chunk |
| `workflow.md` | This file - workflow instructions | Never (reference only) |
| `claude.md` | Project/directory context | After significant changes |

---

## Emergency Procedures

### If tests fail:
1. Do NOT proceed to next step
2. Debug and fix the issue
3. Re-run verification
4. Only continue when green

### If stuck on a problem:
1. Document the blocker in `progress.md`
2. Note potential solutions to try
3. If truly blocked, flag for human review

### If scope creep detected:
1. Add new ideas to a "Future Ideas" section in `PLAN.md`
2. Stay focused on current phase
3. Only add to active work if it's a blocker
