'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import type { CurrentUser } from '@/lib/auth'

interface UserContextValue {
  /** De ingelogde gebruiker, of null als er niemand is ingelogd. */
  user: CurrentUser | null
  isAdmin: boolean
  /** Logt uit en stuurt door naar het welkomstscherm. */
  signOut: () => Promise<void>
  /** Haalt het profiel opnieuw op, bijvoorbeeld na een naamswijziging. */
  refresh: () => Promise<void>
}

const UserContext = createContext<UserContextValue | null>(null)

/**
 * Stelt de ingelogde gebruiker beschikbaar aan alle client components.
 *
 * De beginwaarde komt uit de server-side layout, die de sessie uit de cookies
 * leest. Daardoor is de gebruiker al bekend bij de eerste render en flikkert de
 * UI niet tussen uitgelogd en ingelogd.
 */
export default function UserProvider({
  initialUser,
  children,
}: {
  initialUser: CurrentUser | null
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<CurrentUser | null>(initialUser)

  // De server blijft de bron van waarheid: na elke navigatie of router.refresh()
  // komt er een nieuwe initialUser binnen.
  useEffect(() => {
    setUser(initialUser)
  }, [initialUser])

  const refresh = useCallback(async () => {
    router.refresh()
  }, [router])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()

    // Ruim de caches van de service worker op, zodat een volgende gebruiker op
    // dit toestel niets van de vorige terugvindt.
    if ('caches' in window) {
      try {
        const keys = await caches.keys()
        await Promise.all(
          keys.filter((key) => key.startsWith('rooster-app-')).map((key) => caches.delete(key))
        )
      } catch {
        // Lukt dit niet, dan is uitloggen nog steeds gelukt.
      }
    }

    setUser(null)
    router.replace('/welcome')
    router.refresh()
  }, [router])

  // Vangt sessiewijzigingen op die buiten deze tab gebeuren, bijvoorbeeld
  // uitloggen op een ander tabblad of een token dat niet meer geldig is.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        router.replace('/welcome')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      isAdmin: user?.role === 'admin',
      signOut,
      refresh,
    }),
    [user, signOut, refresh]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

/**
 * Geeft de ingelogde gebruiker. Pagina's achter de middleware kunnen ervan
 * uitgaan dat user niet null is, maar controleer het waar dat niet zeker is.
 */
export function useCurrentUser(): UserContextValue {
  const context = useContext(UserContext)

  if (!context) {
    throw new Error('useCurrentUser moet binnen UserProvider gebruikt worden')
  }

  return context
}
