/**
 * useSession Hook
 *
 * Lightweight hook for accessing just the session data without subscribing to auth changes.
 * Useful for components that only need to check if a user is logged in.
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'

export interface SessionState {
  session: Session | null
  loading: boolean
}

/**
 * Hook to access current session without auth state subscription
 *
 * @example
 * ```tsx
 * function ProtectedComponent() {
 *   const { session, loading } = useSession()
 *
 *   if (loading) return <div>Loading...</div>
 *   if (!session) return <div>Access denied</div>
 *
 *   return <div>Protected content</div>
 * }
 * ```
 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    session: null,
    loading: true,
  })

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        session,
        loading: false,
      })
    })
  }, [])

  return state
}
