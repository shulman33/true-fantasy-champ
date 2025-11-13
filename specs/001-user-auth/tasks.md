# Tasks: User Authentication & Authorization System

**Input**: Design documents from `/specs/001-user-auth/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Important Tools**:
- **Context7**: Use `mcp__context7__resolve-library-id` and `mcp__context7__get-library-docs` to get up-to-date documentation for Supabase, Next.js, and other libraries
- **Supabase**: Primary authentication and database provider - use Supabase clients and RLS policies for all data access
- **ShadCN UI**: Use ShadCN UI components for all UI elements (forms, buttons, inputs, cards, etc.) - already set up in the project

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and Supabase integration

- [X] T001 Install Supabase dependencies (@supabase/supabase-js, @supabase/ssr) and Supabase CLI
- [X] T002 [P] Create Supabase project (remote or local) and copy credentials to .env.local
- [X] T003 [P] Use Context7 to fetch Supabase SSR documentation for Next.js 15 App Router patterns
- [X] T004 Create Supabase client utilities in src/lib/supabase/client.ts (browser client)
- [X] T005 Create Supabase server client in src/lib/supabase/server.ts (for Server Components)
- [X] T006 Create Supabase middleware client in src/lib/supabase/middleware.ts (for session refresh)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema Setup

- [X] T007 Create leagues table migration in supabase/migrations/20251112000001_create_leagues.sql
- [X] T008 [P] Create teams table migration in supabase/migrations/20251112000002_create_teams.sql
- [X] T009 [P] Create weekly_scores table migration in supabase/migrations/20251112000003_create_weekly_scores.sql
- [X] T010 [P] Create true_records table migration in supabase/migrations/20251112000004_create_true_records.sql
- [X] T011 [P] Create actual_standings table migration in supabase/migrations/20251112000005_create_actual_standings.sql
- [X] T012 [P] Create update_jobs table migration in supabase/migrations/20251112000006_create_update_jobs.sql
- [x] T013 Run all migrations and verify tables created in Supabase
- [x] T014 Generate TypeScript types from Supabase schema in src/types/database.ts

### Row Level Security (RLS) Policies

- [X] T015 Create RLS policy "Users can view own leagues" on leagues table (included in migration)
- [X] T016 [P] Create RLS policy "Users can insert own leagues" on leagues table (included in migration)
- [X] T017 [P] Create RLS policy "Users can update own leagues" on leagues table (included in migration)
- [X] T018 Create RLS policy "Users can view teams in their leagues" on teams table (included in migration)
- [X] T019 [P] Create RLS policy "Users can view scores in their leagues" on weekly_scores table (included in migration)
- [X] T020 [P] Create RLS policy "Users can view true records in their leagues" on true_records table (included in migration)
- [X] T021 [P] Create RLS policy "Users can view standings in their leagues" on actual_standings table (included in migration)
- [X] T022 [P] Create RLS policy "Users can view update jobs for their leagues" on update_jobs table (included in migration)

### Core Authentication Infrastructure

- [X] T023 Create Next.js middleware in src/middleware.ts for session refresh and route protection
- [X] T024 Create auth validation schemas with Zod in src/lib/auth/validation.ts
- [X] T025 [P] Create rate limiting utilities in src/lib/auth/rate-limit.ts using Upstash Redis
- [X] T026 [P] Create session management helpers in src/lib/auth/session.ts
- [X] T027 Create TypeScript types for auth in src/types/auth.ts
- [X] T028 [P] Create TypeScript types for user in src/types/user.ts
- [X] T029 Update Redis client in src/lib/redis.ts to support session caching

### Email Configuration

- [x] T030 Configure email provider in Supabase Dashboard (Authentication → Providers) ⚠️ MANUAL
- [x] T031 [P] Enable email confirmations in Supabase Dashboard ⚠️ MANUAL
- [x] T032 [P] Customize email verification template in Supabase Dashboard ⚠️ MANUAL
- [x] T033 [P] Customize password reset email template in Supabase Dashboard ⚠️ MANUAL
- [x] T034 [P] Customize magic link email template in Supabase Dashboard ⚠️ MANUAL
- [x] T035 Set site URL and redirect URLs in Supabase Dashboard (Authentication → URL Configuration) ⚠️ MANUAL

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Account Creation & Email Verification (Priority: P1) 🎯 MVP

**Goal**: Enable new users to create accounts with email/password and verify their email address before accessing the application

**Independent Test**: Create a new account through the registration form, receive a verification email, click the verification link, and confirm the account is active and accessible

### Implementation for User Story 1

- [X] T036 [US1] Use Context7 to fetch Supabase Auth documentation for signup patterns
- [X] T037 [P] [US1] Create signup page UI in src/app/(auth)/signup/page.tsx with Client Component using ShadCN Card
- [X] T038 [P] [US1] Create SignupForm component in src/components/auth/SignupForm.tsx using ShadCN Form, Input, Button components
- [ ] T039 [US1] Create POST /api/auth/signup route handler in src/app/api/auth/signup/route.ts
- [X] T040 [US1] Implement signup logic in AuthService (src/services/auth-service.ts) calling Supabase Auth
- [X] T041 [US1] Add validation for signup request (email format, password strength) using Zod schemas
- [X] T042 [P] [US1] Create verify-email page in src/app/(auth)/verify-email/page.tsx for post-signup confirmation
- [X] T043 [P] [US1] Create POST /api/auth/resend-verification route in src/app/api/auth/resend-verification/route.ts
- [X] T044 [US1] Add rate limiting to signup endpoint (5 attempts per 15 min per IP)
- [X] T045 [US1] Add error handling for duplicate email, weak password, and validation errors
- [x] T046 [US1] Test signup flow: register → receive email → verify → account active

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - User Login & Session Management (Priority: P1)

**Goal**: Enable returning users to log in with email/password and maintain authenticated sessions across page navigation

**Independent Test**: Log in with valid credentials, navigate across multiple pages (dashboard, team details, weekly analysis), confirm session persists. Close browser and return to verify session persistence

### Implementation for User Story 2

- [X] T047 [US2] Use Context7 to fetch Supabase Auth documentation for login and session patterns
- [X] T048 [P] [US2] Create login page UI in src/app/(auth)/login/page.tsx using ShadCN Card
- [X] T049 [P] [US2] Create LoginForm component in src/components/auth/LoginForm.tsx using ShadCN Form, Input, Button components
- [X] T050 [US2] Create POST /api/auth/login route handler in src/app/api/auth/login/route.ts
- [X] T051 [US2] Implement login logic in AuthService calling Supabase signInWithPassword
- [X] T052 [US2] Add validation for login request (email format, non-empty password)
- [X] T053 [US2] Add rate limiting to login endpoint (5 failed attempts per 15 min per IP)
- [X] T054 [US2] Implement session caching in Redis for performance (session:{user_id})
- [X] T055 [P] [US2] Create POST /api/auth/logout route handler in src/app/api/auth/logout/route.ts
- [X] T056 [P] [US2] Implement logout logic to clear Supabase session and Redis cache
- [X] T057 [P] [US2] Create GET /api/auth/session route handler in src/app/api/auth/session/route.ts
- [X] T058 [US2] Create useAuth hook in src/hooks/useAuth.ts for client-side auth state
- [X] T059 [P] [US2] Create useSession hook in src/hooks/useSession.ts for session management
- [X] T060 [US2] Update middleware to redirect unauthenticated users to /login for protected routes
- [X] T061 [US2] Add error handling for invalid credentials, unverified email, and expired sessions
- [X] T062 [US2] Test login flow: login → dashboard → navigate pages → close browser → return → still logged in

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Password Reset & Recovery (Priority: P2)

**Goal**: Enable users who forgot their password to reset it securely using their registered email

**Independent Test**: Request a password reset, receive the reset email, click the link, set a new password, and log in with the new credentials

### Implementation for User Story 3

- [ ] T063 [US3] Use Context7 to fetch Supabase Auth documentation for password reset patterns
- [ ] T064 [P] [US3] Create forgot-password page in src/app/(auth)/forgot-password/page.tsx using ShadCN Card
- [ ] T065 [P] [US3] Create ForgotPasswordForm component in src/components/auth/ForgotPasswordForm.tsx using ShadCN Form, Input, Button
- [ ] T066 [US3] Create POST /api/auth/forgot-password route in src/app/api/auth/forgot-password/route.ts
- [ ] T067 [US3] Implement forgot password logic in AuthService calling Supabase resetPasswordForEmail
- [ ] T068 [US3] Add rate limiting (3 requests per hour per email)
- [ ] T069 [US3] Ensure no email enumeration (same response whether email exists or not)
- [ ] T070 [P] [US3] Create reset-password page in src/app/(auth)/reset-password/page.tsx using ShadCN Card
- [ ] T071 [P] [US3] Create ResetPasswordForm component in src/components/auth/ResetPasswordForm.tsx using ShadCN Form, Input, Button
- [ ] T072 [US3] Create POST /api/auth/reset-password route in src/app/api/auth/reset-password/route.ts
- [ ] T073 [US3] Implement password reset completion logic in AuthService calling Supabase updateUser
- [ ] T074 [US3] Add validation for new password (min 8 chars, letter + number)
- [ ] T075 [US3] Add error handling for expired/invalid tokens
- [ ] T076 [US3] Test password reset flow: request → receive email → click link → set new password → login

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Multi-League Management & Authorization (Priority: P1)

**Goal**: Enable users to add multiple ESPN fantasy football leagues to their account, switch between them, and ensure complete data isolation between users

**Independent Test**: Create two user accounts, each adding different ESPN league IDs, and verify that User A cannot access any data from User B's leagues through any page or API endpoint

### Implementation for User Story 4

- [ ] T077 [US4] Use Context7 to fetch Next.js documentation for Server Components and data fetching patterns
- [ ] T078 [P] [US4] Create authenticated layout in src/app/(authenticated)/layout.tsx with navbar and league selector using ShadCN components
- [ ] T079 [P] [US4] Create LeagueSelector component in src/components/user/LeagueSelector.tsx using ShadCN Select/Dropdown
- [ ] T080 [P] [US4] Create UserNav component in src/components/user/UserNav.tsx using ShadCN DropdownMenu and Avatar
- [ ] T081 [US4] Create GET /api/user/leagues route in src/app/api/user/leagues/route.ts
- [ ] T082 [US4] Create POST /api/user/leagues route in src/app/api/user/leagues/route.ts
- [ ] T083 [US4] Create DELETE /api/user/leagues/[leagueId] route in src/app/api/user/leagues/[leagueId]/route.ts
- [ ] T084 [US4] Create POST /api/user/leagues/[leagueId]/sync route in src/app/api/user/leagues/[leagueId]/sync/route.ts
- [ ] T085 [US4] Create UserService in src/services/user-service.ts for user management operations
- [ ] T086 [US4] Implement getUserLeagues in UserService with Supabase query (RLS enforces user_id filter)
- [ ] T087 [US4] Implement addLeague in UserService with ESPN API validation
- [ ] T088 [US4] Implement removeLeague in UserService (soft delete: set is_active = false)
- [ ] T089 [US4] Implement syncLeague in UserService to trigger data update job
- [ ] T090 [US4] Add validation for ESPN league ID format (numeric string)
- [ ] T091 [US4] Add rate limiting to league sync (1 sync per hour per league)
- [ ] T092 [P] [US4] Create leagues list page in src/app/(authenticated)/leagues/page.tsx
- [ ] T093 [P] [US4] Update dashboard page in src/app/(authenticated)/dashboard/page.tsx to use selected league
- [ ] T094 [US4] Update ESPN API service in src/services/espn-api.ts to accept league_id parameter
- [ ] T095 [US4] Update true champion algorithm service in src/services/true-champion.ts to be league-scoped
- [ ] T096 [US4] Update existing API routes (standings, weekly-scores, fetch-data) to require league_id
- [ ] T097 [US4] Add authorization checks in all routes to verify user owns the requested league
- [ ] T098 [US4] Create multi-tenant isolation test: User A cannot access User B's leagues via any endpoint
- [ ] T099 [US4] Test multi-league flow: add league 1 → add league 2 → switch between → verify data isolation

**Checkpoint**: All P1 user stories should now be independently functional

---

## Phase 7: User Story 5 - Social Login (OAuth) (Priority: P3)

**Goal**: Enable users to sign up and log in using their Google account instead of creating a password

**Independent Test**: Click "Sign in with Google", authorize the app, and confirm the user is created and logged in without needing to provide a password

### Implementation for User Story 5

- [ ] T100 [US5] Use Context7 to fetch Supabase OAuth documentation for Google provider setup
- [ ] T101 [P] [US5] Create Google Cloud Console project and configure OAuth 2.0 credentials
- [ ] T102 [P] [US5] Configure Google OAuth provider in Supabase Dashboard with client ID and secret
- [ ] T103 [US5] Create OAuthButtons component in src/components/auth/OAuthButtons.tsx using ShadCN Button with icons
- [ ] T104 [US5] Add OAuthButtons to signup page (src/app/(auth)/signup/page.tsx)
- [ ] T105 [P] [US5] Add OAuthButtons to login page (src/app/(auth)/login/page.tsx)
- [ ] T106 [US5] Create OAuth callback route handler in src/app/auth/callback/route.ts
- [ ] T107 [US5] Implement OAuth callback logic to exchange code for session
- [ ] T108 [US5] Handle OAuth errors and redirect to login with error message
- [ ] T109 [US5] Add support for linking OAuth account to existing email/password account
- [ ] T110 [US5] Test Google OAuth flow: click button → authorize → redirect → logged in

**Checkpoint**: All user stories (P1, P2, P3) should now be independently functional

---

## Phase 8: Additional Features & Polish

**Purpose**: Supporting features and improvements across multiple user stories

### User Profile Management

- [ ] T111 [P] Create GET /api/user/profile route in src/app/api/user/profile/route.ts
- [ ] T112 [P] Create PATCH /api/user/profile route in src/app/api/user/profile/route.ts
- [ ] T113 Create settings page in src/app/(authenticated)/settings/page.tsx using ShadCN Card and Tabs
- [ ] T114 [P] Create ProfileSettings component in src/components/user/ProfileSettings.tsx using ShadCN Form components
- [ ] T115 Implement getUserProfile in UserService
- [ ] T116 [P] Implement updateUserProfile in UserService

### Authentication Logging

- [ ] T117 Create logAuthEvent function in AuthService to insert into auth_logs table
- [ ] T118 [P] Add auth logging to signup (event: 'signup')
- [ ] T119 [P] Add auth logging to login (event: 'login')
- [ ] T120 [P] Add auth logging to failed login attempts (event: 'failed_login')
- [ ] T121 [P] Add auth logging to logout (event: 'logout')
- [ ] T122 [P] Add auth logging to password reset requests (event: 'password_reset_request')
- [ ] T123 [P] Add auth logging to password reset completion (event: 'password_reset_complete')
- [ ] T124 Create GET /api/user/auth-logs route in src/app/api/user/auth-logs/route.ts
- [ ] T125 Implement getUserAuthLogs in UserService with pagination

### Magic Link (Passwordless Login)

- [ ] T126 Use Context7 to fetch Supabase magic link documentation
- [ ] T127 [P] Create MagicLinkForm component in src/components/auth/MagicLinkForm.tsx using ShadCN Form, Input, Button
- [ ] T128 Create POST /api/auth/magic-link route in src/app/api/auth/magic-link/route.ts
- [ ] T129 Implement magic link logic in AuthService calling Supabase signInWithOtp
- [ ] T130 Add rate limiting (6 requests per hour per email)
- [ ] T131 Add MagicLinkForm to login page as alternative to password
- [ ] T132 Test magic link flow: enter email → receive email → click link → logged in

### Error Handling & Loading States

- [ ] T133 [P] Create ErrorBoundary component in src/components/shared/ErrorBoundary.tsx using ShadCN Alert
- [ ] T134 [P] Create LoadingSpinner component in src/components/shared/LoadingSpinner.tsx (or use ShadCN Skeleton)
- [ ] T135 Add loading states to all auth forms using ShadCN Button loading prop and form disabled states
- [ ] T136 [P] Add error toast notifications for auth failures using ShadCN Toast/Sonner
- [ ] T137 Add retry logic with exponential backoff for Supabase API calls
- [ ] T138 Implement graceful degradation when Supabase is unavailable (show cached data)

---

## Phase 9: Testing & Security

**Purpose**: Comprehensive testing and security hardening

### Integration Tests

- [ ] T139 Use Context7 to fetch Jest and Testing Library documentation for Next.js 15
- [ ] T140 Configure Jest and React Testing Library for Next.js 15 App Router
- [ ] T141 [P] Create integration test for signup flow in tests/integration/auth.test.ts
- [ ] T142 [P] Create integration test for login flow in tests/integration/auth.test.ts
- [ ] T143 [P] Create integration test for password reset flow in tests/integration/auth.test.ts
- [ ] T144 [P] Create integration test for OAuth flow in tests/integration/auth.test.ts
- [ ] T145 Create multi-tenant isolation test in tests/integration/user-isolation.test.ts
- [ ] T146 [P] Create session management test in tests/integration/session.test.ts
- [ ] T147 Run all integration tests and verify they pass

### Unit Tests

- [ ] T148 [P] Create unit tests for AuthService in tests/unit/auth-service.test.ts
- [ ] T149 [P] Create unit tests for UserService in tests/unit/user-service.test.ts
- [ ] T150 [P] Create unit tests for rate limiting in tests/unit/rate-limit.test.ts
- [ ] T151 [P] Create unit tests for validation schemas in tests/unit/validation.test.ts
- [ ] T152 Run all unit tests and verify 80%+ coverage for services

### E2E Tests (Optional)

- [ ] T153 Use Context7 to fetch Playwright documentation for Next.js testing
- [ ] T154 Configure Playwright for E2E testing
- [ ] T155 [P] Create E2E test for signup flow in tests/e2e/signup-flow.spec.ts
- [ ] T156 [P] Create E2E test for login flow in tests/e2e/login-flow.spec.ts
- [ ] T157 [P] Create E2E test for password reset in tests/e2e/password-reset.spec.ts
- [ ] T158 Run all E2E tests and verify they pass

### Security Audits

- [ ] T159 Run Supabase advisors API (performance and security) via GET /api/advisors
- [ ] T160 Verify all RLS policies are active and enforce user_id filtering
- [ ] T161 Test SQL injection attempts on all endpoints
- [ ] T162 [P] Test authorization bypass attempts (manipulating session tokens)
- [ ] T163 [P] Verify rate limiting works correctly on all protected endpoints
- [ ] T164 Audit password hashing (verify bcrypt with 12+ rounds in Supabase)
- [ ] T165 Verify HTTPS-only cookies in production
- [ ] T166 Check for XSS vulnerabilities in user input fields
- [ ] T167 Verify CORS configuration is restrictive

---

## Phase 10: Documentation & Deployment

**Purpose**: Final documentation and production deployment

### Documentation

- [ ] T168 [P] Update README.md with authentication setup instructions
- [ ] T169 [P] Add environment variables documentation to .env.example
- [ ] T170 [P] Document API endpoints in API.md (or update OpenAPI specs)
- [ ] T171 Create user guide for account management in docs/user-guide.md
- [ ] T172 Validate all steps in quickstart.md work correctly

### Deployment

- [ ] T173 Set environment variables in Vercel Dashboard
- [ ] T174 [P] Configure production Supabase project (if different from dev)
- [ ] T175 [P] Run database migrations in production Supabase
- [ ] T176 Configure custom domain and SSL certificate
- [ ] T177 Set up Supabase custom SMTP for production emails (SendGrid or Resend)
- [ ] T178 Test email delivery in production (verification, password reset, magic link)
- [ ] T179 Enable Supabase rate limiting in production
- [ ] T180 Set up monitoring and alerting for auth failures
- [ ] T181 Create rollback plan and test it
- [ ] T182 Deploy to production and run smoke tests

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2)
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2)
- **User Story 4 (Phase 6)**: Depends on Foundational (Phase 2) and User Stories 1 + 2 (requires auth to be working)
- **User Story 5 (Phase 7)**: Depends on Foundational (Phase 2) and User Story 1 (requires signup/login flow)
- **Additional Features (Phase 8)**: Depends on relevant user stories
- **Testing (Phase 9)**: Can start once user stories are implemented
- **Deployment (Phase 10)**: Depends on all desired user stories + testing

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent but natural to do after US1
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent, uses same infrastructure as US1/US2
- **User Story 4 (P1)**: Depends on US1 + US2 (needs auth working) - Core feature for multi-tenant data
- **User Story 5 (P3)**: Depends on US1 (needs signup/login flow) - Enhancement, not blocker

### Within Each User Story

- API routes before UI components (routes can be tested independently)
- Service layer before route handlers (services contain business logic)
- Forms before pages (pages compose forms)
- Validation before implementation (catch errors early)
- Error handling after happy path (get it working, then harden)

### Parallel Opportunities

- **Setup (Phase 1)**: T002, T003 can run in parallel
- **Foundational (Phase 2)**:
  - Database migrations T008-T012 can run in parallel
  - RLS policies T016-T017, T019-T022 can run in parallel within their groups
  - Core auth infrastructure T025-T026, T028 can run in parallel
  - Email templates T032-T034 can run in parallel
- **User Story 1**: T037-T038, T042-T043 can run in parallel
- **User Story 2**: T048-T049, T055-T056, T057, T059 can run in parallel
- **User Story 3**: T064-T065, T070-T071 can run in parallel
- **User Story 4**: T078-T080, T092-T093 can run in parallel
- **User Story 5**: T101-T102, T104-T105 can run in parallel
- **Additional Features**: Most tasks in Phase 8 can run in parallel
- **Testing**: All test files within a phase can be written in parallel

---

## Parallel Example: User Story 1

```bash
# Launch UI components together:
Task: "Create signup page UI in src/app/(auth)/signup/page.tsx"
Task: "Create SignupForm component in src/components/auth/SignupForm.tsx"
Task: "Create verify-email page in src/app/(auth)/verify-email/page.tsx"

