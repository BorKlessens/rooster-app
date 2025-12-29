/**
 * Supabase Client Setup
 * 
 * Deze file bevat de configuratie voor Supabase.
 * Supabase wordt gebruikt voor:
 * 
 * 1. Authenticatie (Auth)
 *    - Inloggen van medewerkers en admins
 *    - Rol-based access control (medewerker vs admin)
 *    - Session management
 * 
 * 2. Database (PostgreSQL)
 *    - Gebruikersprofielen
 *    - Shifts (datum, tijd, locatie, functie)
 *    - Beschikbaarheid van medewerkers
 *    - Inplanningen (welke medewerker op welke shift)
 * 
 * 3. Real-time updates (Realtime)
 *    - Live updates wanneer roosters wijzigen
 *    - Notificaties voor medewerkers bij shift wijzigingen
 * 
 * Setup instructies:
 * 1. Maak een Supabase project aan op https://supabase.com
 * 2. Kopieer je project URL en anon key
 * 3. Maak een .env.local file in de root van het project
 * 4. Voeg de volgende variabelen toe:
 *    NEXT_PUBLIC_SUPABASE_URL=your-project-url
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 */

// Placeholder voor Supabase imports
// Later installeren: npm install @supabase/supabase-js
// import { createClient } from '@supabase/supabase-js'

// Environment variables (placeholder)
// Deze worden later geladen vanuit .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

/**
 * Supabase client instance
 * 
 * Deze client wordt gebruikt voor alle database en auth operaties.
 * 
 * Gebruik voorbeelden (later implementeren):
 * 
 * // Authenticatie
 * const { data, error } = await supabase.auth.signInWithPassword({
 *   email: 'user@example.com',
 *   password: 'password'
 * })
 * 
 * // Database query
 * const { data, error } = await supabase
 *   .from('shifts')
 *   .select('*')
 *   .eq('date', '2024-01-15')
 * 
 * // Real-time subscription
 * supabase
 *   .channel('shifts')
 *   .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'shifts' }, 
 *     (payload) => console.log('Shift updated!', payload)
 *   )
 *   .subscribe()
 */
export const supabase = null // Placeholder - later: createClient(supabaseUrl, supabaseAnonKey)

/**
 * Helper functie om te checken of gebruiker ingelogd is
 * 
 * Later implementeren:
 * const { data: { session } } = await supabase.auth.getSession()
 * return !!session
 */
export async function isAuthenticated(): Promise<boolean> {
  // Placeholder - later implementeren met Supabase Auth
  return false
}

/**
 * Helper functie om gebruiker rol op te halen
 * 
 * Later implementeren:
 * const { data: { user } } = await supabase.auth.getUser()
 * const { data: profile } = await supabase
 *   .from('profiles')
 *   .select('role')
 *   .eq('id', user.id)
 *   .single()
 * return profile?.role || 'user'
 */
export async function getUserRole(): Promise<'user' | 'admin'> {
  // Placeholder - later implementeren met Supabase
  return 'user'
}


