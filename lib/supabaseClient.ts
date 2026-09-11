import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase-client voor de browser.
 *
 * De sessie wordt door @supabase/ssr in cookies gezet in plaats van in
 * localStorage. Dat is nodig omdat middleware.ts en server components dezelfde
 * sessie moeten kunnen lezen; anders kan de server niet controleren of iemand
 * werkelijk is ingelogd.
 */

let browserClient: SupabaseClient | null = null

function getBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY ontbreken. ' +
        'Zet ze in .env.local (lokaal) of in de omgevingsvariabelen van Vercel.'
    )
  }

  browserClient = createBrowserClient(url, anonKey)
  return browserClient
}

/**
 * De client wordt pas aangemaakt bij het eerste gebruik. Tijdens het bouwen
 * rendert Next.js client components vooruit, en dan zijn de omgevingsvariabelen
 * er nog niet; een proxy voorkomt dat de build daarop stukloopt.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getBrowserClient()
    const value = Reflect.get(client as object, prop) as unknown

    return typeof value === 'function' ? value.bind(client) : value
  },
})
