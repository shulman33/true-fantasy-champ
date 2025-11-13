/**
 * POST /api/auth/resend-verification
 *
 * Resend email verification link to user
 */

import { NextRequest, NextResponse } from 'next/server'
import { resendVerificationEmail } from '@/services/auth-service'
import { validateInput, resendVerificationSchema } from '@/lib/auth/validation'
import { checkEmailVerificationRateLimit, formatRateLimitError } from '@/lib/auth/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body first
    const body = await request.json()
    const validation = validateInput(resendVerificationSchema, body)

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

    // Rate limit check: 3 requests per hour per email
    const rateLimit = await checkEmailVerificationRateLimit(validation.data.email)

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

    // Call auth service to resend verification email
    const result = await resendVerificationEmail(validation.data)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    })
  } catch (error) {
    console.error('[API] /api/auth/resend-verification error:', error)
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
