import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase-client met de service role key.
 *
 * Deze sleutel omzeilt Row Level Security volledig en mag daarom NOOIT in code
 * terechtkomen die naar de browser wordt gestuurd. Importeer dit bestand
 * uitsluitend vanuit route handlers onder app/api of vanuit scripts. De
 * ontbrekende NEXT_PUBLIC_-prefix zorgt ervoor dat Next.js de waarde niet in de
 * client bundle opneemt.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY ontbreken. ' +
        'De service role key vind je in het Supabase-dashboard onder Project Settings, API.'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
