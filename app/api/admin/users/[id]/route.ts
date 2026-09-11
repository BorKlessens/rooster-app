import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/apiAuth'
import {
  normalizeUsername,
  usernameToAuthEmail,
  validatePassword,
  validateUsername,
} from '@/lib/auth'

interface UpdateUserBody {
  username?: string
  fullName?: string
  email?: string
  phone?: string
  birthday?: string
  password?: string
}

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Werkt een medewerkersaccount bij.
 *
 * Bij een naamswijziging verandert ook het interne auth-adres mee, want daar is
 * de gebruikersnaam de basis van. Zou dat niet gebeuren, dan zou de medewerker
 * na een naamswijziging niet meer kunnen inloggen.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const { error: authError } = await requireAdmin()
  if (authError) {
    return authError
  }

  const { id } = await params

  let body: UpdateUserBody
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

  const supabaseAdmin = createAdminClient()

  const { data: current } = await supabaseAdmin
    .from('users')
    .select('id, username, role')
    .eq('id', id)
    .maybeSingle()

  if (!current) {
    return NextResponse.json({ error: 'Medewerker niet gevonden' }, { status: 404 })
  }

  if (username !== current.username) {
    const { data: taken } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (taken) {
      return NextResponse.json(
        { error: 'Deze gebruikersnaam is al in gebruik' },
        { status: 409 }
      )
    }
  }

  const authUpdates: { email?: string; password?: string } = {}

  if (username !== current.username) {
    authUpdates.email = usernameToAuthEmail(username)
  }

  const password = body.password?.trim()
  if (password) {
    const passwordError = validatePassword(password)
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }
    authUpdates.password = password
  }

  if (Object.keys(authUpdates).length > 0) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      ...authUpdates,
      email_confirm: authUpdates.email ? true : undefined,
    })

    if (error) {
      console.error('Bijwerken account mislukt:', error)

      // Zie de toelichting in app/api/admin/users/route.ts: verschillende
      // gebruikersnamen kunnen hetzelfde interne auth-adres opleveren.
      if (/already/i.test(error.message)) {
        return NextResponse.json(
          {
            error:
              'Deze gebruikersnaam lijkt te veel op een bestaande. Kies een duidelijker afwijkende naam.',
          },
          { status: 409 }
        )
      }

      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  // De rol staat bewust niet in deze update: die verander je alleen bewust via
  // de database, niet via een formulier dat ook naam en telefoonnummer aanpast.
  const { error: profileError } = await supabaseAdmin
    .from('users')
    .update({
      username,
      full_name: body.fullName?.trim() || username,
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      birthday: body.birthday || null,
    })
    .eq('id', id)

  if (profileError) {
    console.error('Bijwerken profiel mislukt:', profileError)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ id, username })
}

/**
 * Verwijdert een medewerkersaccount.
 *
 * Het verwijderen van de rij in auth.users trekt via de foreign keys ook het
 * profiel, de diensten en de beschikbaarheid mee.
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { admin, error: authError } = await requireAdmin()
  if (authError) {
    return authError
  }

  const { id } = await params

  if (id === admin.id) {
    return NextResponse.json(
      { error: 'Je kunt je eigen account niet verwijderen' },
      { status: 400 }
    )
  }

  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)

  if (error) {
    console.error('Verwijderen account mislukt:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ id })
}
