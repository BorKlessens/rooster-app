import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Draait vóór elk verzoek: ververst de Supabase-sessie en bewaakt de routes.
 * In Next.js 16 heet dit bestand proxy in plaats van middleware.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Alles behalve statische bestanden en de service worker.
     *
     * /api is bewust uitgesloten: die routes controleren zelf of de aanroeper
     * mag wat hij vraagt, en een redirect naar een HTML-pagina is voor een
     * API-aanroep geen bruikbaar antwoord.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2)$).*)',
  ],
}
