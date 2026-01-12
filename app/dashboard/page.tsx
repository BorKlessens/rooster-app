'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdmin, supabase, getCurrentUserId } from '@/lib/supabaseClient';
import UserHeader from '@/app/components/UserHeader';

/**
 * Dashboard pagina
 * 
 * Minimalistisch dashboard voor medewerkers met:
 * - Vandaag's shift overzicht
 * - Statistieken (uren deze maand, totaal shifts)
 * - Aankomende shifts
 * - Snelle acties
 */

interface Shift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  role?: string | null;
  description?: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  
  // Data states
  const [todayShift, setTodayShift] = useState<Shift | null>(null);
  const [upcomingShifts, setUpcomingShifts] = useState<Shift[]>([]);
  const [monthlyHours, setMonthlyHours] = useState<number>(0);
  const [monthlyShifts, setMonthlyShifts] = useState<number>(0);

  useEffect(() => {
    // Check of gebruiker ingelogd is
    const checkAuth = async () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const user = localStorage.getItem('username');
      const currentUserId = getCurrentUserId();
      
      setIsLoggedIn(loggedIn);
      setUserId(currentUserId);
      
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
        
        // Haal volledige naam op uit opgeslagen gebruikers of Supabase
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
      
      // Laad shifts data
      if (currentUserId) {
        await loadShiftsData(currentUserId);
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router]);

  // Laad shifts data uit Supabase
  const loadShiftsData = async (currentUserId: string) => {
    try {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      // Haal vandaag's shift op
      const { data: todayData } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('date', todayString)
        .order('start_time', { ascending: true })
        .limit(1)
        .single();

      if (todayData) {
        setTodayShift(todayData);
      }

      // Haal aankomende shifts op (vanaf morgen, max 5)
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];

      const { data: upcomingData } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', currentUserId)
        .gte('date', tomorrowString)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(5);

      if (upcomingData) {
        setUpcomingShifts(upcomingData);
      }

      // Bereken uren en shifts deze maand
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const monthStartString = monthStart.toISOString().split('T')[0];
      const monthEndString = monthEnd.toISOString().split('T')[0];

      const { data: monthlyData } = await supabase
        .from('shifts')
        .select('start_time, end_time')
        .eq('user_id', currentUserId)
        .gte('date', monthStartString)
        .lte('date', monthEndString);

      if (monthlyData) {
        // Bereken totaal aantal uren
        let totalHours = 0;
        monthlyData.forEach((shift) => {
          if (shift.start_time && shift.end_time) {
            const start = parseTime(shift.start_time);
            const end = parseTime(shift.end_time);
            if (start && end) {
              const hours = (end - start) / (1000 * 60 * 60);
              totalHours += hours;
            }
          }
        });
        setMonthlyHours(Math.round(totalHours * 10) / 10); // Rond af op 1 decimaal
        setMonthlyShifts(monthlyData.length);
      }
    } catch (error) {
      console.error('Error loading shifts data:', error);
    }
  };

  // Helper functie om tijd te parsen
  const parseTime = (timeString: string): number | null => {
    if (!timeString) return null;
    const parts = timeString.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date.getTime();
    }
    return null;
  };

  // Formatteer tijd (verwijder seconden)
  const formatTime = (time: string): string => {
    if (!time) return '';
    if (time.includes(':') && time.split(':').length === 3) {
      return time.substring(0, 5);
    }
    return time;
  };

  // Bereken tijd tot shift begint
  const getTimeUntilShift = (shift: Shift): string => {
    if (!shift.date || !shift.start_time) return '';
    
    const shiftDate = new Date(`${shift.date}T${shift.start_time}`);
    const now = new Date();
    const diff = shiftDate.getTime() - now.getTime();
    
    if (diff < 0) return 'Bezig';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours} ${hours === 1 ? 'uur' : 'uur'}`;
    } else if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? 'minuut' : 'minuten'}`;
    } else {
      return 'Nu';
    }
  };

  // Bepaal groet op basis van tijd
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Goedemorgen';
    if (hour < 18) return 'Goedemiddag';
    return 'Goedenavond';
  };

  // Formatteer datum
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('nl-NL', options);
  };

  // Formatteer datum kort (voor aankomende shifts)
  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check of het vandaag is
    if (date.toDateString() === today.toDateString()) {
      return 'Vandaag';
    }
    
    // Check of het morgen is
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Morgen';
    }
    
    // Anders formatteer als normale datum
    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short'
    });
  };

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

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-blue-50 pb-20">
      <UserHeader title="Dashboard" username={username} fullName={fullName} />
      <div className="max-w-md mx-auto px-4 py-6 sm:py-8">
        {/* Today's Shift Card */}
        {todayShift ? (
          <div className="bg-white rounded-xl p-5 mb-4 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-blue-900 text-sm font-medium mb-1">
              VANDAAG, {formatDate(todayShift.date)}
            </p>
            <p className="text-blue-900 text-3xl sm:text-4xl font-bold mb-2">
              {formatTime(todayShift.start_time)} - {formatTime(todayShift.end_time)}
            </p>
            {todayShift.role && (
              <p className="text-blue-900 text-sm mb-2">{todayShift.role}</p>
            )}
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <p className="text-blue-900 text-sm">Begint over {getTimeUntilShift(todayShift)}</p>
            </div>
            <button 
              onClick={() => router.push(`/planning/day/${todayShift.date}`)}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl w-full transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Details bekijken
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-5 mb-4 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-blue-900 text-sm font-medium mb-1">
              VANDAAG, {formatDate(new Date().toISOString().split('T')[0])}
            </p>
            <p className="text-blue-900 text-2xl sm:text-3xl font-bold mb-2">
              Geen shift vandaag
            </p>
            <p className="text-blue-900 text-sm mb-4">
              Je hebt vandaag geen dienst ingepland
            </p>
            <button 
              onClick={() => router.push('/planning')}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl w-full transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Bekijk rooster
            </button>
          </div>
        )}

        {/* Statistieken Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Uren deze maand */}
          <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-blue-900 mb-1">{monthlyHours}</p>
            <p className="text-xs sm:text-sm text-blue-900 font-medium">Uren deze maand</p>
          </div>

          {/* Totaal shifts deze maand */}
          <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-blue-900 mb-1">{monthlyShifts}</p>
            <p className="text-xs sm:text-sm text-blue-900 font-medium">Shifts deze maand</p>
          </div>
        </div>

        {/* Aankomende Shifts */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-blue-900">Aankomende shifts</h2>
            {upcomingShifts.length > 0 && (
              <button 
                onClick={() => router.push('/planning')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Meer zien
              </button>
            )}
          </div>
          
          {upcomingShifts.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-blue-200 divide-y divide-blue-100 overflow-hidden hover:shadow-md transition-shadow">
              {upcomingShifts.map((shift) => (
                <button
                  key={shift.id}
                  onClick={() => router.push(`/planning/day/${shift.date}`)}
                  className="w-full flex items-center justify-between p-4 hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-blue-900">{formatDateShort(shift.date)}</p>
                      {shift.role && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                          {shift.role}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-blue-900">
                      {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <span className="text-xs text-blue-600 font-medium">Bekijk rooster</span>
                    <svg className="w-5 h-5 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 text-center">
              <svg className="w-12 h-12 text-blue-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <p className="text-sm text-blue-900 font-medium mb-1">Geen aankomende shifts</p>
              <p className="text-xs text-blue-700">Je hebt nog geen shifts ingepland</p>
            </div>
          )}
        </div>

        {/* Snelle actie button */}
        <button
          onClick={() => router.push('/beschikbaarheid')}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:shadow-md"
        >
          Beschikbaarheid doorgeven
        </button>
      </div>
    </div>
  );
}
