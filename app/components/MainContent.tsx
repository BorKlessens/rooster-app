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

  return (
    <main className={isAdminPage ? '' : 'pb-16 md:pb-0'}>
      {children}
    </main>
  );
}


