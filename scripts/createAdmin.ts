/**
 * Maakt het eerste beheerdersaccount aan.
 *
 * Dit lost het kip-en-ei-probleem op: accounts worden in de app aangemaakt door
 * een beheerder, maar de allereerste beheerder kan er nog niet zijn. Draai dit
 * script eenmalig nadat je supabase/schema.sql hebt uitgevoerd.
 *
 * Gebruik: npm run create-admin
 *
 * Vereist SUPABASE_SERVICE_ROLE_KEY in .env.local. Die sleutel geeft volledige
 * toegang tot de database, dus draai dit alleen op je eigen machine.
 */

import { createClient } from '@supabase/supabase-js'
import * as readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

import {
  MIN_PASSWORD_LENGTH,
  normalizeUsername,
  usernameToAuthEmail,
  validatePassword,
  validateUsername,
} from '../lib/auth'

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    console.error(
      'NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY moeten in .env.local staan.'
    )
    console.error(
      'Je vindt beide in het Supabase-dashboard onder Project Settings, API Keys.'
    )
    console.error(
      'Bij een nieuw project heet de service role key "secret key" (sb_secret_...).'
    )
    process.exit(1)
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const rl = readline.createInterface({ input: stdin, output: stdout })

  try {
    const rawUsername = await rl.question('Gebruikersnaam voor de beheerder: ')
    const username = normalizeUsername(rawUsername)

    const usernameError = validateUsername(username)
    if (usernameError) {
      console.error(usernameError)
      process.exit(1)
    }

    const fullName =
      (await rl.question('Volledige naam (optioneel): ')).trim() || username

    const password = await rl.question(
      `Wachtwoord (minimaal ${MIN_PASSWORD_LENGTH} tekens): `
    )

    const passwordError = validatePassword(password)
    if (passwordError) {
      console.error(passwordError)
      process.exit(1)
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id, role')
      .eq('username', username)
      .maybeSingle()

    // Bestaat het account al, dan promoveren we het en zetten we het wachtwoord
    // opnieuw. Zo is dit script ook bruikbaar als je jezelf hebt buitengesloten.
    if (existing) {
      const { error: passwordUpdateError } =
        await supabase.auth.admin.updateUserById(existing.id, { password })

      if (passwordUpdateError) {
        console.error('Wachtwoord bijwerken mislukt:', passwordUpdateError.message)
        process.exit(1)
      }

      const { error: roleError } = await supabase
        .from('users')
        .update({ role: 'admin', full_name: fullName })
        .eq('id', existing.id)

      if (roleError) {
        console.error('Rol bijwerken mislukt:', roleError.message)
        process.exit(1)
      }

      console.log(`Bestaand account "${username}" is nu beheerder.`)
      return
    }

    const { error } = await supabase.auth.admin.createUser({
      email: usernameToAuthEmail(username),
      password,
      email_confirm: true,
      user_metadata: {
        username,
        full_name: fullName,
        role: 'admin',
      },
    })

    if (error) {
      console.error('Aanmaken beheerder mislukt:', error.message)
      process.exit(1)
    }

    console.log(`Beheerder "${username}" is aangemaakt. Je kunt nu inloggen.`)
  } finally {
    rl.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
