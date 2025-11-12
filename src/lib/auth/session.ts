/**
 * Session Management Helpers
 *
 * Provides utilities for managing user sessions with Redis caching
 * for improved performance (<100ms validation requirement).
 *
 * Architecture: Hybrid approach
 * - Primary source of truth: Supabase Auth (JWT tokens)
 * - Performance layer: Redis cache (sub-10ms lookups)
 */

import { redis } from '@/lib/redis'
import type { User } from '@supabase/supabase-js'

export interface CachedSession {
  userId: string
  email: string
  expiresAt: number // Unix timestamp
  lastRefreshedAt: number // Unix timestamp
}

const SESSION_TTL = 7 * 24 * 60 * 60 // 7 days in seconds (matches Supabase default)

/**
 * Cache a user session in Redis
 * TTL matches the session expiry for automatic cleanup
 */
export async function cacheSession(user: User, expiresAt: Date): Promise<void> {
  const sessionData: CachedSession = {
    userId: user.id,
    email: user.email!,
    expiresAt: expiresAt.getTime(),
    lastRefreshedAt: Date.now(),
  }

  const key = getSessionKey(user.id)

  try {
    await redis.setex(key, SESSION_TTL, JSON.stringify(sessionData))
  } catch (error) {
    // Log but don't fail - cache is performance optimization, not critical
    console.error('Failed to cache session:', error)
  }
}

/**
 * Get a cached session from Redis
 * Returns null if not found or expired
 */
export async function getCachedSession(userId: string): Promise<CachedSession | null> {
  const key = getSessionKey(userId)

  try {
    const data = await redis.get(key)

    if (!data) {
      return null
    }

    const session = JSON.parse(data as string) as CachedSession

    // Check if session has expired
    if (session.expiresAt < Date.now()) {
      // Clean up expired session
      await invalidateSession(userId)
      return null
    }

    return session
  } catch (error) {
    console.error('Failed to get cached session:', error)
    return null
  }
}

/**
 * Invalidate (delete) a user's session from Redis cache
 * Called on logout or when session is no longer valid
 */
export async function invalidateSession(userId: string): Promise<void> {
  const key = getSessionKey(userId)

  try {
    await redis.del(key)
  } catch (error) {
    console.error('Failed to invalidate session:', error)
  }
}

/**
 * Update the last refreshed timestamp for a session
 * Called after successful session refresh
 */
export async function updateSessionRefreshTime(userId: string): Promise<void> {
  try {
    const session = await getCachedSession(userId)

    if (session) {
      session.lastRefreshedAt = Date.now()
      const key = getSessionKey(userId)
      await redis.setex(key, SESSION_TTL, JSON.stringify(session))
    }
  } catch (error) {
    console.error('Failed to update session refresh time:', error)
  }
}

/**
 * Get the Redis key for a user's session
 */
function getSessionKey(userId: string): string {
  return `session:${userId}`
}

/**
 * Check if a session is about to expire (within 1 hour)
 * Can be used to trigger proactive refresh
 */
export function isSessionExpiringSoon(session: CachedSession): boolean {
  const oneHourMs = 60 * 60 * 1000
  const timeUntilExpiry = session.expiresAt - Date.now()
  return timeUntilExpiry < oneHourMs && timeUntilExpiry > 0
}

/**
 * Get session metadata for monitoring/analytics
 */
export async function getSessionMetadata(userId: string): Promise<{
  exists: boolean
  expiresIn?: number // milliseconds
  lastRefreshed?: Date
} | null> {
  const session = await getCachedSession(userId)

  if (!session) {
    return { exists: false }
  }

  return {
    exists: true,
    expiresIn: session.expiresAt - Date.now(),
    lastRefreshed: new Date(session.lastRefreshedAt),
  }
}

/**
 * Bulk invalidate sessions for multiple users
 * Useful for administrative actions
 */
export async function invalidateMultipleSessions(userIds: string[]): Promise<void> {
  const keys = userIds.map(getSessionKey)

  try {
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Failed to invalidate multiple sessions:', error)
  }
}

/**
 * Example usage in an API route:
 *
 * import { createClient } from '@/lib/supabase/server'
 * import { cacheSession, getCachedSession } from '@/lib/auth/session'
 *
 * export async function GET(request: Request) {
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *
 *   if (!user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   }
 *
 *   // Try to get cached session first (fast path)
 *   let session = await getCachedSession(user.id)
 *
 *   if (!session) {
 *     // Cache miss - get from Supabase and cache it
 *     const { data: { session: supabaseSession } } = await supabase.auth.getSession()
 *
 *     if (supabaseSession) {
 *       await cacheSession(user, new Date(supabaseSession.expires_at * 1000))
 *       session = await getCachedSession(user.id)
 *     }
 *   }
 *
 *   return NextResponse.json({ user, session })
 * }
 */
