import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CurrentUser, UserRole } from '@/lib/auth'

/**
 * Supabase-client voor server components, route handlers en server actions.
 *
 * Leest de sessie uit de cookies van het inkomende verzoek en respecteert
 * daarmee gewoon de RLS-policies: deze client heeft precies de rechten van de
 * ingelogde gebruiker, niet meer.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // In een server component mogen cookies niet geschreven worden.
            // Dat is geen probleem: middleware.ts ververst de sessie al.
          }
        },
      },
    }
  )
}

/**
 * Haalt de ingelogde gebruiker met profiel op, of null als er niemand is
 * ingelogd. Gebruikt getUser(), dat het token bij Supabase verifieert, en niet
 * getSession(), dat een cookie vertrouwt die de client kan vervalsen.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, username, full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return null
  }

  return {
    id: profile.id as string,
    username: profile.username as string,
    fullName: (profile.full_name as string | null) ?? null,
    role: (profile.role as UserRole) ?? 'user',
  }
}
