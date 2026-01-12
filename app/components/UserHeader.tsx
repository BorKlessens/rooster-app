'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface UserHeaderProps {
  title: string;
  username?: string;
  fullName?: string;
}

export default function UserHeader({ title, username, fullName }: UserHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Update body data attribute wanneer menu open/gesloten is
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (menuOpen) {
        document.body.setAttribute('data-menu-open', 'true');
      } else {
        document.body.removeAttribute('data-menu-open');
      }
    }
  }, [menuOpen]);

  // Bepaal groet op basis van tijd
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Goedemorgen';
    if (hour < 18) return 'Goedemiddag';
    return 'Goedenavond';
  };

  // Bepaal welke pagina actief is
  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Header met hamburger menu */}
      <header className="bg-white border-b border-blue-200 shadow-sm sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 relative z-50">
          <div className="flex items-center justify-between">
            {/* Hamburger menu button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 relative z-50"
              aria-label="Menu"
            >
              <svg
                className="w-6 h-6 text-blue-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            {/* Titel */}
            <h1 className="text-lg sm:text-xl font-bold text-blue-900">
              {title}
            </h1>

            {/* Placeholder voor rechts uitlijning */}
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      {/* Sidebar menu */}
      <div
        className={`
          fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-[60] transform transition-transform duration-300 ease-in-out
          ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Menu</h2>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Sluit menu"
              >
                <svg className="w-5 h-5 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {getGreeting()} {fullName || username || ''}
            </p>
          </div>

          {/* Menu items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/home"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive('/home')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-blue-50 active:bg-blue-100'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  <span className="font-medium">Home</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive('/dashboard')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-blue-50 active:bg-blue-100'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                  </svg>
                  <span className="font-medium">Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/planning"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive('/planning')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-blue-50 active:bg-blue-100'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  <span className="font-medium">Rooster</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/beschikbaarheid"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive('/beschikbaarheid')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-blue-50 active:bg-blue-100'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span className="font-medium">Beschikbaarheid</span>
                </Link>
              </li>
            </ul>
          </nav>

          {/* Footer met logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('username');
                localStorage.removeItem('userId');
                router.push('/login');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 active:bg-red-100 transition-all duration-200 font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
              <span>Uitloggen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay wanneer menu open is */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 pointer-events-auto"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.1)'
          }}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}

