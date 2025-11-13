/**
 * Authentication Service
 *
 * Handles all authentication operations with Supabase Auth:
 * - User signup/registration
 * - Email/password login
 * - OAuth authentication (Google)
 * - Magic link (passwordless) authentication
 * - Password reset flows
 * - Email verification
 * - Session management
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  SignupPayload,
  SignupResult,
  LoginPayload,
  LoginResult,
  LogoutResult,
  PasswordResetRequestPayload,
  PasswordResetRequestResult,
  PasswordResetConfirmPayload,
  PasswordResetConfirmResult,
  MagicLinkPayload,
  MagicLinkResult,
  ResendVerificationPayload,
  ResendVerificationResult,
  SessionValidationResult,
  AuthEventType,
} from '@/types/auth'
import { mapSupabaseError, createAuthError } from '@/types/auth'

/**
 * Get the site URL from environment variable
 */
function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

/**
 * Register a new user with email and password
 *
 * @param payload - Signup information (email, password, displayName)
 * @returns SignupResult with user data or error
 */
export async function signUp(payload: SignupPayload): Promise<SignupResult> {
  try {
    const supabase = await createClient()

    // Call Supabase Auth signUp
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        data: {
          display_name: payload.displayName || '',
          ...payload.metadata,
        },
      },
    })

    if (error) {
      // Log the auth event (failure)
      await logAuthEvent({
        type: 'signup',
        email: payload.email,
        success: false,
        error: error.message,
      })

      return {
        success: false,
        error: mapSupabaseError(error),
        requiresEmailVerification: false,
      }
    }

    // Log the auth event (success)
    await logAuthEvent({
      type: 'signup',
      userId: data.user?.id,
      email: payload.email,
      success: true,
    })

    // Check if email confirmation is required
    const requiresEmailVerification = !data.session

    return {
      success: true,
      user: data.user ?? undefined,
      session: data.session ?? undefined,
      requiresEmailVerification,
    }
  } catch (error) {
    console.error('[AuthService] signUp error:', error)
    return {
      success: false,
      error: createAuthError('server_error', 'An unexpected error occurred during signup'),
      requiresEmailVerification: false,
    }
  }
}

/**
 * Log in an existing user with email and password
 *
 * @param payload - Login credentials (email, password)
 * @returns LoginResult with session data or error
 */
export async function signIn(payload: LoginPayload): Promise<LoginResult> {
  try {
    const supabase = await createClient()

    // Call Supabase Auth signInWithPassword
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    })

    if (error) {
      // Log the auth event (failure)
      await logAuthEvent({
        type: 'failed_login',
        email: payload.email,
        success: false,
        error: error.message,
      })

      return {
        success: false,
        error: mapSupabaseError(error),
      }
    }

    // Log the auth event (success)
    await logAuthEvent({
      type: 'login',
      userId: data.user?.id,
      email: payload.email,
      method: 'email',
      success: true,
    })

    return {
      success: true,
      user: data.user,
      session: data.session,
    }
  } catch (error) {
    console.error('[AuthService] signIn error:', error)
    return {
      success: false,
      error: createAuthError('server_error', 'An unexpected error occurred during login'),
    }
  }
}

/**
 * Log out the current user
 *
 * @returns LogoutResult indicating success or failure
 */
export async function signOut(): Promise<LogoutResult> {
  try {
    const supabase = await createClient()

    // Get current user before signing out (for logging)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Call Supabase Auth signOut
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: mapSupabaseError(error),
      }
    }

    // Log the auth event
    await logAuthEvent({
      type: 'logout',
      userId: user?.id,
      email: user?.email,
      success: true,
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error('[AuthService] signOut error:', error)
    return {
      success: false,
      error: createAuthError('server_error', 'An unexpected error occurred during logout'),
    }
  }
}

/**
 * Request a password reset email
 *
 * @param payload - Email address to send reset link to
 * @returns PasswordResetRequestResult indicating success or failure
 */
