# Quickstart Guide: User Authentication System

**Feature**: 001-user-auth
**Date**: 2025-11-12
**Audience**: Developers implementing the authentication system

## Overview

This guide will help you set up the user authentication system for True Champion using Supabase Auth. Follow these steps to get authentication working in your local development environment and deploy to production.

**Estimated Setup Time**: 30-45 minutes

---

## Prerequisites

Before starting, ensure you have:

- [ ] Node.js 20+ installed
- [ ] Git repository cloned locally
- [ ] Existing environment variables for ESPN API and Upstash Redis
- [ ] Supabase account (sign up at https://supabase.com if needed)
- [ ] Vercel account for deployment (optional for now)

---

## Step 1: Install Dependencies

Add Supabase packages to the project:

```bash
# Install Supabase client and SSR helpers
npm install @supabase/supabase-js @supabase/ssr

# Install Supabase CLI for local development (global)
npm install -g supabase

# Or add CLI as dev dependency
npm install -D supabase
```

Verify installation:
```bash
supabase --version
# Should output: 1.x.x or higher
```

---

## Step 2: Create Supabase Project

### Option A: Remote Supabase Project (Recommended for Production)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard

2. **Create New Project**:
   - Click "New Project"
   - Organization: Select or create
   - Project Name: `true-champion` (or your preference)
   - Database Password: Generate strong password (save this!)
   - Region: Choose closest to your users (e.g., `us-east-1`)
   - Click "Create new project"

3. **Wait for project to initialize** (2-3 minutes)

4. **Copy Project Credentials**:
   - Go to "Settings" → "API"
   - Copy these values:
     - **Project URL**: `https://xyzcompany.supabase.co`
     - **Anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - **Service role key** (for admin operations): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Option B: Local Development Only

For local testing without remote database:

```bash
# Initialize Supabase locally
supabase init

# Start local Supabase services (PostgreSQL, Auth, Storage, etc.)
supabase start

# This will output local URLs and keys
```

---

## Step 3: Configure Environment Variables

Add Supabase credentials to your `.env.local` file:

```bash
# Add to .env.local

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # For development
# NEXT_PUBLIC_SITE_URL=https://truechampion.app  # For production

# Existing environment variables (keep these)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
ESPN_LEAGUE_ID=1044648461
ESPN_SEASON=2025
ESPN_SWID={E69E2F1C-7931-47C0-B4EE-2B439DDBC136}
ESPN_S2=...
```

**Security Note**: Never commit `.env.local` to version control. It's already in `.gitignore`.

---

## Step 4: Set Up Database Schema

Run database migrations to create custom tables (user_profiles, user_leagues, auth_logs).

### Option A: Via Supabase Dashboard (Easiest)

1. Go to Supabase Dashboard → "SQL Editor"
2. Click "New Query"
3. Copy and paste the migration scripts from:
   - `specs/001-user-auth/data-model.md` (see Migration Scripts section)
4. Run each migration in order:
   - `20251112000001_create_user_profiles.sql`
   - `20251112000002_create_user_leagues.sql`
   - `20251112000003_create_auth_logs.sql`
5. Click "Run" for each script

### Option B: Via Supabase CLI (For Version Control)

```bash
# Link to remote project (one-time setup)
supabase link --project-ref <your-project-ref>
# Project ref is in your Supabase project URL: https://<project-ref>.supabase.co

# Create migration files locally
mkdir -p supabase/migrations

# Copy migration scripts from data-model.md to migration files
# Then run migrations
supabase db push
```

### Verify Schema

Run this query in SQL Editor to verify tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_profiles', 'user_leagues', 'auth_logs');
```

You should see all 3 tables listed.

---

## Step 5: Configure Email Authentication

1. **Go to Authentication Settings**:
   - Supabase Dashboard → "Authentication" → "Providers"

2. **Enable Email Provider**:
   - Ensure "Email" is toggled ON
   - Check "Enable email confirmations" (users must verify email before login)

3. **Configure Email Templates** (optional):
   - Go to "Authentication" → "Email Templates"
   - Customize templates for:
     - **Confirm signup**: Verification email
     - **Magic Link**: Passwordless login email
     - **Change Email Address**: Email change confirmation
     - **Reset Password**: Password reset email
   - Use project branding, logo, colors

4. **Set Site URL**:
   - Go to "Authentication" → "URL Configuration"
   - Add Site URL: `http://localhost:3000` (for development)
   - Add Redirect URLs (for OAuth callback):
     - `http://localhost:3000/auth/callback`
     - `https://truechampion.app/auth/callback` (for production)

---

## Step 6: Create Supabase Client Utilities

Create Supabase client files in your project:

### 6.1 Browser Client (`src/lib/supabase/client.ts`)

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 6.2 Server Client (`src/lib/supabase/server.ts`)

```typescript
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
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Handle error (e.g., in Server Components during static generation)
          }
        }
      }
    }
  )
}
```

### 6.3 Middleware Client (`src/lib/supabase/middleware.ts`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        }
      }
    }
  )

  // IMPORTANT: Call getUser() to refresh session
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to login if not authenticated and trying to access protected route
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

### 6.4 Middleware (`src/middleware.ts`)

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
```

---

## Step 7: Generate TypeScript Types from Database Schema

Generate types for type-safe database access:

```bash
# If using remote Supabase project
supabase gen types typescript --linked > src/types/database.ts

# If using local Supabase
supabase gen types typescript --local > src/types/database.ts
```

This creates a `database.ts` file with TypeScript interfaces for all your tables.

**Use types in your code**:
```typescript
import { Database } from '@/types/database'

