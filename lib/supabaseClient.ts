
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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