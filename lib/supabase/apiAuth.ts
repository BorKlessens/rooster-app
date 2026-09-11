import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { CurrentUser, UserRole } from '@/lib/auth'

/**
 * Controleert of het verzoek van een ingelogde admin komt.
 *
 * Geeft ofwel de admin terug, ofwel een kant-en-klaar foutantwoord. Elke route
 * die de service role key gebruikt moet hier doorheen: die sleutel omzeilt RLS,
 * dus de controle die de database normaal doet moeten we hier zelf uitvoeren.
 *
 * Let op de volgorde: eerst getUser(), dat het token bij Supabase verifieert, en
 * pas daarna de rol uit de database. De rol komt nooit uit het verzoek zelf.
 */
export async function requireAdmin(): Promise<
  { admin: CurrentUser; error: null } | { admin: null; error: NextResponse }
> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      admin: null,
      error: NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }),
    }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, username, full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') {
    return {
      admin: null,
      error: NextResponse.json(
        { error: 'Geen beheerdersrechten' },
        { status: 403 }
      ),
    }
  }

  return {
    admin: {
      id: profile.id as string,
      username: profile.username as string,
      fullName: (profile.full_name as string | null) ?? null,
      role: profile.role as UserRole,
    },
    error: null,
  }
}
