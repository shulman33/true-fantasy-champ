/**
 * Rate Limiting utilities using Upstash Redis and @upstash/ratelimit
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

import { Ratelimit } from '@upstash/ratelimit'
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
 * Create Ratelimit instances for each type of operation
 * Using sliding window algorithm for more accurate rate limiting
 */

// Login rate limiter (5 requests per 15 minutes)
const loginRatelimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(RateLimits.LOGIN.limit, `${RateLimits.LOGIN.windowMs} ms`),
  prefix: 'rate_limit:login',
})

// Signup rate limiter (5 requests per 15 minutes)
const signupRatelimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(RateLimits.SIGNUP.limit, `${RateLimits.SIGNUP.windowMs} ms`),
  prefix: 'rate_limit:signup',
})

// Password reset rate limiter (3 requests per hour)
const passwordResetRatelimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    RateLimits.PASSWORD_RESET.limit,
    `${RateLimits.PASSWORD_RESET.windowMs} ms`
  ),
  prefix: 'rate_limit:password_reset',
})

// Email verification rate limiter (3 requests per hour)
const emailVerificationRatelimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    RateLimits.EMAIL_VERIFICATION.limit,
    `${RateLimits.EMAIL_VERIFICATION.windowMs} ms`
  ),
  prefix: 'rate_limit:email_verification',
})

// Magic link rate limiter (6 requests per hour)
const magicLinkRatelimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    RateLimits.MAGIC_LINK.limit,
    `${RateLimits.MAGIC_LINK.windowMs} ms`
  ),
  prefix: 'rate_limit:magic_link',
})

/**
 * Check if the rate limit has been exceeded
 * Uses the sliding window algorithm via @upstash/ratelimit
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const { key, limit, windowMs } = config

  // Create a temporary ratelimiter for custom configurations
  const ratelimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    prefix: key.split(':').slice(0, -1).join(':'), // Extract prefix from key
  })

  const identifier = key.split(':').pop() || key // Extract identifier from key

  try {
    const result = await ratelimiter.limit(identifier)

    // Calculate reset time from result.reset (timestamp in milliseconds)
    const resetDate = new Date(result.reset)
    const now = Date.now()
    const retryAfter = result.success ? undefined : Math.ceil((result.reset - now) / 1000)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: resetDate,
      retryAfter,
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
 * Helper function to check login rate limit
 */
export async function checkLoginRateLimit(ip: string): Promise<RateLimitResult> {
  try {
    const result = await loginRatelimiter.limit(ip)

    const resetDate = new Date(result.reset)
    const now = Date.now()
    const retryAfter = result.success ? undefined : Math.ceil((result.reset - now) / 1000)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: resetDate,
      retryAfter,
    }
  } catch (error) {
    console.error('Login rate limit check failed:', error)

    return {
      success: true,
      limit: RateLimits.LOGIN.limit,
      remaining: RateLimits.LOGIN.limit,
      reset: new Date(Date.now() + RateLimits.LOGIN.windowMs),
    }
  }
}

/**
 * Helper function to check password reset rate limit
 */
export async function checkPasswordResetRateLimit(email: string): Promise<RateLimitResult> {
  try {
    const result = await passwordResetRatelimiter.limit(email.toLowerCase())

    const resetDate = new Date(result.reset)
    const now = Date.now()
    const retryAfter = result.success ? undefined : Math.ceil((result.reset - now) / 1000)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: resetDate,
      retryAfter,
    }
  } catch (error) {
    console.error('Password reset rate limit check failed:', error)

    return {
      success: true,
      limit: RateLimits.PASSWORD_RESET.limit,
      remaining: RateLimits.PASSWORD_RESET.limit,
      reset: new Date(Date.now() + RateLimits.PASSWORD_RESET.windowMs),
    }
  }
}

/**
 * Helper function to check email verification rate limit
 */
export async function checkEmailVerificationRateLimit(email: string): Promise<RateLimitResult> {
  try {
    const result = await emailVerificationRatelimiter.limit(email.toLowerCase())

    const resetDate = new Date(result.reset)
    const now = Date.now()
    const retryAfter = result.success ? undefined : Math.ceil((result.reset - now) / 1000)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: resetDate,
      retryAfter,
    }
  } catch (error) {
    console.error('Email verification rate limit check failed:', error)

    return {
      success: true,
      limit: RateLimits.EMAIL_VERIFICATION.limit,
      remaining: RateLimits.EMAIL_VERIFICATION.limit,
      reset: new Date(Date.now() + RateLimits.EMAIL_VERIFICATION.windowMs),
    }
  }
}

/**
 * Helper function to check magic link rate limit
 */
export async function checkMagicLinkRateLimit(email: string): Promise<RateLimitResult> {
  try {
    const result = await magicLinkRatelimiter.limit(email.toLowerCase())

    const resetDate = new Date(result.reset)
    const now = Date.now()
    const retryAfter = result.success ? undefined : Math.ceil((result.reset - now) / 1000)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: resetDate,
      retryAfter,
    }
  } catch (error) {
    console.error('Magic link rate limit check failed:', error)

    return {
      success: true,
      limit: RateLimits.MAGIC_LINK.limit,
      remaining: RateLimits.MAGIC_LINK.limit,
      reset: new Date(Date.now() + RateLimits.MAGIC_LINK.windowMs),
    }
  }
}

/**
 * Helper function to check signup rate limit
 */
export async function checkSignupRateLimit(ip: string): Promise<RateLimitResult> {
  try {
    const result = await signupRatelimiter.limit(ip)

    const resetDate = new Date(result.reset)
    const now = Date.now()
    const retryAfter = result.success ? undefined : Math.ceil((result.reset - now) / 1000)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: resetDate,
      retryAfter,
    }
  } catch (error) {
    console.error('Signup rate limit check failed:', error)

    return {
      success: true,
      limit: RateLimits.SIGNUP.limit,
      remaining: RateLimits.SIGNUP.limit,
      reset: new Date(Date.now() + RateLimits.SIGNUP.windowMs),
    }
  }
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
