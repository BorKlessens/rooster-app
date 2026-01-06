'use client';

import { usePathname } from 'next/navigation';

/**
 * Main content wrapper component
 * 
 * Voegt padding-bottom toe voor bottom navigation op mobile,
 * behalve op de admin pagina (die heeft top navigatie)
 */
export default function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname === '/admin';
  const isWelcomePage = pathname === '/welcome';

  // Geen wrapper voor welcome pagina (gebruikt fixed positioning)
  if (isWelcomePage) {
    return <>{children}</>;
  }

  return (
    <main className={isAdminPage ? '' : 'pb-20 md:pb-0'}>
      {children}
    </main>
  );
}



