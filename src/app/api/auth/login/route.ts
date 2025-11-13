/**
 * POST /api/auth/login
 *
 * Authenticate user with email and password
 */

import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@/services/auth-service'
import { validateInput, loginSchema } from '@/lib/auth/validation'
import { checkLoginRateLimit, getClientIP, formatRateLimitError } from '@/lib/auth/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limit check: 5 failed attempts per 15 minutes per IP
    const ip = getClientIP(request)
    const rateLimit = await checkLoginRateLimit(ip)

    if (!rateLimit.success) {
      const error = formatRateLimitError(rateLimit)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'rate_limit_exceeded',
            message: error.message,
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': error.retryAfter.toString(),
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.reset.toISOString(),
          },
        }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = validateInput(loginSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'validation_error',
            message: validation.error,
            fieldErrors: validation.fieldErrors,
          },
        },
        { status: 400 }
      )
    }

    // Call auth service to sign in
    const result = await signIn(validation.data)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 401 }
      )
    }

    // Return success with user and session data
    return NextResponse.json({
      success: true,
      user: {
        id: result.user!.id,
        email: result.user!.email,
        emailVerified: result.user!.email_confirmed_at != null,
        displayName: result.user!.user_metadata?.display_name,
      },
      session: {
        accessToken: result.session!.access_token,
        expiresAt: result.session!.expires_at,
      },
    })
  } catch (error) {
    console.error('[API] /api/auth/login error:', error)
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
