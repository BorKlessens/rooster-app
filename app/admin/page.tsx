'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdmin } from '@/lib/supabaseClient';
import AdminNav from '@/app/components/AdminNav';

/**
 * Admin pagina
 * 
 * Deze pagina wordt later gebruikt voor:
 * - Overzicht van alle medewerkers
 * - Shifts aanmaken en beheren
 * - Beschikbaarheid van medewerkers bekijken
 * - Medewerkers inplannen op shifts
 * - Rooster wijzigingen doorvoeren
 * - Alleen toegankelijk voor gebruikers met admin rol
 */
export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(loggedIn);
      
      if (!loggedIn) {
        router.push('/login');
        return;
      }
      
      // Check admin status
      const admin = await isAdmin();
      setIsAdminUser(admin);
      
      if (!admin) {
        // Redirect naar home als geen admin
        router.push('/home');
        return;
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Bezig met laden...</p>
        </div>
      </div>
    );
  }

  if (!isAdminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 sm:pt-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
          Beheer hier shifts, medewerkers en planningen.
        </p>
        
        {/* Placeholder content voor admin functionaliteit */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Shifts beheren card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              Shifts beheren
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mb-4">
              Maak nieuwe shifts aan en wijzig bestaande shifts
            </p>
            <button
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              Nieuwe shift (binnenkort)
            </button>
          </div>
          
          {/* Inplannen card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              Inplannen
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mb-4">
              Plan medewerkers in voor diensten
            </p>
            <a
              href="/admin/inplannen"
              className="inline-block w-full sm:w-auto text-center bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md"
            >
              Medewerker inplannen
            </a>
          </div>
          
          {/* Beschikbaarheid overzicht card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              Beschikbaarheid
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mb-4">
              Overzicht van beschikbaarheid van alle medewerkers
            </p>
            <a
              href="/admin/beschikbaarheid"
              className="inline-block w-full sm:w-auto text-center bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md"
            >
              Bekijk beschikbaarheid
            </a>
          </div>
          
          {/* Rooster beheer card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              Rooster beheer
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm">
              Bekijk en beheer het volledige rooster
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}






