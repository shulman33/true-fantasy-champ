/**
 * Authentication Type Definitions
 *
 * Centralized types for authentication operations
 */

import type { User, Session } from '@supabase/supabase-js'

/**
 * Authentication state
 */
export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
}

/**
 * Authentication error types
 */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'user_not_found'
  | 'email_already_exists'
  | 'weak_password'
  | 'invalid_token'
  | 'token_expired'
  | 'rate_limit_exceeded'
  | 'network_error'
  | 'server_error'
  | 'unknown_error'

export interface AuthError {
  code: AuthErrorCode
  message: string
  details?: Record<string, unknown>
}

/**
 * Authentication method types
 */
export type AuthMethod = 'email' | 'google' | 'magic_link'

/**
 * Signup payload
 */
export interface SignupPayload {
  email: string
  password: string
  displayName?: string
  metadata?: Record<string, unknown>
}

/**
 * Signup result
 */
export interface SignupResult {
  success: boolean
  user?: User
  session?: Session
  error?: AuthError
  requiresEmailVerification?: boolean
}

/**
 * Login payload
 */
export interface LoginPayload {
  email: string
  password: string
  rememberMe?: boolean
}

/**
 * Login result
 */
export interface LoginResult {
  success: boolean
  user?: User
  session?: Session
  error?: AuthError
}

/**
 * Logout result
 */
export interface LogoutResult {
  success: boolean
  error?: AuthError
}

/**
 * Password reset request payload
 */
export interface PasswordResetRequestPayload {
  email: string
}

/**
 * Password reset request result
 */
export interface PasswordResetRequestResult {
  success: boolean
  error?: AuthError
}

/**
 * Password reset confirmation payload
 */
export interface PasswordResetConfirmPayload {
  password: string
  confirmPassword: string
}

/**
 * Password reset confirmation result
 */
export interface PasswordResetConfirmResult {
  success: boolean
  error?: AuthError
}

/**
 * Magic link request payload
 */
export interface MagicLinkPayload {
  email: string
}

/**
 * Magic link request result
 */
export interface MagicLinkResult {
  success: boolean
  error?: AuthError
}

/**
 * Email verification resend payload
 */
export interface ResendVerificationPayload {
  email: string
}

/**
 * Email verification resend result
 */
export interface ResendVerificationResult {
  success: boolean
  error?: AuthError
}

/**
 * OAuth provider configuration
 */
export interface OAuthConfig {
  provider: 'google' | 'github' | 'apple'
  redirectTo?: string
  scopes?: string
}

/**
 * OAuth result
 */
export interface OAuthResult {
  success: boolean
  url?: string
  error?: AuthError
}

/**
 * Session validation result
 */
export interface SessionValidationResult {
  valid: boolean
  user?: User
  session?: Session
  error?: AuthError
}

/**
 * Auth event types (for logging/analytics)
 */
export type AuthEventType =
  | 'signup'
  | 'login'
  | 'logout'
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'email_verification_sent'
  | 'email_verified'
  | 'magic_link_sent'
  | 'oauth_initiated'
  | 'oauth_completed'
  | 'session_refreshed'
  | 'failed_login'
  | 'rate_limit_exceeded'

/**
 * Auth event payload (for logging)
 */
export interface AuthEvent {
  type: AuthEventType
  userId?: string
  email?: string
  method?: AuthMethod
  ip?: string
  userAgent?: string
  success: boolean
  error?: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

/**
 * User profile data
 */
export interface UserProfile {
  userId: string
  email: string
  displayName?: string
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Update profile payload
 */
export interface UpdateProfilePayload {
  displayName?: string
  avatarUrl?: string
}

/**
 * Update profile result
 */
export interface UpdateProfileResult {
  success: boolean
  profile?: UserProfile
  error?: AuthError
}

/**
 * Type guard to check if an error is an AuthError
 */
export function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  )
}

/**
 * Helper to create an AuthError
 */
export function createAuthError(
  code: AuthErrorCode,
  message: string,
  details?: Record<string, unknown>
): AuthError {
  return { code, message, details }
}

/**
 * Map Supabase error to AuthError
 */
export function mapSupabaseError(error: { message: string; status?: number }): AuthError {
  const message = error.message.toLowerCase()

  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return createAuthError('invalid_credentials', 'Invalid email or password')
  }

  if (message.includes('email not confirmed')) {
    return createAuthError('email_not_confirmed', 'Please verify your email address before logging in')
  }

  if (message.includes('user not found')) {
    return createAuthError('user_not_found', 'No account found with this email')
  }

  if (message.includes('user already registered') || message.includes('email already exists')) {
    return createAuthError('email_already_exists', 'An account with this email already exists')
  }

  if (message.includes('password') && message.includes('weak')) {
    return createAuthError('weak_password', 'Password does not meet security requirements')
  }

  if (message.includes('token') && (message.includes('invalid') || message.includes('malformed'))) {
    return createAuthError('invalid_token', 'Invalid or malformed authentication token')
  }

  if (message.includes('token') && message.includes('expired')) {
    return createAuthError('token_expired', 'Authentication token has expired')
  }

  if (error.status === 429) {
    return createAuthError('rate_limit_exceeded', 'Too many requests. Please try again later')
  }

  if (message.includes('network') || message.includes('fetch')) {
    return createAuthError('network_error', 'Network error. Please check your connection')
  }

  // Default to server error
  return createAuthError('server_error', error.message || 'An unexpected error occurred')
}
