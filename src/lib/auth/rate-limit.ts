/**
 * Rate Limiting utilities using Upstash Redis
 *
 * Implements IP-based rate limiting to prevent brute force attacks
 * and abuse of authentication endpoints.
 *
 * Rate limits (from SEC-011, FR-018):
 * - Login attempts: 5 per 15 minutes per IP
 * - Password reset: 3 per hour per email
 * - Email verification resend: 3 per hour per email
 * - Magic link: 6 per hour per email
 */

import { redis } from '@/lib/redis'

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
  retryAfter?: number // seconds until reset
}

export interface RateLimitConfig {
  key: string // Redis key for this rate limit
  limit: number // Maximum attempts allowed
  windowMs: number // Time window in milliseconds
}

/**
 * Check if the rate limit has been exceeded
 * Uses the sliding window algorithm with Redis INCR and EXPIRE
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const { key, limit, windowMs } = config

  try {
    // Increment the counter for this key
    const count = await redis.incr(key)

    // If this is the first attempt, set the expiry
    if (count === 1) {
      await redis.pexpire(key, windowMs)
    }

    // Get the remaining TTL
    const ttl = await redis.ttl(key)
    const resetDate = new Date(Date.now() + (ttl * 1000))

    const remaining = Math.max(0, limit - count)
    const success = count <= limit

    return {
      success,
      limit,
      remaining,
      reset: resetDate,
      retryAfter: success ? undefined : ttl,
    }
  } catch (error) {
    // On Redis failure, allow the request (fail open)
    // Log the error for monitoring
    console.error('Rate limit check failed:', error)

    return {
      success: true,
      limit,
      remaining: limit,
      reset: new Date(Date.now() + windowMs),
    }
  }
}

/**
 * Reset the rate limit for a given key
 * Useful after successful operations (e.g., successful login)
 */
export async function resetRateLimit(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error('Failed to reset rate limit:', error)
  }
}

/**
 * Get the client IP address from the request
 * Handles various headers from proxies and CDNs
 */
export function getClientIP(request: Request): string {
  // Check common headers for the real client IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }

  // Cloudflare
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP.trim()
  }

  // Vercel
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for')
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim()
  }

  // Fallback to unknown (shouldn't happen in production)
  return 'unknown'
}

/**
 * Rate limit configurations for different operations
 */
export const RateLimits = {
  LOGIN: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  PASSWORD_RESET: {
    limit: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  EMAIL_VERIFICATION: {
    limit: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  MAGIC_LINK: {
    limit: 6,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  SIGNUP: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
} as const

/**
 * Helper function to check login rate limit
 */
export async function checkLoginRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `rate_limit:login:${ip}`,
    ...RateLimits.LOGIN,
  })
}

/**
 * Helper function to check password reset rate limit
 */
export async function checkPasswordResetRateLimit(email: string): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `rate_limit:password_reset:${email.toLowerCase()}`,
    ...RateLimits.PASSWORD_RESET,
  })
}

/**
 * Helper function to check email verification rate limit
 */
export async function checkEmailVerificationRateLimit(email: string): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `rate_limit:email_verification:${email.toLowerCase()}`,
    ...RateLimits.EMAIL_VERIFICATION,
  })
}

/**
 * Helper function to check magic link rate limit
 */
export async function checkMagicLinkRateLimit(email: string): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `rate_limit:magic_link:${email.toLowerCase()}`,
    ...RateLimits.MAGIC_LINK,
  })
}

/**
 * Helper function to check signup rate limit
 */
export async function checkSignupRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `rate_limit:signup:${ip}`,
    ...RateLimits.SIGNUP,
  })
}

/**
 * Format rate limit error response
 */
export function formatRateLimitError(result: RateLimitResult): {
  message: string
  retryAfter: number
} {
  const minutes = result.retryAfter ? Math.ceil(result.retryAfter / 60) : 0

  return {
    message: `Too many attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
    retryAfter: result.retryAfter || 0,
  }
}

/**
 * Example usage in an API route:
 *
 * import { checkLoginRateLimit, getClientIP, formatRateLimitError } from '@/lib/auth/rate-limit'
 *
 * export async function POST(request: Request) {
 *   const ip = getClientIP(request)
 *   const rateLimitResult = await checkLoginRateLimit(ip)
 *
 *   if (!rateLimitResult.success) {
 *     const error = formatRateLimitError(rateLimitResult)
 *     return NextResponse.json(
 *       { error: error.message },
 *       {
 *         status: 429,
 *         headers: {
 *           'Retry-After': error.retryAfter.toString(),
 *           'X-RateLimit-Limit': rateLimitResult.limit.toString(),
 *           'X-RateLimit-Remaining': '0',
 *           'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
 *         },
 *       }
 *     )
 *   }
 *
 *   // Proceed with login logic...
 * }
 */