type UserLeague = Database['public']['Tables']['user_leagues']['Row']
type InsertUserLeague = Database['public']['Tables']['user_leagues']['Insert']
```

---

## Step 8: Test Authentication Flow

### 8.1 Create a Simple Signup Page

Create `src/app/(auth)/signup/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
        data: {
          full_name: fullName
        }
      }
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Success! Check your email for verification link.')
    }

    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h1>Sign Up</h1>
      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '10px' }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '10px' }}
        />
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '10px' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '10px 20px', width: '100%' }}
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
      {message && <p style={{ marginTop: '20px' }}>{message}</p>}
    </div>
  )
}
```

### 8.2 Create Auth Callback Handler

Create `src/app/auth/callback/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

### 8.3 Test the Flow

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/signup

3. Fill out the signup form with:
   - Full Name: Test User
   - Email: your-email@example.com
   - Password: TestPass123

4. Click "Sign Up"

5. Check your email for verification link

6. Click the verification link

7. You should be redirected to `/dashboard` (create a basic dashboard page if needed)

---

## Step 9: Verify Setup

Run these checks to ensure everything is working:

### Check 1: User Created in Database

```sql
-- Run in Supabase SQL Editor
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
```

You should see your test user.

### Check 2: Session Active

```sql
-- Check active sessions
SELECT user_id, created_at, expires_at
FROM auth.sessions
WHERE user_id = '<your-user-id>'
ORDER BY created_at DESC;
```

### Check 3: Middleware Working

- Try accessing `/dashboard` without logging in → should redirect to `/login`
- Log in → should allow access to `/dashboard`

---

## Step 10: Configure Google OAuth (Phase 2 - Optional)

**Note**: This step is optional for initial MVP. Implement after email/password auth is working.

1. **Create Google Cloud Project**:
   - Go to https://console.cloud.google.com
   - Create new project or select existing
   - Enable "Google+ API"

2. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs:
     - `https://xyzcompany.supabase.co/auth/v1/callback` (your Supabase URL)
   - Copy **Client ID** and **Client Secret**

3. **Configure in Supabase**:
   - Go to Supabase Dashboard → "Authentication" → "Providers"
   - Find "Google" provider
   - Toggle ON
   - Enter Client ID and Client Secret
   - Save

4. **Test Google Login**:
   ```typescript
   const { data, error } = await supabase.auth.signInWithOAuth({
     provider: 'google',
     options: {
       redirectTo: `${location.origin}/auth/callback`
     }
   })
   ```

---

## Troubleshooting

### Issue: "Invalid API key"

**Solution**: Check that environment variables are correctly set and restart dev server.

```bash
# Verify variables are loaded
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# If empty, check .env.local exists and restart server
npm run dev
```

### Issue: "Email not sent"

**Solution**:
1. Check Supabase logs: Dashboard → "Logs" → "Auth Logs"
2. Verify email provider is enabled: "Authentication" → "Providers" → "Email" (should be ON)
3. Check spam folder for verification email
4. For production, configure custom SMTP (Settings → "Project Settings" → "SMTP Settings")

### Issue: Redirect loop on protected routes

**Solution**: Ensure middleware is not redirecting authenticated users. Check that your middleware has correct logic:

```typescript
if (
  !user &&
  !request.nextUrl.pathname.startsWith('/login') &&
  !request.nextUrl.pathname.startsWith('/signup') &&
  !request.nextUrl.pathname.startsWith('/auth')
) {
  // Only redirect if not authenticated AND not already on auth page
  return NextResponse.redirect(new URL('/login', request.url))
}
```

### Issue: "Database error" when creating user

**Solution**: Check that migrations ran successfully. Verify tables exist:

```sql
SELECT * FROM information_schema.tables
WHERE table_schema = 'public';
```

### Issue: TypeScript errors with database types

**Solution**: Regenerate types after schema changes:

```bash
supabase gen types typescript --linked > src/types/database.ts
```

---

## Next Steps

After completing this quickstart:

1. **Implement remaining auth pages**:
   - [ ] Login page (`/login`)
   - [ ] Forgot password page (`/forgot-password`)
   - [ ] Reset password page (`/reset-password`)
   - [ ] Verify email page (`/verify-email`)

2. **Add user-scoped data**:
   - [ ] Update ESPN API service to accept `userId`
   - [ ] Add league association (user_leagues table)
   - [ ] Implement league selector component

3. **Implement rate limiting**:
   - [ ] Create rate limit utilities (`lib/auth/rate-limit.ts`)
   - [ ] Apply to login, signup, password reset endpoints

4. **Add auth logging**:
   - [ ] Create auth log service (`services/auth-service.ts`)
   - [ ] Log all auth events to `auth_logs` table

5. **Write tests**:
   - [ ] Unit tests for auth services
   - [ ] Integration tests for signup/login flows
   - [ ] E2E tests with Playwright

6. **Deploy to production**:
   - [ ] Update environment variables in Vercel
   - [ ] Configure production Supabase project
   - [ ] Test email delivery in production
   - [ ] Monitor auth logs for issues

---

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js 15 with Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [True Champion Project Documentation](../../README.md)
- [Feature Specification](./spec.md)
- [Data Model](./data-model.md)
- [API Contracts](./contracts/)

---

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section above
- Review Supabase logs in the Dashboard
- Consult the [feature specification](./spec.md) for requirements
- Contact the team via Slack or GitHub issues

**Quickstart Completed**: You're now ready to build authentication features! 🚀