export async function requestPasswordReset(
  payload: PasswordResetRequestPayload
): Promise<PasswordResetRequestResult> {
  try {
    const supabase = await createClient()

    // Call Supabase Auth resetPasswordForEmail
    const { error } = await supabase.auth.resetPasswordForEmail(payload.email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
    })

    // Note: Supabase always returns success even if email doesn't exist (anti-enumeration)
    if (error) {
      return {
        success: false,
        error: mapSupabaseError(error),
      }
    }

    // Log the auth event
    await logAuthEvent({
      type: 'password_reset_request',
      email: payload.email,
      success: true,
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error('[AuthService] requestPasswordReset error:', error)
    return {
      success: false,
      error: createAuthError('server_error', 'An unexpected error occurred'),
    }
  }
}

/**
 * Confirm password reset with new password
 *
 * @param payload - New password and confirmation
 * @returns PasswordResetConfirmResult indicating success or failure
 */
export async function confirmPasswordReset(
  payload: PasswordResetConfirmPayload
): Promise<PasswordResetConfirmResult> {
  try {
    const supabase = await createClient()

    // Get current user (should exist if they followed reset link)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: createAuthError('invalid_token', 'Invalid or expired reset link'),
      }
    }

    // Call Supabase Auth updateUser to change password
    const { error } = await supabase.auth.updateUser({
      password: payload.password,
    })

    if (error) {
      return {
        success: false,
        error: mapSupabaseError(error),
      }
    }

    // Log the auth event
    await logAuthEvent({
      type: 'password_reset_complete',
      userId: user.id,
      email: user.email,
      success: true,
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error('[AuthService] confirmPasswordReset error:', error)
    return {
      success: false,
      error: createAuthError('server_error', 'An unexpected error occurred'),
    }
  }
}

/**
 * Send a magic link (passwordless login) email
 *
 * @param payload - Email address to send magic link to
 * @returns MagicLinkResult indicating success or failure
 */
export async function sendMagicLink(payload: MagicLinkPayload): Promise<MagicLinkResult> {
  try {
    const supabase = await createClient()

    // Call Supabase Auth signInWithOtp
    const { error } = await supabase.auth.signInWithOtp({
      email: payload.email,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      },
    })

    if (error) {
      return {
        success: false,
        error: mapSupabaseError(error),
      }
    }

    // Log the auth event
    await logAuthEvent({
      type: 'magic_link_sent',
      email: payload.email,
      success: true,
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error('[AuthService] sendMagicLink error:', error)
    return {
      success: false,
      error: createAuthError('server_error', 'An unexpected error occurred'),
    }
  }
}

/**
 * Resend email verification link
 *
 * @param payload - Email address to resend verification to
 * @returns ResendVerificationResult indicating success or failure
 */
export async function resendVerificationEmail(
  payload: ResendVerificationPayload
): Promise<ResendVerificationResult> {
  try {
    const supabase = await createClient()

    // Call Supabase Auth resend (using signInWithOtp for confirmation)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: payload.email,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      },
    })

    if (error) {
      return {
        success: false,
        error: mapSupabaseError(error),
      }
    }

    // Log the auth event
    await logAuthEvent({
      type: 'email_verification_sent',
      email: payload.email,
      success: true,
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error('[AuthService] resendVerificationEmail error:', error)
    return {
      success: false,
      error: createAuthError('server_error', 'An unexpected error occurred'),
    }
  }
}

/**
 * Validate the current user's session
 *
 * @returns SessionValidationResult with user data or error
 */
export async function validateSession(): Promise<SessionValidationResult> {
  try {
    const supabase = await createClient()

    // Call Supabase Auth getUser (validates session and refreshes if needed)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return {
        valid: false,
        error: error ? mapSupabaseError(error) : createAuthError('invalid_token', 'No active session'),
      }
    }

    // Get session data
    const {
      data: { session },
    } = await supabase.auth.getSession()

    return {
      valid: true,
      user,
      session: session ?? undefined,
    }
  } catch (error) {
    console.error('[AuthService] validateSession error:', error)
    return {
      valid: false,
      error: createAuthError('server_error', 'An unexpected error occurred'),
    }
  }
}

/**
 * Log an authentication event
 *
 * This function logs authentication events to the auth_logs table for security auditing.
 * It's called internally by other auth functions and should not be called directly.
 *
 * @param event - Authentication event data
 */
async function logAuthEvent(event: {
  type: AuthEventType
  userId?: string
  email?: string
  method?: 'email' | 'google' | 'magic_link'
  success: boolean
  error?: string
}): Promise<void> {
  try {
    const supabase = await createClient()

    // Insert auth log entry
    await supabase.from('auth_logs').insert({
      user_id: event.userId || null,
      event_type: event.type,
      success: event.success,
      error_message: event.error || null,
      metadata: {
        email: event.email,
        method: event.method,
      },
    })
  } catch (error) {
    // Don't throw errors for logging failures - just log to console
    console.error('[AuthService] logAuthEvent error:', error)
  }
}

/**
 * Get user's authentication logs (for user profile page)
 *
 * @param userId - User ID to fetch logs for
 * @param limit - Maximum number of logs to return (default 50)
 * @returns Array of auth log entries
 */
export async function getUserAuthLogs(
  userId: string,
  limit = 50
): Promise<
  Array<{
    id: string
    eventType: string
    success: boolean
    errorMessage: string | null
    createdAt: string
  }>
> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('auth_logs')
      .select('id, event_type, success, error_message, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[AuthService] getUserAuthLogs error:', error)
      return []
    }

    return (
      data?.map((log) => ({
        id: log.id,
        eventType: log.event_type,
        success: log.success,
        errorMessage: log.error_message,
        createdAt: log.created_at,
      })) || []
    )
  } catch (error) {
    console.error('[AuthService] getUserAuthLogs error:', error)
    return []
  }
}
