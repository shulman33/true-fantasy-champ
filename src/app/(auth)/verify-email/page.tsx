/**
 * Email Verification Page
 *
 * Shown after signup to inform users to check their email for verification link.
 * Allows resending verification email if needed.
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { resendVerificationEmail } from '@/services/auth-service'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  /**
   * Handle resend verification email
   */
  async function handleResend() {
    if (!email) {
      setResendError('Email address not found. Please try signing up again.')
      return
    }

    setIsResending(true)
    setResendError(null)
    setResendSuccess(false)

    try {
      const result = await resendVerificationEmail({ email })

      if (!result.success) {
        setResendError(result.error?.message || 'Failed to resend verification email')
        return
      }

      setResendSuccess(true)
      setCountdown(60) // Start 60-second countdown
    } catch (err) {
      console.error('Resend verification error:', err)
      setResendError('An unexpected error occurred. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a verification link to
            {email && (
              <>
                <br />
                <span className="font-medium text-foreground">{email}</span>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Please click the verification link in your email to activate your account.</p>
            <p>
              If you don&apos;t see the email, check your spam folder or click the button below to
              resend it.
            </p>
          </div>

          {/* Success Alert */}
          {resendSuccess && (
            <Alert className="border-green-500 bg-green-50 text-green-900">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Verification email sent! Check your inbox.</AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {resendError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{resendError}</AlertDescription>
            </Alert>
          )}

          {/* Resend Button */}
          <Button
            onClick={handleResend}
            variant="outline"
            className="w-full"
            disabled={isResending || countdown > 0 || !email}
          >
            {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {countdown > 0
              ? `Resend in ${countdown}s`
              : isResending
                ? 'Sending...'
                : 'Resend verification email'}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <p className="text-sm text-center text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="container flex items-center justify-center min-h-screen py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
