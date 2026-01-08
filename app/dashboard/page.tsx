'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdmin } from '@/lib/supabaseClient';

/**
 * Dashboard pagina
 * 
 * Minimalistisch dashboard voor medewerkers met:
 * - Vandaag's shift overzicht
 * - Statistieken (uren deze maand)
 * - Aankomende shifts
 * - Snelle acties
 */
export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');

  useEffect(() => {
    // Check of gebruiker ingelogd is
    const checkAuth = async () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const user = localStorage.getItem('username');
      setIsLoggedIn(loggedIn);
      
      if (!loggedIn) {
        router.push('/login');
        return;
      }
      
      // Check of gebruiker admin is
      const admin = await isAdmin();
      if (admin) {
        router.push('/admin');
        return;
      }
      
      if (user) {
        setUsername(user);
        
        // Haal volledige naam op uit opgeslagen gebruikers
        const storedUsers = localStorage.getItem('users');
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          const userData = users.find((u: { username: string }) => u.username === user);
          if (userData && userData.fullName) {
            setFullName(userData.fullName);
          } else {
            setFullName(user);
          }
        } else {
          setFullName(user);
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router]);

  // Simuleer data (later vervangen door Supabase)
  const todayShift = {
    date: new Date(),
    startTime: '09:00',
    endTime: '19:00',
    location: 'Hoofdlocatie',
    function: 'Bediening',
    startsIn: '12 uur'
  };

  const monthlyHours = 45; // Later uit database
  const completedSwaps = 3; // Later uit database

  const upcomingShifts = [
    { date: '18 jan 2025', time: '09:00 - 19:00', location: 'Hoofdlocatie' },
    { date: '19 jan 2025', time: '12:00 - 18:00', location: 'Hoofdlocatie' },
    { date: '20 jan 2025', time: '07:00 - 13:00', location: 'Hoofdlocatie' }
  ];

  // Bepaal groet op basis van tijd
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Goedemorgen';
    if (hour < 18) return 'Goedemiddag';
    return 'Goedenavond';
  };

  // Formatteer datum
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('nl-NL', options);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-blue-700">Bezig met laden...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-blue-50 pb-20">
      <div className="max-w-md mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-2">
          <div className="flex items-center gap-3">
            {/* Profielfoto placeholder */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-lg shadow-md">
              {(fullName || username).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-blue-500">{getGreeting()}</p>
              <p className="text-lg font-bold text-blue-900">{fullName || username}</p>
            </div>
          </div>
          {/* Notificatie icoon */}
          <button 
            onClick={() => router.push('/notifications')}
            className="relative"
          >
            <svg className="w-6 h-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            {/* Blauwe dot voor ongelezen notificaties */}
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-blue-50"></span>
          </button>
        </div>

        {/* Today's Shift Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 mb-4 relative overflow-hidden shadow-lg">
          <p className="text-blue-100 text-sm font-medium mb-1">
            VANDAAG, {formatDate(todayShift.date)}
          </p>
          <p className="text-white text-4xl font-bold mb-2">
            {todayShift.startTime} - {todayShift.endTime}
          </p>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-blue-100 text-sm">Begint over {todayShift.startsIn}</p>
          </div>
          <button 
            onClick={() => router.push('/planning')}
            className="bg-white text-blue-700 font-semibold py-3 px-4 rounded-xl w-full hover:bg-blue-50 transition-colors shadow-sm"
          >
            Details bekijken
          </button>
          {/* Decoratieve illustratie rechts */}
          <div className="absolute right-0 top-0 w-24 h-24 opacity-10">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="2"/>
              <path d="M50 30 L50 50 L65 65" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Statistieken Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Uren deze maand */}
          <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-sm">
            <p className="text-3xl font-bold text-blue-700 mb-1">{monthlyHours}</p>
            <p className="text-sm text-blue-600 font-medium mb-1">Uren deze maand</p>
            <button 
              onClick={() => router.push('/planning')}
              className="text-xs text-blue-500 hover:text-blue-600 font-medium"
            >
              Bekijk rooster →
            </button>
          </div>

          {/* Voltooide wissels */}
          <div className="bg-blue-100 rounded-xl p-4 border-2 border-blue-300 shadow-sm">
            <p className="text-3xl font-bold text-blue-800 mb-1">{completedSwaps}</p>
            <p className="text-sm text-blue-700 font-medium mb-1">Voltooide wissels</p>
            <button 
              onClick={() => router.push('/planning')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Bekijk rooster →
            </button>
          </div>
        </div>

        {/* Aankomende Shifts */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-blue-900">Aankomende shifts</h2>
            <button 
              onClick={() => router.push('/planning')}
              className="text-sm text-blue-500 hover:text-blue-600 font-medium"
            >
              Meer zien
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-blue-200 divide-y divide-blue-100">
            {upcomingShifts.map((shift, index) => (
              <button
                key={index}
                onClick={() => router.push('/planning')}
                className="w-full flex items-center justify-between p-4 hover:bg-blue-50 transition-colors"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-900">{shift.date}</p>
                  <p className="text-xs text-blue-500">{shift.time} • {shift.location}</p>
                </div>
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Snelle actie button */}
        <button
          onClick={() => router.push('/beschikbaarheid')}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Beschikbaarheid doorgeven
        </button>
      </div>
    </div>
  );
}
