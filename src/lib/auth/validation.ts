/**
 * Authentication validation schemas using Zod
 *
 * These schemas validate user input for authentication operations
 * and provide type-safe validation with helpful error messages.
 */

import { z } from 'zod'

/**
 * Email validation schema
 * - Must be a valid email format
 * - Converted to lowercase for consistency
 */
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .toLowerCase()
  .trim()

/**
 * Password validation schema (for registration)
 * Requirements from SEC-006:
 * - Minimum 8 characters
 * - At least one letter
 * - At least one number
 * - Maximum 128 characters (Supabase limit)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

/**
 * Login password schema (less strict, just check non-empty)
 * We don't want to give attackers hints about password requirements
 */
export const loginPasswordSchema = z
  .string()
  .min(1, 'Password is required')

/**
 * Display name schema (optional)
 */
export const displayNameSchema = z
  .string()
  .min(1, 'Name must be at least 1 character')
  .max(100, 'Name must not exceed 100 characters')
  .trim()
  .optional()

/**
 * Signup form validation schema
 */
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  displayName: displayNameSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type SignupInput = z.infer<typeof signupSchema>

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
  rememberMe: z.boolean().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * Forgot password form validation schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

/**
 * Reset password form validation schema
 */
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

/**
 * Magic link form validation schema
 */
export const magicLinkSchema = z.object({
  email: emailSchema,
})

export type MagicLinkInput = z.infer<typeof magicLinkSchema>

/**
 * Email verification resend schema
 */
export const resendVerificationSchema = z.object({
  email: emailSchema,
})

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
  displayName: displayNameSchema,
  avatarUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

/**
 * Add league schema
 */
export const addLeagueSchema = z.object({
  platform: z.enum(['espn', 'sleeper', 'yahoo'], {
    errorMap: () => ({ message: 'Platform must be espn, sleeper, or yahoo' }),
  }),
  platformLeagueId: z.string().min(1, 'League ID is required'),
  season: z.number().int().min(2000).max(2100, 'Invalid season year'),
  leagueName: z.string().optional(),
  credentials: z.record(z.any()).optional(), // Platform-specific credentials
})

export type AddLeagueInput = z.infer<typeof addLeagueSchema>

/**
 * Helper function to safely parse and validate input
 * Returns { success: true, data } or { success: false, error }
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; error: string; fieldErrors?: Record<string, string> } {
  const result = schema.safeParse(input)

  if (result.success) {
    return { success: true, data: result.data }
  }

  // Extract field-specific errors for better UX
  const fieldErrors: Record<string, string> = {}
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.')
    if (path) {
      fieldErrors[path] = issue.message
    }
  })

  return {
    success: false,
    error: result.error.issues[0]?.message || 'Validation failed',
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
  }
}

/**
 * Example usage:
 *
 * const result = validateInput(signupSchema, formData)
 * if (!result.success) {
 *   console.error(result.error)
 *   console.error(result.fieldErrors)
 *   return
 * }
 * // result.data is now type-safe SignupInput
 */
