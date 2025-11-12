# Research: User Authentication & Authorization System

**Feature**: 001-user-auth
**Date**: 2025-11-12
**Phase**: 0 - Research & Decision Making

## Purpose

This document consolidates research findings to resolve all "NEEDS CLARIFICATION" items from the Technical Context and inform design decisions for implementing Supabase authentication in the True Champion application.

---

## Research Areas

### 1. Supabase Auth Integration with Next.js 15 App Router

#### Decision: Use @supabase/ssr for Server Components Support

**Rationale**:
- Next.js 15 App Router uses React Server Components (RSC) as the default rendering strategy
- The `@supabase/ssr` package provides specialized utilities for managing authentication in server-side contexts
- Offers three client creation patterns optimized for different execution contexts:
  1. `createBrowserClient()` - For Client Components
  2. `createServerClient()` - For Server Components and API Routes
  3. Middleware-specific client - For Next.js middleware session refresh

**Key Benefits**:
- Automatic cookie-based session management compatible with Server Components
- Session tokens automatically refreshed and propagated across server and client
- Type-safe with TypeScript support
- Built-in security: PKCE flow enabled by default, secure cookie handling

**Implementation Pattern**:
```typescript
// lib/supabase/server.ts - For Server Components
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        }
      }
    }
  )
}
```

**Alternatives Considered**:
- `@supabase/auth-helpers-nextjs` - **Rejected**: Deprecated in favor of @supabase/ssr
- Direct `@supabase/supabase-js` usage - **Rejected**: Requires manual cookie handling, not optimized for RSC
- Custom JWT implementation - **Rejected**: Reinventing the wheel, less secure, no built-in refresh logic

**References**:
- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Context7: Supabase Auth with Next.js middleware](https://supabase.com/docs/guides/auth/server-side/nextjs_querygroups=router&router=app)

---

### 2. Session Management Strategy

#### Decision: Hybrid Supabase + Redis Caching

**Rationale**:
- **Primary source of truth**: Supabase Auth (managed JWT tokens, automatic refresh, secure)
- **Performance layer**: Redis caching for frequently accessed session metadata
- Session validation latency requirement: < 100ms (p95)
- Supabase Auth handles token refresh automatically via @supabase/ssr middleware
- Redis provides sub-10ms session lookups for high-traffic scenarios

**Architecture**:
1. **Session Creation**: Supabase Auth creates JWT access_token + refresh_token
2. **Caching**: Cache session metadata in Redis with TTL matching token expiry (7 days)
3. **Validation**:
   - Fast path: Check Redis cache first (< 10ms)
   - Miss path: Validate with Supabase, update cache
4. **Refresh**: Middleware automatically refreshes tokens via Supabase SDK
5. **Invalidation**: Logout clears both Supabase session and Redis cache

**Redis Key Pattern**:
```
session:{user_id}                    # Session metadata
session:token:{access_token_hash}    # Token-to-user mapping (optional for quick lookups)
```

**Cache Data Structure**:
```typescript
interface CachedSession {
  userId: string
  email: string
  expiresAt: number
  lastRefreshedAt: number
}
```

**Why Not Serverless Edge-Compatible Session Storage?**
- Upstash Redis is already in the stack and is edge-compatible
- Provides sub-10ms latency globally via edge caching
- No additional infrastructure needed

**Alternatives Considered**:
- **Database-only sessions** - **Rejected**: Too slow for 100ms validation requirement
- **JWT-only (stateless)** - **Rejected**: Cannot forcibly invalidate sessions (security requirement)
- **In-memory sessions** - **Rejected**: Not compatible with serverless architecture, no persistence

**References**:
- [Supabase Auth Session Management](https://github.com/supabase/supabase-js/blob/master/packages/core/auth-js/README.md)
- Existing Upstash Redis integration in True Champion

---

### 3. Authentication Methods Implementation

#### Decision: Email/Password, Magic Link, and OAuth (Google)

**Implementation Priorities**:

**Phase 1 (MVP)**: Email/Password + Magic Link
- Email/password covers majority of users who prefer traditional auth
- Magic link provides passwordless option with minimal implementation complexity
- Both leverage Supabase Auth's built-in email templates

**Phase 2 (Enhancement)**: Google OAuth
- Most requested social login provider
- Supabase provides built-in Google OAuth integration
- Requires additional Supabase project configuration (Google Cloud Console setup)

**Email/Password Flow**:
```typescript
// Signup
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${siteURL}/auth/callback`,
    data: {
      full_name: displayName
    }
  }
})

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
})
```

**Magic Link Flow**:
```typescript
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${siteURL}/auth/callback`
  }
})
```

