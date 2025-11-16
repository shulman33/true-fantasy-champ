/**
 * OAuth Callback Handler
 *
 * Handles OAuth redirects from providers (Google, GitHub, Apple)
 * Exchanges authorization code for session and redirects to app
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  // Handle OAuth errors (user cancelled, etc.)
  if (error) {
    console.error('[OAuth Callback] Error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(
        `/login?error=oauth_failed&message=${encodeURIComponent(errorDescription || 'OAuth authentication failed')}`,
        requestUrl.origin
      )
    )
  }

  // Code should be present for successful OAuth flow
  if (!code) {
    console.error('[OAuth Callback] No code provided')
    return NextResponse.redirect(
      new URL('/login?error=oauth_failed&message=No+authorization+code+received', requestUrl.origin)
    )
  }

  try {
    const supabase = await createClient()

    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[OAuth Callback] Exchange error:', exchangeError)
      return NextResponse.redirect(
        new URL(
          `/login?error=oauth_failed&message=${encodeURIComponent(exchangeError.message)}`,
          requestUrl.origin
        )
      )
    }

    // Log successful OAuth login
    if (data.user) {
      try {
        // Determine OAuth provider from user metadata
        const provider = data.user.app_metadata.provider || 'oauth'

        // Log to auth_logs table
        await supabase.from('auth_logs').insert({
          user_id: data.user.id,
          event_type: 'login',
          success: true,
          metadata: {
            method: provider,
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            user_agent: request.headers.get('user-agent'),
          },
        })
      } catch (logError) {
        // Don't fail the auth flow if logging fails
        console.error('[OAuth Callback] Logging error:', logError)
      }
    }

    // Redirect to next URL or dashboard
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  } catch (error) {
    console.error('[OAuth Callback] Unexpected error:', error)
    return NextResponse.redirect(
      new URL('/login?error=oauth_failed&message=An+unexpected+error+occurred', requestUrl.origin)
    )
  }
}
