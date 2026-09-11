/**
 * Gedeelde auth-hulpmiddelen.
 *
 * Collega's loggen in met een gebruikersnaam, maar Supabase Auth werkt met
 * e-mailadressen. Elke gebruikersnaam wordt daarom deterministisch omgezet naar
 * een intern adres, bijvoorbeeld "jan jansen" -> "jan.jansen@rooster.intern".
 * Dat adres is puur een interne sleutel: er wordt nooit post naartoe gestuurd
 * en de gebruiker krijgt het niet te zien.
 *
 * Omdat de omzetting deterministisch is, kan de browser het adres zelf
 * uitrekenen. Er is dus geen endpoint nodig dat gebruikersnamen opzoekt, en
 * daarmee ook geen manier om te achterhalen welke accounts bestaan.
 */

/**
 * Wordt bij elke aanroep opnieuw gelezen, niet één keer bij het laden van de
 * module. Dat is nodig voor scripts/createAdmin.ts, waar dotenv de .env.local
 * pas inlaadt nadat de imports al zijn uitgevoerd. Zou de waarde daar op de
 * standaard blijven staan, dan kreeg het aangemaakte account een ander
 * auth-adres dan de app later berekent en kon de beheerder niet inloggen.
 */
export function getAuthEmailDomain(): string {
  return process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN?.trim() || 'rooster.intern'
}

export type UserRole = 'user' | 'admin'

export interface CurrentUser {
  id: string
  username: string
  fullName: string | null
  role: UserRole
}

/**
 * Brengt een ingetypte gebruikersnaam terug tot de vorm waarin hij is
 * opgeslagen. De database dwingt lowercase af via een check constraint.
 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Zet een gebruikersnaam om naar het interne auth-adres.
 *
 * Spaties worden punten en alles buiten [a-z0-9._-] verdwijnt, zodat het
 * resultaat altijd een geldig e-mailadres is.
 */
export function usernameToAuthEmail(username: string): string {
  const localPart = normalizeUsername(username)
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/^[.-]+|[.-]+$/g, '')

  if (!localPart) {
    throw new Error('Gebruikersnaam bevat geen bruikbare tekens')
  }

  return `${localPart}@${getAuthEmailDomain()}`
}

/**
 * Controleert of een gebruikersnaam voldoet aan de eisen van de database.
 * Geeft null terug als hij goed is, anders een foutmelding voor de gebruiker.
 */
export function validateUsername(username: string): string | null {
  const normalized = normalizeUsername(username)

  if (normalized.length < 2) {
    return 'Gebruikersnaam moet minstens 2 tekens bevatten'
  }
  if (normalized.length > 50) {
    return 'Gebruikersnaam mag maximaal 50 tekens bevatten'
  }
  if (!/[a-z0-9]/.test(normalized)) {
    return 'Gebruikersnaam moet minstens één letter of cijfer bevatten'
  }

  return null
}

/**
 * Wachtwoordeis. Supabase weigert standaard alles onder de 6 tekens; voor een
 * werkapp met personeelsgegevens houden we 8 aan.
 */
export const MIN_PASSWORD_LENGTH = 8

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Wachtwoord moet minstens ${MIN_PASSWORD_LENGTH} tekens bevatten`
  }
  return null
}

/**
 * Genereert een leesbaar tijdelijk wachtwoord dat de beheerder kan doorgeven.
 * Gebruikt de Web Crypto API, die zowel in Node als in de browser bestaat.
 */
export function generateTemporaryPassword(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint32Array(12)
  crypto.getRandomValues(bytes)

  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('')
}
