'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Navigatie component voor de planning app
 * 
 * Mobile-first bottom navigation bar (zoals native mobile apps).
 * Op desktop wordt dit een normale top navigatie (behalve op admin pagina).
 * Later uitbreiden met:
 * - Gebruikersrol detectie (admin vs medewerker)
 * - Ingelogde gebruiker weergave
 * - Logout functionaliteit
 */
export default function Navigation() {
  const pathname = usePathname();
  const isAdminPage = pathname === '/admin';

  // Bepaal of een link actief is
  const isActive = (path: string) => pathname === path;

  // Op admin pagina: top navigatie (desktop)
  if (isAdminPage) {
    return (
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link 
              href="/" 
              className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              Rooster App
            </Link>
            <div className="flex space-x-4">
              <NavLink href="/dashboard" isActive={isActive('/dashboard')}>
                Dashboard
              </NavLink>
              <NavLink href="/planning" isActive={isActive('/planning')}>
                Planning
              </NavLink>
              <NavLink href="/admin" isActive={isActive('/admin')}>
                Admin
              </NavLink>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Op alle andere pagina's: bottom navigation (mobile-first)
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-around items-center h-16">
          <BottomNavLink href="/dashboard" isActive={isActive('/dashboard')} icon="📊">
            Dashboard
          </BottomNavLink>
          <BottomNavLink href="/planning" isActive={isActive('/planning')} icon="📅">
            Planning
          </BottomNavLink>
          <BottomNavLink href="/admin" isActive={isActive('/admin')} icon="⚙️">
            Admin
          </BottomNavLink>
          <BottomNavLink href="/login" isActive={isActive('/login')} icon="🔐">
            Login
          </BottomNavLink>
        </div>
      </div>
    </nav>
  );
}

/**
 * Desktop navigatie link component
 */
function NavLink({ 
  href, 
  isActive, 
  children 
}: { 
  href: string; 
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`
        px-3 py-2 rounded-md text-sm font-medium transition-colors
        ${isActive 
          ? 'bg-blue-100 text-blue-700' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }
      `}
    >
      {children}
    </Link>
  );
}

/**
 * Bottom navigation link component (mobile)
 * 
 * Toont icon en label, met visuele feedback wanneer actief
 */
function BottomNavLink({ 
  href, 
  isActive, 
  icon,
  children 
}: { 
  href: string; 
  isActive: boolean;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`
        flex flex-col items-center justify-center flex-1 h-full
        transition-colors min-w-0
        ${isActive 
          ? 'text-blue-600' 
          : 'text-gray-500'
        }
      `}
    >
      <span className="text-xl mb-1">{icon}</span>
      <span className="text-xs font-medium truncate w-full text-center px-1">
        {children}
      </span>
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
      )}
    </Link>
  );
}

