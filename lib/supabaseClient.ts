
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization - only create client when actually accessed
// This prevents errors during build when env vars might not be available
let supabaseInstance: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If we have real env vars, use them (even if we already have a cached instance)
  // This ensures runtime uses real values even if build created a placeholder
  if (supabaseUrl && supabaseAnonKey) {
    // If we already have an instance with real values, return it
    if (supabaseInstance) {
      return supabaseInstance
    }
    // Create new client with real values
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
    return supabaseInstance
  }

  // If we already have a cached instance (from build), return it
  if (supabaseInstance) {
    return supabaseInstance
  }

  // During build, env vars might not be set - use placeholders
  // This prevents build errors, but the client won't work until env vars are set
  supabaseInstance = createClient(
    'https://placeholder.supabase.co',
    'placeholder-key'
  )

  return supabaseInstance
}

// Export a proxy that lazily creates the client when accessed
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})

// Helper om huidige gebruiker ID op te halen
export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('userId')
}

// Helper om te checken of gebruiker admin is
export async function isAdmin(): Promise<boolean> {
  const userId = getCurrentUserId()
  if (!userId) return false
  
  // Haal gebruiker op uit localStorage users array
  const storedUsers = localStorage.getItem('users')
  if (storedUsers) {
    const users = JSON.parse(storedUsers)
    const user = users.find((u: { id: string }) => u.id === userId)
    // Later: check admin rol in database
    return user?.role === 'admin' || false
  }
  return false
}