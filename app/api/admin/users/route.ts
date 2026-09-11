import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/apiAuth'
import {
  generateTemporaryPassword,
  normalizeUsername,
  usernameToAuthEmail,
  validatePassword,
  validateUsername,
} from '@/lib/auth'

interface CreateUserBody {
  username?: string
  fullName?: string
  email?: string
  phone?: string
  birthday?: string
  password?: string
}

/**
 * Maakt een nieuw medewerkersaccount aan.
 *
 * Het account komt in auth.users; de trigger handle_new_user maakt op basis van
 * de metadata automatisch het bijbehorende profiel in public.users. Er is dus
 * bewust geen losse insert in de profieltabel.
 */
export async function POST(request: Request) {
  const { error: authError } = await requireAdmin()
  if (authError) {
    return authError
  }

  let body: CreateUserBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldig verzoek' }, { status: 400 })
  }

  const username = normalizeUsername(body.username ?? '')
  const usernameError = validateUsername(username)
  if (usernameError) {
    return NextResponse.json({ error: usernameError }, { status: 400 })
  }

  // Zonder opgegeven wachtwoord genereren we er een, zodat de beheerder altijd
  // iets heeft om door te geven aan de medewerker.
  const password = body.password?.trim() || generateTemporaryPassword()
  const passwordError = validatePassword(password)
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'Deze gebruikersnaam is al in gebruik' },
      { status: 409 }
    )
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: usernameToAuthEmail(username),
    password,
    email_confirm: true,
    user_metadata: {
      username,
      full_name: body.fullName?.trim() || username,
      role: 'user',
      contact_email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      birthday: body.birthday || null,
    },
  })

  if (error || !data.user) {
    console.error('Aanmaken account mislukt:', error)

    // "jan jansen" en "jan.jansen" leiden tot hetzelfde interne auth-adres.
    // Supabase meldt dat als een dubbel e-mailadres, wat hier onbegrijpelijk is.
    if (error && /already/i.test(error.message)) {
      return NextResponse.json(
        {
          error:
            'Deze gebruikersnaam lijkt te veel op een bestaande. Kies een duidelijker afwijkende naam.',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error?.message ?? 'Aanmaken van het account is mislukt' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    id: data.user.id,
    username,
    // De beheerder geeft dit wachtwoord door; daarna is het niet meer op te vragen.
    temporaryPassword: body.password?.trim() ? null : password,
  })
}
