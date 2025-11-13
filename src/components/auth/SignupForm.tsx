/**
 * SignupForm Component
 *
 * User registration form with email/password signup.
 * Uses shadcn/ui components for consistent styling.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { signupSchema, type SignupInput } from '@/lib/auth/validation'
import { signUp } from '@/services/auth-service'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface SignupFormProps {
  /**
   * Callback function called after successful signup
   */
  onSuccess?: () => void

  /**
   * Optional redirect URL after signup
   */
  redirectTo?: string
}

export function SignupForm({ onSuccess, redirectTo }: SignupFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Initialize form with react-hook-form and Zod validation
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
    },
  })

  /**
   * Handle form submission
   */
  async function onSubmit(data: SignupInput) {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Call the signup server action
      const result = await signUp({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      })

      if (!result.success) {
        // Show error message
        setError(result.error?.message || 'Signup failed. Please try again.')
        return
      }

      // Show success message
      setSuccess(true)

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }

      // If email verification is required, inform the user
      if (result.requiresEmailVerification) {
        // Wait a moment to show success message, then redirect
        setTimeout(() => {
          router.push('/verify-email?email=' + encodeURIComponent(data.email))
        }, 1500)
      } else {
        // If no verification needed, redirect to app (rare case)
        setTimeout(() => {
          router.push(redirectTo || '/dashboard')
        }, 1500)
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Display Name Field */}
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name (Optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="John Doe"
                  disabled={isLoading}
                  autoComplete="name"
                />
              </FormControl>
              <FormDescription>This is how your name will appear in the app.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="your.email@example.com"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </FormControl>
              <FormDescription>
                At least 8 characters with a mix of letters and numbers.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirm Password Field */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-500 bg-green-50 text-green-900">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Account created successfully! Please check your email to verify your account.
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading || success}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>

        {/* Terms of Service Note */}
        <p className="text-sm text-muted-foreground text-center">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </Form>
  )
}