# These depend on the signup API route being complete, but can run in parallel with each other
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 4 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Account Creation)
4. Complete Phase 4: User Story 2 (Login & Sessions)
5. Complete Phase 6: User Story 4 (Multi-League Management)
6. **STOP and VALIDATE**: Test these stories independently
7. Deploy/demo - users can now create accounts, log in, and manage multiple leagues with data isolation

### Incremental Delivery

1. MVP (US1 + US2 + US4) → Test → Deploy
2. Add US3 (Password Reset) → Test → Deploy
3. Add US5 (OAuth) → Test → Deploy
4. Add Phase 8 features (Profile, Logging, Magic Link) → Test → Deploy
5. Each addition provides more value without breaking previous features

### Recommended Order

1. **Phase 1 + Phase 2**: Foundation (2-3 days)
2. **Phase 3**: Account Creation (1-2 days)
3. **Phase 4**: Login & Sessions (1-2 days)
4. **Phase 6**: Multi-League Management (2-3 days)
5. **MVP CHECKPOINT**: Test and validate (1 day)
6. **Phase 5**: Password Reset (1 day)
7. **Phase 7**: OAuth (1-2 days)
8. **Phase 8**: Additional Features (2-3 days)
9. **Phase 9**: Testing & Security (2-3 days)
10. **Phase 10**: Documentation & Deployment (1-2 days)

