/**
 * GET /api/auth/session
 *
 * Get the current user's session information
 */

import { NextResponse } from 'next/server'
import { validateSession } from '@/services/auth-service'

export async function GET() {
  try {
    // Validate current session
    const result = await validateSession()

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 401 }
      )
    }

    // Return session data
    return NextResponse.json({
      success: true,
      user: {
        id: result.user!.id,
        email: result.user!.email,
        emailVerified: result.user!.email_confirmed_at != null,
        displayName: result.user!.user_metadata?.display_name,
        createdAt: result.user!.created_at,
      },
      session: result.session
        ? {
            accessToken: result.session.access_token,
            expiresAt: result.session.expires_at,
          }
        : undefined,
    })
  } catch (error) {
    console.error('[API] /api/auth/session error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'server_error',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}
