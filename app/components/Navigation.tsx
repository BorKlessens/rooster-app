'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { isAdmin } from '@/lib/supabaseClient';

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
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  
  const isAdminPage = pathname?.startsWith('/admin') || false;
  const isLoginPage = pathname === '/login';
  const isWelcomePage = pathname === '/welcome';
  const isSignUpPage = pathname === '/signup';

  // Bepaal of een link actief is
  const isActive = (path: string) => pathname === path;

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      if (loggedIn) {
        const admin = await isAdmin();
        setUserIsAdmin(admin);
      }
      setIsLoading(false);
    };
    checkAdmin();
  }, [pathname]);

  // Zorg ervoor dat de navbar altijd onderaan blijft op mobiel, zelfs tijdens scrollen
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!navRef.current) return;

    const navElement = navRef.current;

    // Forceer fixed positioning op mobiel - eenvoudige versie die alleen nodig is bij resize
    const enforceFixedPosition = () => {
      if (window.innerWidth <= 768 && navElement) {
        // Verwijder alle properties die kunnen interfereren
        navElement.style.removeProperty('top');
        navElement.style.removeProperty('margin-top');
        navElement.style.removeProperty('margin-bottom');
        
        // Forceer fixed positioning
        navElement.style.setProperty('position', 'fixed', 'important');
        navElement.style.setProperty('bottom', '0', 'important');
        navElement.style.setProperty('left', '0', 'important');
        navElement.style.setProperty('right', '0', 'important');
        navElement.style.setProperty('width', '100%', 'important');
        navElement.style.setProperty('z-index', '9999', 'important');
        
        // Behoud transform voor menuOpen state - check actuele state
        const isMenuOpen = document.body.getAttribute('data-menu-open') === 'true';
        if (isMenuOpen) {
          navElement.style.setProperty('transform', 'translateY(100%)', 'important');
        } else {
          navElement.style.setProperty('transform', 'translateY(0)', 'important');
        }
      } else if (window.innerWidth > 768 && navElement) {
        // Op desktop, reset naar relative
        navElement.style.removeProperty('position');
        navElement.style.removeProperty('bottom');
        navElement.style.removeProperty('left');
        navElement.style.removeProperty('right');
        navElement.style.removeProperty('width');
        navElement.style.removeProperty('transform');
      }
    };

    // Zet positie direct bij mount
    enforceFixedPosition();

    // Herhaal alleen bij resize
    window.addEventListener('resize', enforceFixedPosition);

    return () => {
      window.removeEventListener('resize', enforceFixedPosition);
    };
  }, [pathname, menuOpen]);

  // Check of hamburger menu open is (alleen op client)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMenuState = () => {
      const isOpen = document.body.getAttribute('data-menu-open') === 'true';
      setMenuOpen(isOpen);
    };

    // Check initial state
    checkMenuState();

    // Luister naar wijzigingen in data attribute
    const observer = new MutationObserver(checkMenuState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-menu-open']
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Update transform style wanneer menuOpen verandert (alleen op client)
  // Gebruik een timeout om te wachten tot navRef is geïnitialiseerd
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Wacht tot navRef is geïnitialiseerd
    const updateTransform = () => {
      if (!navRef.current) {
        // Probeer opnieuw na een korte delay
        setTimeout(updateTransform, 10);
        return;
      }
      
      const navElement = navRef.current;
      // Alleen op mobiel transform toepassen
      if (window.innerWidth <= 768) {
        if (menuOpen) {
          navElement.style.setProperty('transform', 'translateY(100%)', 'important');
        } else {
          navElement.style.setProperty('transform', 'translateY(0)', 'important');
        }
      }
    };
    
    updateTransform();
  }, [menuOpen]);

  // Verberg navigatie op login, welcome en signup pagina's
  if (isLoginPage || isWelcomePage || isSignUpPage) {
    return null;
  }

  // Als admin, toon alleen admin navigatie
  if (userIsAdmin && !isAdminPage) {
    return null; // Geen navigatie op gebruikerspagina's voor admins
  }

  // Verberg navigatie op admin pagina's (gebruik hamburger menu in plaats daarvan)
  if (isAdminPage) {
    return null;
  }

  // Als niet-admin, verberg navigatie op admin pagina's
  if (!userIsAdmin && isAdminPage) {
    return null;
  }

  // Op alle andere pagina's: bottom navigation (mobile-first)
  return (
    <nav 
      ref={navRef}
      id="bottom-navigation"
      className="fixed bottom-0 left-0 right-0 z-[9999] md:relative md:z-50 md:px-4 md:pb-4 transition-transform duration-300 md:!transform-none"
      style={{
        paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        width: '100%',
        zIndex: 9999,
      }}
    >
      <div className="w-full md:max-w-7xl md:mx-auto bg-white rounded-t-2xl md:rounded-2xl shadow-md border-t md:border border-gray-200 px-2 sm:px-4 hover:shadow-lg transition-all duration-300">
        <div className="flex justify-around items-center h-16 gap-1">
          <BottomNavLink href="/home" isActive={isActive('/home')} iconName="home">
            Home
          </BottomNavLink>
          <BottomNavLink href="/dashboard" isActive={isActive('/dashboard')} iconName="dashboard">
            Dashboard
          </BottomNavLink>
          <BottomNavLink href="/planning" isActive={isActive('/planning')} iconName="calendar">
            Planning
          </BottomNavLink>
          <BottomNavLink href="/beschikbaarheid" isActive={isActive('/beschikbaarheid')} iconName="availability">
            Beschikbaarheid
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
        relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
        ${isActive 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }
      `}
    >
      {children}
      {isActive && (
        <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
      )}
    </Link>
  );
}

/**
 * Icon component voor verschillende iconen
 */
function Icon({ name, isActive }: { name: string; isActive: boolean }) {
  const iconClasses = `w-5 h-5 transition-all duration-200 ${isActive ? 'scale-110' : ''}`;
  const strokeWidth = isActive ? 2.5 : 2;
  
  switch (name) {
    case 'home':
      return (
        <svg 
          className={iconClasses} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          strokeWidth={strokeWidth}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" 
          />
        </svg>
      );
    case 'calendar':
      return (
        <svg 
          className={iconClasses} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          strokeWidth={strokeWidth}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" 
          />
        </svg>
      );
    case 'availability':
      return (
        <svg 
          className={iconClasses} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          strokeWidth={strokeWidth}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" 
          />
        </svg>
      );
    case 'dashboard':
      return (
        <svg 
          className={iconClasses} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          strokeWidth={strokeWidth}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" 
          />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Bottom navigation link component (mobile)
 * 
 * Toont icon en label, met visuele feedback wanneer actief
 */
function BottomNavLink({ 
  href, 
  isActive, 
  iconName,
  children 
}: { 
  href: string; 
  isActive: boolean;
  iconName: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`
        relative flex flex-col items-center justify-center flex-1 h-full mx-1
        transition-all duration-200 min-w-0 rounded-xl
        ${isActive 
          ? 'bg-blue-50 text-blue-600' 
          : 'text-gray-500 hover:bg-gray-50 active:bg-gray-100'
        }
      `}
    >
      <div className="mb-1">
        <Icon name={iconName} isActive={isActive} />
      </div>
      <span className="text-xs font-medium truncate w-full text-center px-1">
        {children}
      </span>
      {isActive && (
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full" />
      )}
    </Link>
  );
}

