import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Houdt het Supabase-project wakker.
 *
 * Supabase pauzeert projecten op de gratis tier na zeven dagen zonder
 * databaseactiviteit; het project moet daarna handmatig hervat worden. Vercel
 * Cron roept deze route dagelijks aan (zie vercel.json) en de triviale query
 * hieronder telt als activiteit.
 *
 * Zodra je overstapt naar Supabase Pro is dit niet meer nodig en kan de cron
 * uit vercel.json verdwijnen.
 */
export async function GET(request: Request) {
  // Vercel stuurt CRON_SECRET mee als Bearer token. Zonder deze controle kan
  // iedereen die de URL kent de route aanroepen.
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret) {
    const authorization = request.headers.get('authorization')

    if (authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Niet toegestaan' }, { status: 401 })
    }
  }

  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })

    if (error) {
      console.error('Keepalive-query mislukt:', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() })
  } catch (error) {
    console.error('Keepalive mislukt:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
