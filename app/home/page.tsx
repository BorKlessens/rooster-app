'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { isAdmin } from '@/lib/supabaseClient';
import UserHeader from '@/app/components/UserHeader';

/**
 * Home pagina
 * 
 * Deze pagina wordt gebruikt voor:
 * - Overzicht van ingelogde gebruiker
 * - Aankomende shifts weergave
 * - Snelle acties (beschikbaarheid doorgeven, rooster bekijken)
 * - Notificaties over wijzigingen in rooster
 * - Verschillende weergave voor medewerker vs admin
 */
export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>('');

  useEffect(() => {
    // Check of gebruiker ingelogd is (alleen op client)
    const checkAuth = async () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const user = localStorage.getItem('username');
      setIsLoggedIn(loggedIn);
      setUsername(user);
      
      if (!loggedIn) {
        router.push('/login');
        return;
      }
      
      // Haal volledige naam op
      const storedUsers = localStorage.getItem('users');
      if (storedUsers && user) {
        const users = JSON.parse(storedUsers);
        const userData = users.find((u: { username: string }) => u.username === user);
        if (userData && userData.fullName) {
          setFullName(userData.fullName);
        }
      }
      
      // Check of gebruiker admin is
      const admin = await isAdmin();
      if (admin) {
        router.push('/admin');
        return;
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router]);

  // Toon loading state tijdens check (zowel server als client)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-700">Bezig met laden...</p>
        </div>
      </div>
    );
  }

  // Als niet ingelogd, toon loading (redirect wordt afgehandeld in useEffect)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-700">Bezig met laden...</p>
        </div>
      </div>
    );
  }
    return (
    <div className="h-screen bg-blue-50 pb-20 overflow-hidden flex flex-col">
      <UserHeader title="Home" username={username || undefined} fullName={fullName} />
      <div className="w-full flex-1 flex flex-col relative header-offset">
        {/* Welkomsttekst in het midden met hero image */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Hero image achtergrond */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="relative w-full h-full">
              <Image
                src="/elckerlyc.jpg"
                alt="Cultureel Centrum Elckerlyc"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
          {/* Welkomsttekst */}
          <div className="text-center max-w-2xl relative z-10 px-4">
            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-3">
              {fullName || username ? `Welkom ${fullName || username}!` : 'Welkom terug!'}
            </h2>
            <p className="text-sm sm:text-base text-blue-900 leading-relaxed">
              Welkom bij de Rooster App van de Elckerlyc. Geef je beschikbaarheid op en bekijk je rooster.
            </p>
          </div>
        </div>
        
        {/* Navigatie grid - overlappend met afbeelding */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full px-4 pb-4 relative z-10 -mt-16 sm:-mt-20">
          {/* Dashboard card */}
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200 text-left group hover:border-blue-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors flex-shrink-0">
                <svg className="w-5 h-5 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-blue-900 mb-0.5">Dashboard</h3>
                <p className="text-xs text-blue-900">Shifts en statistieken</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-blue-400 group-hover:text-blue-900 transition-all duration-200 group-hover:translate-x-1 flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Rooster card */}
          <button
            onClick={() => router.push('/planning')}
            className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200 text-left group hover:border-blue-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors flex-shrink-0">
                <svg className="w-5 h-5 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-blue-900 mb-0.5">Rooster</h3>
                <p className="text-xs text-blue-900">Werkplanning</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-blue-400 group-hover:text-blue-900 transition-all duration-200 group-hover:translate-x-1 flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Beschikbaarheid card */}
          <button
            onClick={() => router.push('/beschikbaarheid')}
            className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200 text-left group hover:border-blue-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors flex-shrink-0">
                <svg className="w-5 h-5 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-blue-900 mb-0.5">Beschikbaarheid</h3>
                <p className="text-xs text-blue-900">Beschikbaarheid doorgeven</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-blue-400 group-hover:text-blue-900 transition-all duration-200 group-hover:translate-x-1 flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Meldingen card */}
          <button
            onClick={() => router.push('/notifications')}
            className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200 text-left group hover:border-blue-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors flex-shrink-0">
                <svg className="w-5 h-5 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-blue-900 mb-0.5">Meldingen</h3>
                <p className="text-xs text-blue-900">Notificaties</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-blue-400 group-hover:text-blue-900 transition-all duration-200 group-hover:translate-x-1 flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
