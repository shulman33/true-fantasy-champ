/**
 * POST /api/auth/logout
 *
 * Log out the current user and clear their session
 */

import { NextResponse } from 'next/server'
import { signOut } from '@/services/auth-service'

export async function POST() {
  try {
    // Call auth service to sign out
    const result = await signOut()

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      )
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('[API] /api/auth/logout error:', error)
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
