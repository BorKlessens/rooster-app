import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Pagina's die zonder account bereikbaar moeten blijven. */
const PUBLIC_PATHS = ['/welcome', '/login']

/** Waar een ingelogde gebruiker heen gaat als hij op een publieke pagina komt. */
const HOME_PATH = '/home'
const ADMIN_HOME_PATH = '/admin'

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
}

/**
 * Ververst de Supabase-sessie en bewaakt de routes.
 *
 * Dit draait bij elk verzoek. Het verversen is niet optioneel: zonder deze stap
 * verloopt het access token na een uur en wordt de gebruiker uitgelogd terwijl
 * hij de app gebruikt.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }

          response = NextResponse.next({ request })

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  // getUser() verifieert het token bij Supabase. getSession() doet dat niet en
  // is daarom ongeschikt om toegang op te baseren.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user) {
    if (isPublicPath(pathname)) {
      return response
    }

    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/welcome'
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  // De rol halen we alleen op waar hij ertoe doet, zodat we niet bij elk
  // verzoek een extra query naar de database doen.
  const needsRole = pathname.startsWith('/admin') || isPublicPath(pathname) || pathname === '/'

  if (!needsRole) {
    return response
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const isAdmin = profile?.role === 'admin'
  const landingPath = isAdmin ? ADMIN_HOME_PATH : HOME_PATH

  if (isPublicPath(pathname) || pathname === '/') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = landingPath
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  if (pathname.startsWith('/admin') && !isAdmin) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = HOME_PATH
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  return response
}
