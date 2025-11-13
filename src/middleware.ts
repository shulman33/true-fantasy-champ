/**
 * Next.js Middleware for Supabase Authentication
 *
 * This middleware:
 * 1. Refreshes the user's session automatically (prevents premature logout)
 * 2. Redirects unauthenticated users to login for protected routes
 * 3. Manages cookie synchronization between client and server
 *
 * CRITICAL: Do NOT add any logic between createServerClient and supabase.auth.getUser()
 * as this can cause session synchronization issues and random logouts.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth/callback',
  '/error',
]

/**
 * Check if the given path is a public route
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          // Update cookies in the request for the next middleware/handler
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

          // Create a new response with updated cookies
          supabaseResponse = NextResponse.next({
            request,
          })

          // Set cookies in the response for the browser
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: Do not add any logic between createServerClient and auth.getUser()
  // This ensures session refresh happens correctly and prevents debugging nightmares

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login for protected routes
  if (!user && !isPublicRoute(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Preserve the original destination for post-login redirect
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // CRITICAL: You MUST return the supabaseResponse object as-is
  // Do NOT create a new NextResponse without copying the cookies
  // This ensures the browser and server stay in sync
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (SEO files)
     * - images and other static assets (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