**Total Estimated Time**: 15-20 days for full implementation

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Always use Context7 to get the latest documentation for libraries (Supabase, Next.js, etc.)
- All database operations must use Supabase clients with RLS policies enabled
- Session management uses hybrid Supabase + Redis approach for performance
- Rate limiting uses Upstash Redis (already in stack)
- Commit after each task or logical group of related tasks
- Stop at any checkpoint to validate story independently
- Security is paramount - test data isolation thoroughly before deploying

---

## Context7 Usage Examples

```typescript
// Before implementing Supabase auth features, fetch docs:
// 1. Resolve Supabase library ID
mcp__context7__resolve-library-id({ libraryName: "supabase" })
// Returns: /supabase/supabase

// 2. Get authentication documentation
mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/supabase/supabase",
  topic: "authentication",
  tokens: 5000
})

// 3. Get SSR-specific patterns for Next.js
mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/supabase/supabase",
  topic: "ssr nextjs",
  tokens: 5000
})
```

---

## Supabase Key Patterns

### Authentication
```typescript
// Signup
const { data, error } = await supabase.auth.signUp({
  email, password,
  options: { emailRedirectTo: `${siteURL}/auth/callback` }
})

// Login
const { data, error } = await supabase.auth.signInWithPassword({ email, password })

// Logout
const { error } = await supabase.auth.signOut()

// Get current user (Server Component)
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### Data Access (with RLS)
```typescript
// Automatically filtered by user_id via RLS policies
const { data: leagues } = await supabase
  .from('leagues')
  .select('*')
  .eq('is_active', true)

// Add league for current user
const { data, error } = await supabase
  .from('leagues')
  .insert({
    user_id: user.id,
    platform: 'espn',
    platform_league_id: leagueId,
    season: 2025
  })
```

---

**Total Tasks**: 182
**Parallel Opportunities**: 50+ tasks can run in parallel within their phases
**MVP Scope**: Phases 1-4 + Phase 6 (User Stories 1, 2, 4) = ~60 tasks
**Independent Test Criteria**: Each user story has clear acceptance criteria and can be tested independently
