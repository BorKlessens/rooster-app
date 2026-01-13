'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, getCurrentUserId } from '@/lib/supabaseClient';
import UserHeader from '@/app/components/UserHeader';

interface ShiftDetail {
  id: string;
  user_id: string;
  username: string;
  date: string;
  start_time: string;
  end_time: string;
  role: string | null;
  description: string | null;
}

function MaandOverzichtContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shifts, setShifts] = useState<ShiftDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Haal jaar en maand op uit query parameters of gebruik huidige maand
  useEffect(() => {
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    
    if (yearParam && monthParam) {
      const year = parseInt(yearParam);
      const month = parseInt(monthParam) - 1; // JavaScript maanden zijn 0-indexed
      setCurrentMonth(new Date(year, month, 1));
    }

    // Check of gebruiker ingelogd is
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const user = localStorage.getItem('username');
    setUsername(user || '');
    
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

  }, [searchParams, router]);

  // Laad diensten opnieuw wanneer maand verandert
  useEffect(() => {
    if (username) { // Alleen laden als gebruiker is ingelogd
      loadMonthShifts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  const loadMonthShifts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userId = getCurrentUserId();
      if (!userId) {
        setError('Gebruiker niet gevonden');
        setIsLoading(false);
        return;
      }

      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      // Formatteer datums zonder tijdzone problemen
      const formatDateForQuery = (date: Date): string => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      const { data, error: fetchError } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', userId) // Alleen diensten van de ingelogde gebruiker
        .gte('date', formatDateForQuery(monthStart))
        .lte('date', formatDateForQuery(monthEnd))
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (fetchError) {
        console.error('Error loading shifts:', fetchError);
        setError('Fout bij het laden van de diensten');
        return;
      }

      if (data) {
        setShifts(data);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Er is iets misgegaan bij het laden van de diensten');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (time: string): string => {
    if (!time) return '';
    if (time.includes(':') && time.split(':').length === 3) {
      return time.substring(0, 5);
    }
    return time;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatFullDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const monthName = currentMonth.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });

  // Groepeer shifts per datum
  const shiftsByDate = new Map<string, ShiftDetail[]>();
  shifts.forEach(shift => {
    if (!shiftsByDate.has(shift.date)) {
      shiftsByDate.set(shift.date, []);
    }
    shiftsByDate.get(shift.date)!.push(shift);
  });

  // Sorteer datums
  const sortedDates = Array.from(shiftsByDate.keys()).sort();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center pb-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-700">Bezig met laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-50 pb-24">
        <UserHeader title="Maandoverzicht" username={username} fullName={fullName} />
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 header-offset">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="text-sm font-medium">Terug</span>
          </button>
          <div className="bg-white rounded-xl shadow-md border-2 border-red-200 p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 pb-24">
      <UserHeader title="Maandoverzicht" username={username} fullName={fullName} />
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 header-offset">
        {/* Terug knop */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span className="text-sm font-medium">Terug naar rooster</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">
            Jouw diensten - {monthName}
          </h1>
          <p className="text-sm sm:text-base text-blue-900">
            Overzicht van al jouw ingeplande diensten voor deze maand
          </p>
          <p className="text-xs sm:text-sm text-blue-500 mt-1">
            {shifts.length} {shifts.length === 1 ? 'dienst' : 'diensten'} in totaal
          </p>
        </div>

        {/* Kopieer knop */}
        {shifts.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => {
                // Genereer tekst voor agenda
                let agendaText = `Jouw diensten ${monthName}\n\n`;
                
                sortedDates.forEach(date => {
                  const dayShifts = shiftsByDate.get(date)!;
                  agendaText += `${formatFullDate(date)}\n`;
                  dayShifts.forEach(shift => {
                    agendaText += `  ${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}`;
                    if (shift.role) {
                      agendaText += ` - ${shift.role}`;
                    }
                    if (shift.description) {
                      agendaText += ` (${shift.description})`;
                    }
                    agendaText += '\n';
                  });
                  agendaText += '\n';
                });

                // Kopieer naar clipboard
                navigator.clipboard.writeText(agendaText).then(() => {
                  alert('Diensten gekopieerd naar klembord! Je kunt ze nu in je agenda plakken.');
                }).catch(() => {
                  alert('Kon niet naar klembord kopiëren. Selecteer de tekst hieronder en kopieer handmatig.');
                });
              }}
              className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
            >
              Kopieer jouw diensten naar klembord
            </button>
          </div>
        )}

        {/* Shifts lijst per datum */}
        {sortedDates.length > 0 ? (
          <div className="space-y-6">
            {sortedDates.map((date) => {
              const dayShifts = shiftsByDate.get(date)!;
              return (
                <div key={date} className="bg-white rounded-xl shadow-md border border-blue-200 overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Datum header */}
                  <div className="bg-blue-100 border-b border-blue-200 px-4 py-3">
                    <h2 className="text-lg sm:text-xl font-bold text-blue-900">
                      {formatFullDate(date)}
                    </h2>
                    <p className="text-xs sm:text-sm text-blue-600 mt-1">
                      {dayShifts.length} {dayShifts.length === 1 ? 'dienst' : 'diensten'}
                    </p>
                  </div>

                  {/* Shifts voor deze dag */}
                  <div className="p-4 space-y-3">
                    {dayShifts.map((shift) => {
                      return (
                        <div
                          key={shift.id}
                          className="rounded-lg border p-3 sm:p-4 transition-all duration-200 bg-green-50 border-green-300 hover:border-green-400"
                        >
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex-1 min-w-0">
                              {/* Tijd */}
                              <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                                <div className="text-base sm:text-lg font-semibold whitespace-nowrap text-green-800">
                                  {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                </div>
                              </div>
                              
                              {/* Rol */}
                              {shift.role && (
                                <div className="text-sm text-green-700">
                                  <span className="font-semibold">Rol:</span> {shift.role}
                                </div>
                              )}
                              
                              {/* Beschrijving */}
                              {shift.description && (
                                <div className="text-sm mt-1 text-green-700">
                                  <span className="font-semibold">Beschrijving:</span> {shift.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md border-2 border-blue-200 p-8 sm:p-12 text-center hover:shadow-lg transition-shadow">
            <svg
              className="w-16 h-16 text-blue-300 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
              />
            </svg>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Geen diensten
            </h3>
            <p className="text-sm text-blue-900">
              Er zijn voor deze maand geen diensten ingepland.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MaandOverzichtPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-blue-50 flex items-center justify-center pb-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-700">Bezig met laden...</p>
        </div>
      </div>
    }>
      <MaandOverzichtContent />
    </Suspense>
  );
}

