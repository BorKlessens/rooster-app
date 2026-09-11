import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';

/**
 * Startpagina
 *
 * Stuurt door naar de juiste plek op basis van de sessie. In de praktijk vangt
 * middleware.ts dit al af; dit is het vangnet voor het geval een verzoek de
 * middleware niet passeert.
 */
export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/welcome');
  }

  redirect(user.role === 'admin' ? '/admin' : '/home');
}
