/**
 * useAuth Hook
 *
 * Client-side hook for accessing authentication state and performing auth operations.
 * Uses Supabase client-side SDK for real-time auth state updates.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: Error | null
}

export interface UseAuthReturn extends AuthState {
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

/**
 * Hook to access current authentication state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading, signOut } = useAuth()
 *
 *   if (loading) return <div>Loading...</div>
 *   if (!user) return <div>Please log in</div>
 *
 *   return (
 *     <div>
 *       <p>Welcome, {user.email}</p>
 *       <button onClick={signOut}>Log out</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setState({
          user: null,
          session: null,
          loading: false,
          error,
        })
        return
      }

      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
      })
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
      })

      // Refresh the page data when auth state changes
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()

      // Redirect to login page
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
      setState((prev) => ({
        ...prev,
        error: error as Error,
      }))
    }
  }

  /**
   * Manually refresh the session
   */
  const refreshSession = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.refreshSession()

      if (error) throw error

      setState({
        user: data.session?.user ?? null,
        session: data.session,
        loading: false,
        error: null,
      })
    } catch (error) {
      console.error('Refresh session error:', error)
      setState((prev) => ({
        ...prev,
        error: error as Error,
      }))
    }
  }

  return {
    ...state,
    signOut,
    refreshSession,
  }
}