**Google OAuth Flow (Phase 2)**:
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${siteURL}/auth/callback`,
    scopes: 'email profile'
  }
})
```

**Why This Approach?**
- Supabase handles all complexity: email delivery, token generation, security
- Magic link uses PKCE flow by default (more secure than traditional magic links)
- OAuth setup is deferred to Phase 2 to avoid external service dependencies during MVP

**Alternatives Considered**:
- **Phone/SMS auth** - **Rejected**: Not in requirements, adds costs (Twilio/similar)
- **Apple Sign In** - **Rejected**: Lower priority than Google, deferred to Phase 3
- **Passkeys/WebAuthn** - **Rejected**: Cutting edge but limited browser support, future enhancement

**References**:
- [Supabase Auth Patterns](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Magic Link with PKCE](https://supabase.com/docs/guides/auth/auth-magic-link)
- [OAuth Configuration](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)

---

### 4. Authorization & Data Isolation Strategy

#### Decision: Row Level Security (RLS) + Middleware Checks

**Multi-Layered Authorization**:

**Layer 1: Database (Supabase RLS Policies)**
- RLS policies enforce user_id filtering at the database level
- Prevents data leakage even if application code has bugs
- Example policy:
```sql
CREATE POLICY "Users can only access their own leagues"
ON user_leagues
FOR SELECT
USING (auth.uid() = user_id);
```

**Layer 2: API Route Middleware**
- Next.js middleware validates session before allowing route access
- Checks user authentication status
- Redirects unauthenticated users to login
```typescript
export async function middleware(request: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return await updateSession(request) // Refresh tokens
}
```

**Layer 3: Service Layer**
- Services explicitly filter by authenticated user ID
- Defensive programming: always include user_id in queries
```typescript
async function getUserLeagues(userId: string) {
  const { data } = await supabase
    .from('user_leagues')
    .select('*')
    .eq('user_id', userId) // Explicit user scoping

  return data
}
```

**Why This Multi-Layered Approach?**
- Defense in depth: Multiple layers prevent single points of failure
- RLS is the ultimate safeguard (database-level enforcement)
- Middleware provides fast rejection before hitting database
- Service layer adds application logic (e.g., additional business rules)

**Data Isolation Testing**:
- Integration test: Create User A and User B, add leagues, verify User A cannot access User B's data via any endpoint
- SQL injection testing: Attempt to bypass user_id filters with malicious inputs
- Authorization bypass testing: Manipulate session tokens to access other users' data

**Alternatives Considered**:
- **Application-only authorization** - **Rejected**: Too risky, no database-level safeguard
- **JWT claims-based authorization** - **Rejected**: Supabase RLS is more secure and easier
- **External authorization service (e.g., Auth0 Fine-Grained Authorization)** - **Rejected**: Overkill for this use case, Supabase RLS sufficient

**References**:
- [Supabase Row Level Security](https://github.com/supabase/supabase-js/blob/master/packages/core/realtime-js/example/README.md)
- [Next.js Middleware for Auth](https://supabase.com/docs/guides/auth/server-side/nextjs)

---

### 5. Rate Limiting Implementation

#### Decision: IP-Based Rate Limiting with Upstash Redis

**Requirements**:
- 5 failed login attempts per 15 minutes per IP address (SEC-011, FR-018)
- Prevent brute force attacks
- Must work in serverless environment (Vercel)

**Implementation Strategy**:

**Using Upstash Redis for Rate Limit Tracking**:
```typescript
// lib/auth/rate-limit.ts
import { redis } from '@/lib/redis'

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

export async function checkLoginRateLimit(
  ip: string
): Promise<RateLimitResult> {
  const key = `rate_limit:login:${ip}`
  const limit = 5
  const windowMs = 15 * 60 * 1000 // 15 minutes

  const attempts = await redis.incr(key)

  if (attempts === 1) {
    // First attempt, set expiry
    await redis.pexpire(key, windowMs)
  }

  const ttl = await redis.ttl(key)
  const resetAt = new Date(Date.now() + (ttl * 1000))

  return {
    allowed: attempts <= limit,
    remaining: Math.max(0, limit - attempts),
    resetAt
  }
}

export async function resetLoginRateLimit(ip: string): Promise<void> {
  const key = `rate_limit:login:${ip}`
  await redis.del(key)
}
```

**Rate Limit Response**:
- When limit exceeded: HTTP 429 Too Many Requests
- Response includes `Retry-After` header with seconds until reset
- Error message: "Too many login attempts. Please try again in X minutes."

**Additional Rate Limits**:
- Password reset requests: 3 per hour per email
- Email verification resends: 3 per hour per email
- OTP/Magic link sends: 6 per hour per email (Supabase built-in: 360 per hour total)

**Why Upstash Redis?**
- Already in the stack
- Supports INCR, EXPIRE operations natively
- Edge-compatible (works in Vercel Edge Runtime)
- Sub-10ms latency for rate limit checks

**Alternatives Considered**:
- **Vercel Edge Config** - **Rejected**: Read-only, cannot increment counters
- **Database-based rate limiting** - **Rejected**: Too slow (adds 50-100ms per request)
- **In-memory rate limiting** - **Rejected**: Doesn't work in serverless (each function invocation is stateless)
- **Third-party service (e.g., Upstash Rate Limiting SDK)** - **Considered**: Simpler API, but adds dependency. Current approach is lightweight enough.

**References**:
- [Supabase Rate Limits](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Redis Rate Limiting Patterns](https://redis.io/docs/latest/develop/use/patterns/rate-limiting/)

---

### 6. Email Delivery Configuration

#### Decision: Supabase Built-In SMTP (Initial), SendGrid/Resend (Production)

**Development/Staging**:
- Use Supabase's built-in SMTP for development
- Templates managed via Supabase Dashboard
- No additional setup required

**Production**:
- Integrate dedicated email service (SendGrid or Resend) for better deliverability
- Supabase supports custom SMTP configuration
- Provides better analytics, bounce handling, reputation management

**Email Templates Required**:
1. **Email Verification** (signup)
   - Subject: "Verify your True Champion account"
   - CTA: "Verify Email" button
   - Token validity: 24 hours

2. **Magic Link** (passwordless login)
   - Subject: "Your True Champion login link"
   - CTA: "Log In" button
   - Token validity: 1 hour

3. **Password Reset**
   - Subject: "Reset your True Champion password"
   - CTA: "Reset Password" button
   - Token validity: 1 hour

4. **Password Changed** (notification)
   - Subject: "Your password was changed"
   - Informational only

**Template Customization**:
- Supabase templates support Go template syntax
- Can include custom branding, logo, colors
- Variables available: `{{ .SiteURL }}`, `{{ .TokenHash }}`, `{{ .Email }}`

**Why Deferred Production Email Service?**
- Supabase built-in SMTP is sufficient for MVP and development
- Avoid premature optimization (SendGrid setup can be done later)
- Reduces initial dependencies and configuration complexity

**Alternatives Considered**:
- **Custom email service from day 1** - **Rejected**: Premature, Supabase SMTP works for MVP
- **No email verification** - **Rejected**: Security requirement (SEC-002, FR-002)
- **Third-party auth service with email (e.g., Auth0)** - **Rejected**: Supabase Auth is already chosen

**References**:
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Custom SMTP Configuration](https://supabase.com/docs/guides/deployment/going-into-prod)

---

### 7. Testing Strategy

#### Decision: Multi-Level Testing with Supabase Local Development

**Testing Pyramid**:

**Unit Tests (Jest)**:
- Auth service functions (signup, login, logout logic)
- Validation functions (Zod schemas)
- Rate limiting logic
- Session management helpers
- **Target**: 80%+ code coverage for services

**Integration Tests (Jest + Supabase Local)**:
- Full authentication flows (signup → verify → login → session)
- User data isolation (User A cannot access User B's data)
- Session caching (Redis + Supabase sync)
- Rate limit enforcement
- **Setup**: Use Supabase CLI to run local instance
- **Target**: Cover all critical user journeys

**E2E Tests (Playwright)**:
- Complete user flows in browser
- Signup → Email verification → Login → Dashboard
- Password reset flow
- OAuth flow (Phase 2)
- **Target**: Cover all P1 user stories

**Performance Tests (Artillery or k6)**:
- Login endpoint: < 2s (p95) under load
- Session validation: < 100ms (p95)
- Concurrent users: 100-1000 simultaneous sessions
- **Target**: Validate performance requirements before production

**Supabase Local Development Setup**:
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase project
supabase init

# Start local services (PostgreSQL, Auth, Storage, Realtime)
supabase start

# Generate TypeScript types from database schema
supabase gen types typescript --local > src/types/database.ts

# Run migrations
supabase db reset

# Stop services
supabase stop
```

**Test Data Management**:
- Use Supabase seed files for consistent test data
- Reset database between integration tests
- Use test-specific email addresses (e.g., `test+{uuid}@example.com`)

**Why Local Supabase Instance?**
- Tests don't depend on remote services (faster, more reliable)
- Can run tests in CI/CD without external dependencies
- Full control over test environment (reset, seed data)

**Alternatives Considered**:
- **Mocking Supabase client** - **Rejected**: Too brittle, doesn't test real integration
- **Shared test Supabase project** - **Rejected**: Slower, conflicts between tests, flaky
- **No integration tests** - **Rejected**: Too risky for auth system

**References**:
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Testing Supabase Apps](https://supabase.com/docs/guides/getting-started/tutorials/with-react)

---

### 8. Database Schema Design

#### Decision: Extend Supabase Auth with Custom Tables

**Supabase Provides (Built-In)**:
- `auth.users` - User accounts (email, password hash, email confirmation, etc.)
- `auth.sessions` - Active sessions (access tokens, refresh tokens)
- `auth.identities` - OAuth provider linkages
- `auth.mfa_factors` - Multi-factor auth (future)

**Custom Tables Needed**:

**1. user_leagues** (Many-to-Many: Users to ESPN Leagues)
```sql
CREATE TABLE user_leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  espn_league_id VARCHAR(50) NOT NULL,
  league_name VARCHAR(255),
  season_year INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,

  UNIQUE(user_id, espn_league_id, season_year)
);

CREATE INDEX idx_user_leagues_user_id ON user_leagues(user_id);
CREATE INDEX idx_user_leagues_espn_id ON user_leagues(espn_league_id);

-- RLS Policy
ALTER TABLE user_leagues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own leagues"
ON user_leagues
FOR ALL
USING (auth.uid() = user_id);
```

**2. auth_logs** (Security Audit Trail)
```sql
CREATE TABLE auth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'failed_login', 'password_reset', etc.
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX idx_auth_logs_created_at ON auth_logs(created_at DESC);
CREATE INDEX idx_auth_logs_event_type ON auth_logs(event_type);

-- RLS Policy: Users can view their own logs, admins can view all
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own auth logs"
ON auth_logs
FOR SELECT
USING (auth.uid() = user_id);
```

**3. user_profiles** (Extended User Metadata)
```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own profile"
ON user_profiles
FOR ALL
USING (auth.uid() = user_id);
```

**Why Extend Supabase Auth Instead of Custom User Table?**
- Supabase Auth handles all authentication complexity (password hashing, token management, email verification)
- Built-in security features (rate limiting, breach detection, session management)
- Auto-generated types and SDK methods
- Eliminates need to reinvent authentication infrastructure

**Migration Strategy**:
- Use Supabase migrations (SQL files in `supabase/migrations/`)
- Migrations are version-controlled with application code
- Can run migrations in CI/CD pipeline
- Supports rollback with "down" migrations

**References**:
- [Supabase Database Schema](https://github.com/supabase/supabase-js/blob/master/packages/core/realtime-js/example/README.md)
- [Row Level Security Policies](https://supabase.com/docs/guides/auth/row-level-security)

---

## Summary of Decisions

| Research Area | Decision | Rationale |
|--------------|----------|-----------|
| **Supabase Integration** | Use `@supabase/ssr` with Next.js 15 App Router | Optimized for React Server Components, automatic session refresh, type-safe |
| **Session Management** | Hybrid Supabase + Redis caching | Meets < 100ms validation requirement, secure, scalable |
| **Auth Methods** | Email/Password (Phase 1), Magic Link (Phase 1), Google OAuth (Phase 2) | Covers majority use cases, leverages Supabase built-ins, deferred complexity |
| **Authorization** | Multi-layered: RLS + Middleware + Service Layer | Defense in depth, database-level enforcement, prevents data leaks |
| **Rate Limiting** | IP-based with Upstash Redis | Prevents brute force, edge-compatible, already in stack |
| **Email Delivery** | Supabase SMTP (MVP), SendGrid/Resend (Production) | Avoids premature optimization, sufficient for initial launch |
| **Testing** | Unit + Integration (local Supabase) + E2E (Playwright) | Comprehensive coverage, fast, reliable, doesn't depend on remote services |
| **Database Schema** | Extend Supabase Auth with custom tables | Leverages Supabase security features, RLS for data isolation |

---

## Dependencies & Setup Requirements

**NPM Packages to Install**:
```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D supabase  # CLI for local development
```

**Environment Variables Required**:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # For admin operations

# Existing Redis (no changes needed)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Application URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # For dev
NEXT_PUBLIC_SITE_URL=https://truechampion.app  # For production
```

**Supabase Project Setup**:
1. Create new Supabase project at https://supabase.com
2. Copy project URL and anon key to `.env.local`
3. Enable email auth provider in Supabase Dashboard → Authentication → Providers
4. Configure email templates in Supabase Dashboard → Authentication → Email Templates
5. (Phase 2) Configure Google OAuth provider with client ID/secret

**Local Development Setup**:
```bash
# Install Supabase CLI
npm install -g supabase

# Link to remote project (optional, for type generation)
supabase link --project-ref <your-project-ref>

# Generate TypeScript types from remote schema
supabase gen types typescript --linked > src/types/database.ts

# Start local Supabase (for testing)
supabase start
```

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| **Supabase outage** | Users cannot log in, new signups blocked | Low (99.9% SLA) | Cache sessions in Redis, graceful degradation (show cached dashboard) |
| **Email deliverability issues** | Users don't receive verification/reset emails | Medium | Monitor bounce rates, switch to SendGrid for production, provide alternative contact |
| **Data isolation bug** | User A sees User B's leagues | Critical | Comprehensive integration tests, RLS as safeguard, code review |
| **Rate limit bypass** | Brute force attack succeeds | Medium | IP-based + email-based rate limits, monitor auth logs, add CAPTCHA if needed |
| **Session token leak** | Attacker gains unauthorized access | High | Short-lived tokens (7 day max), HTTPS only, secure cookie settings, ability to force logout |
| **Migration complexity** | Existing users lose data | Medium | Phased migration, backup data, rollback plan, test with production data copy |

---

## Next Steps (Phase 1 Design)

1. Create data-model.md with detailed entity definitions
2. Generate API contracts (OpenAPI specs for auth and user endpoints)
3. Create quickstart.md for developer onboarding
4. Update agent context with new technologies (Supabase Auth, @supabase/ssr)
5. Re-evaluate Constitution Check with design artifacts

---

**Research Completed**: 2025-11-12
**Approved For Phase 1**: ✅
