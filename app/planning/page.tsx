'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAdmin, supabase, getCurrentUserId } from '@/lib/supabaseClient';
import UserHeader from '@/app/components/UserHeader';

/**
 * Planning / Rooster pagina
 * 
 * Deze pagina toont het rooster van de medewerker in een Apple Agenda-achtige interface.
 * 
 * Functionaliteit:
 * - Maandoverzicht met kalender grid
 * - Dagen met diensten zijn visueel gemarkeerd
 * - Klikken op een dag toont dagdetail
 * - Vandaag is extra herkenbaar
 * - Mobile-first design
 * 
 * TODO: Later koppelen aan Supabase
 * - Ophalen van diensten uit database
 * - Filteren op ingelogde gebruiker
 * - Real-time updates bij wijzigingen
 */

// Type definitie voor een dienst/shift
interface Shift {
  id: string;
  user_id: string;
  username: string;
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  role?: string; // Bijv. "Bediening", "Keuken", etc.
  description?: string; // Bijv. "Horeca dienst"
}

// Type definitie voor een dag met diensten
interface DayWithShifts {
  date: Date;
  shifts: Shift[];
}

// Mock data - later vervangen door Supabase query
const generateMockShifts = (): Map<string, Shift[]> => {
  const shifts = new Map<string, Shift[]>();
  const today = new Date();
  const userId = getCurrentUserId();
  
  // Mock gebruikersnamen
  const mockUsers = ['Jan Jansen', 'Piet Pietersen', 'Marie de Vries', 'Klaas Klaassen'];
  
  // Voeg enkele mock diensten toe voor de komende weken
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Voeg willekeurig diensten toe (ongeveer 30% kans per dag)
    if (Math.random() > 0.7) {
      const dayShifts: Shift[] = [];
      
      // 1-2 diensten per dag
      const numShifts = Math.random() > 0.5 ? 1 : 2;
      
      for (let j = 0; j < numShifts; j++) {
        const startHour = Math.floor(Math.random() * 8) + 9; // Tussen 09:00 en 16:00
        const duration = Math.floor(Math.random() * 4) + 4; // 4-8 uur
        const endHour = startHour + duration;
        const mockUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
        const mockUserId = `user_${mockUser.toLowerCase().replace(' ', '_')}`;
        
        dayShifts.push({
          id: `shift-${date.toISOString()}-${j}`,
          user_id: mockUserId,
          username: mockUser,
          startTime: `${startHour.toString().padStart(2, '0')}:00`,
          endTime: `${endHour.toString().padStart(2, '0')}:00`,
          role: ['Bediening', 'Keuken', 'Bar'][Math.floor(Math.random() * 3)],
          description: 'Horeca dienst',
        });
      }
      
      shifts.set(date.toISOString().split('T')[0], dayShifts);
    }
  }
  
  return shifts;
};

export default function PlanningPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  
  // State voor huidige maand
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // State voor geselecteerde dag (null = maandoverzicht, Date = dagdetail)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  // Mock data voor diensten
  const [shiftsData, setShiftsData] = useState<Map<string, Shift[]>>(new Map());

  useEffect(() => {
    // Check of gebruiker ingelogd is
    const checkAuth = async () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const user = localStorage.getItem('username');
      setIsLoggedIn(loggedIn);
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
      
      // Check of gebruiker admin is
      const admin = await isAdmin();
      if (admin) {
        router.push('/admin');
        return;
      }
      
      // Laad diensten uit Supabase
      await loadShifts();
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router]);

  useEffect(() => {
    // Laad diensten opnieuw wanneer maand verandert
    if (isLoggedIn && !isLoading) {
      loadShifts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  /**
   * Laad alle diensten uit Supabase (niet alleen van ingelogde gebruiker)
   */
  const loadShifts = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      // Fallback naar mock data als geen userId
      const mockShifts = generateMockShifts();
      setShiftsData(mockShifts);
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

    try {
      // Haal ALLE shifts op (niet alleen van ingelogde gebruiker)
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .gte('date', formatDateForQuery(monthStart))
        .lte('date', formatDateForQuery(monthEnd))
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading shifts:', error);
        // Fallback naar mock data bij error
        const mockShifts = generateMockShifts();
        setShiftsData(mockShifts);
        return;
      }

      // Transform data naar Map
      const shiftsMap = new Map<string, Shift[]>();
      if (data && data.length > 0) {
        // Helper functie om tijd te formatteren (verwijder seconden)
        const formatTimeFromDB = (time: string): string => {
          if (!time) return '';
          // Als tijd in "HH:MM:SS" formaat is, haal de seconden eraf
          if (time.includes(':') && time.split(':').length === 3) {
            return time.substring(0, 5); // "HH:MM"
          }
          return time;
        };

        data.forEach((shift: any) => {
          const dateString = shift.date;
          if (!shiftsMap.has(dateString)) {
            shiftsMap.set(dateString, []);
          }
          shiftsMap.get(dateString)!.push({
            id: shift.id,
            user_id: shift.user_id,
            username: shift.username,
            startTime: formatTimeFromDB(shift.start_time),
            endTime: formatTimeFromDB(shift.end_time),
            role: shift.role || undefined,
            description: shift.description || undefined,
          });
        });
      }

      setShiftsData(shiftsMap);
    } catch (error) {
      console.error('Error:', error);
      // Fallback naar mock data bij error
      const mockShifts = generateMockShifts();
      setShiftsData(mockShifts);
    }
  };

  /**
   * Genereer alle dagen voor de huidige maand
   */
  const getDaysInMonth = (): Date[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Eerste dag van de maand
    const firstDay = new Date(year, month, 1);
    
    // Laatste dag van de maand
    const lastDay = new Date(year, month + 1, 0);
    
    // Eerste dag van de week (maandag = 1, zondag = 0)
    const startDay = firstDay.getDay();
    const mondayOffset = startDay === 0 ? 6 : startDay - 1; // Maandag als eerste dag
    
    // Begin vanaf maandag van de week waarin de eerste dag valt
    const calendarStart = new Date(firstDay);
    calendarStart.setDate(firstDay.getDate() - mondayOffset);
    
    // Eind op zondag van de week waarin de laatste dag valt
    const endDay = lastDay.getDay();
    const sundayOffset = endDay === 0 ? 0 : 7 - endDay;
    const calendarEnd = new Date(lastDay);
    calendarEnd.setDate(lastDay.getDate() + sundayOffset);
    
    const days: Date[] = [];
    const current = new Date(calendarStart);
    
    while (current <= calendarEnd) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  /**
   * Check of een datum vandaag is
   */
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  /**
   * Check of een datum in de huidige maand valt
   */
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth();
  };

  /**
   * Formatteer datum naar YYYY-MM-DD string (zonder tijdzone problemen)
   */
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * Haal diensten op voor een specifieke datum
   */
  const getShiftsForDate = (date: Date): Shift[] => {
    const dateString = formatDateToString(date);
    return shiftsData.get(dateString) || [];
  };

  /**
   * Check of een dienst van de ingelogde gebruiker is
   */
  const isMyShift = (shift: Shift): boolean => {
    const userId = getCurrentUserId();
    return shift.user_id === userId;
  };

  /**
   * Formatteer datum voor weergave
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  /**
   * Formatteer tijd voor weergave (verwijder seconden als die er zijn)
   */
  const formatTime = (time: string): string => {
    if (!time) return '';
    // Als tijd in "HH:MM:SS" formaat is, haal de seconden eraf
    if (time.includes(':') && time.split(':').length === 3) {
      return time.substring(0, 5); // Neem alleen eerste 5 karakters "HH:MM"
    }
    return time; // Al in "HH:MM" format
  };

  /**
   * Navigeer naar vorige maand
   */
  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  /**
   * Navigeer naar volgende maand
   */
  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  /**
   * Ga naar huidige maand
   */
  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
    setSelectedDay(null);
  };

  /**
   * Weekdag namen (maandag t/m zondag)
   */
  const weekDays = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

  // Loading state
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

  // DAGDETAIL VIEW
  if (selectedDay) {
    const allShifts = getShiftsForDate(selectedDay);
    const userId = getCurrentUserId();
    
    // Sorteer shifts op starttijd en dan op gebruikersnaam
    const sortedShifts = [...allShifts].sort((a, b) => {
      if (a.startTime !== b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      return a.username.localeCompare(b.username);
    });
    
    return (
      <div className="min-h-screen bg-blue-50 pb-24">
        <UserHeader title="Rooster" username={username} fullName={fullName} />
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
          {/* Header met terug knop */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4 gap-3">
              <button
                onClick={() => setSelectedDay(null)}
                className="flex items-center gap-2 text-blue-900 hover:text-blue-800 active:text-blue-900 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                <span className="text-sm font-medium">Terug naar maandoverzicht</span>
              </button>
              
              {/* Sneltoets naar vandaag */}
              {!isToday(selectedDay) && (
                <button
                  onClick={() => {
                    const today = new Date();
                    setSelectedDay(today);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  title="Ga naar vandaag"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span>Vandaag</span>
                </button>
              )}
            </div>
            
            {/* Datum navigatie met pijltjes */}
            <div className="flex items-center justify-between mb-4 gap-3 sm:gap-4">
              <button
                onClick={() => {
                  const prevDay = new Date(selectedDay);
                  prevDay.setDate(prevDay.getDate() - 1);
                  setSelectedDay(prevDay);
                }}
                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-900 transition-all duration-200 flex-shrink-0 shadow-sm hover:shadow-md"
                aria-label="Vorige dag"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              
              <div className="flex-1 text-center min-w-0 px-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900 mb-2 break-words">
                  {formatDate(selectedDay)}
                </h1>
                <p className="text-xs sm:text-sm text-blue-900">
                  {sortedShifts.length > 0 
                    ? `${sortedShifts.length} ${sortedShifts.length === 1 ? 'medewerker' : 'medewerkers'} ingepland`
                    : 'Geen medewerkers ingepland'}
                </p>
              </div>
              
              <button
                onClick={() => {
                  const nextDay = new Date(selectedDay);
                  nextDay.setDate(nextDay.getDate() + 1);
                  setSelectedDay(nextDay);
                }}
                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-900 transition-all duration-200 flex-shrink-0 shadow-sm hover:shadow-md"
                aria-label="Volgende dag"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>

          {/* Diensten lijst - alle werknemers (compact) */}
          {sortedShifts.length > 0 ? (
            <div className="space-y-2">
              {sortedShifts.map((shift) => {
                const isMyShiftValue = isMyShift(shift);
                return (
                  <div
                    key={shift.id}
                    className={`rounded-xl shadow-sm border p-2.5 sm:p-3 transition-all duration-200 hover:shadow-md ${
                      isMyShiftValue
                        ? 'bg-green-50 border-green-300 hover:border-green-400'
                        : 'bg-white border-blue-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      {/* Tijd en naam */}
                      <div className={`text-sm sm:text-base font-semibold whitespace-nowrap ${
                        isMyShiftValue ? 'text-green-800' : 'text-blue-900'
                      }`}>
                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                      </div>
                      <span className={`text-sm sm:text-base font-medium truncate ${
                        isMyShiftValue ? 'text-green-900' : 'text-blue-900'
                      }`}>
                        {shift.username}
                      </span>
                      {isMyShiftValue && (
                        <span className="px-1.5 py-0.5 bg-green-600 text-white text-xs font-medium rounded flex-shrink-0">
                          Jij
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Meer info knop voor de hele dag */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <button
                  onClick={() => router.push(`/planning/day/${selectedDay.toISOString().split('T')[0]}`)}
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Meer info over deze dag
                </button>
              </div>
            </div>
          ) : (
            /* Lege staat */
            <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-8 sm:p-12 text-center hover:shadow-md transition-shadow">
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
                Er zijn op deze dag geen medewerkers ingepland.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // MAANDOVERZICHT VIEW
  const days = getDaysInMonth();
  const monthName = currentMonth.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-blue-50 pb-24">
      <UserHeader title="Rooster" username={username} fullName={fullName} />
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Beschrijving */}
        <div className="mb-6">
          <p className="text-sm sm:text-base text-blue-900">
            Bekijk je ingeplande diensten
          </p>
        </div>

        {/* Maand navigatie */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-blue-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200"
              aria-label="Vorige maand"
            >
              <svg className="w-5 h-5 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            
            <div className="flex-1 text-center">
              <button
                onClick={goToCurrentMonth}
                className="text-base sm:text-lg font-semibold text-blue-900 hover:text-blue-700 transition-colors capitalize"
              >
                {monthName}
              </button>
            </div>
            
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200"
              aria-label="Volgende maand"
            >
              <svg className="w-5 h-5 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Kalender grid */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden hover:shadow-md transition-shadow">
          {/* Weekdag headers */}
          <div className="grid grid-cols-7 border-b-2 border-blue-200">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-blue-900 bg-blue-50"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Dagen grid */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const dayShifts = getShiftsForDate(day);
              const hasShifts = dayShifts.length > 0;
              const isTodayDate = isToday(day);
              const isCurrentMonthDate = isCurrentMonth(day);
              const userId = getCurrentUserId();
              
              // Tel eigen shifts en andere shifts
              const myShifts = dayShifts.filter(s => s.user_id === userId);
              const otherShifts = dayShifts.filter(s => s.user_id !== userId);
              const hasMyShifts = myShifts.length > 0;
              const hasOtherShifts = otherShifts.length > 0;

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDay(day)}
                  className={`
                    aspect-square p-1 sm:p-2 border-r border-b border-blue-100
                    transition-all duration-200 active:scale-95
                    ${isCurrentMonthDate ? 'bg-white' : 'bg-blue-50'}
                    ${isTodayDate 
                      ? 'ring-2 ring-blue-500 ring-inset bg-blue-50' 
                      : 'hover:bg-blue-50'
                    }
                    ${hasShifts ? 'cursor-pointer' : ''}
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    {/* Datumnummer als gekleurde cirkel */}
                    <div
                      className={`
                        w-8 h-8 sm:w-9 sm:h-9 rounded-full
                        flex items-center justify-center
                        text-xs sm:text-sm font-semibold
                        transition-all duration-200
                        ${
                          hasMyShifts
                            ? isTodayDate
                              ? 'bg-green-600 text-white ring-2 ring-green-400 ring-offset-1'
                              : 'bg-green-500 text-white'
                            : hasOtherShifts
                              ? isTodayDate
                                ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-1'
                                : 'bg-blue-500 text-white'
                              : isTodayDate
                                ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-1'
                                : isCurrentMonthDate
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'bg-gray-50 text-gray-400'
                        }
                      `}
                      title={
                        hasShifts
                          ? hasMyShifts
                            ? `${myShifts.length} ${myShifts.length === 1 ? 'eigen dienst' : 'eigen diensten'}${hasOtherShifts ? `, ${otherShifts.length} ${otherShifts.length === 1 ? 'andere dienst' : 'andere diensten'}` : ''}`
                            : `${otherShifts.length} ${otherShifts.length === 1 ? 'dienst' : 'diensten'}`
                          : 'Geen diensten'
                      }
                    >
                      {day.getDate()}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-blue-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 text-xs sm:text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-green-500 text-white flex items-center justify-center text-xs sm:text-sm font-semibold">
                15
              </div>
              <span className="text-blue-900">Jouw dienst</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs sm:text-sm font-semibold">
                20
              </div>
              <span className="text-blue-900">Andere diensten</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs sm:text-sm font-semibold">
                25
              </div>
              <span className="text-blue-900">Geen diensten</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * SUPABASE INTEGRATIE - Toekomstige implementatie
 * 
 * 1. Database structuur:
 *    - Tabel: shifts
 *    - Kolommen:
 *      * id (uuid, primary key)
 *      * user_id (uuid, foreign key naar users)
 *      * date (date)
 *      * start_time (time)
 *      * end_time (time)
 *      * role (text, optional)
 *      * description (text, optional)
 *      * created_at (timestamp)
 *      * updated_at (timestamp)
 * 
 * 2. Ophalen van diensten bij laden:
 *    ```typescript
 *    const monthStart = new Date(year, month, 1);
 *    const monthEnd = new Date(year, month + 1, 0);
 *    
 *    const { data, error } = await supabase
 *      .from('shifts')
 *      .select('*')
 *      .eq('user_id', userId)
 *      .gte('date', monthStart.toISOString().split('T')[0])
 *      .lte('date', monthEnd.toISOString().split('T')[0])
 *      .order('date', { ascending: true })
 *      .order('start_time', { ascending: true });
 *    ```
 * 
 * 3. Data transformatie:
 *    ```typescript
 *    const shiftsMap = new Map<string, Shift[]>();
 *    data?.forEach(shift => {
 *      const dateString = shift.date;
 *      if (!shiftsMap.has(dateString)) {
 *        shiftsMap.set(dateString, []);
 *      }
 *      shiftsMap.get(dateString)!.push({
 *        id: shift.id,
 *        startTime: shift.start_time,
 *        endTime: shift.end_time,
 *        role: shift.role,
 *        description: shift.description,
 *      });
 *    });
 *    setShiftsData(shiftsMap);
 *    ```
 * 
 * 4. Real-time updates (optioneel):
 *    ```typescript
 *    useEffect(() => {
 *      const channel = supabase
 *        .channel('shifts-changes')
 *        .on('postgres_changes', {
 *          event: '*',
 *          schema: 'public',
 *          table: 'shifts',
 *          filter: `user_id=eq.${userId}`
 *        }, (payload) => {
 *          // Update local state
 *          loadShifts();
 *        })
 *        .subscribe();
 *      
 *      return () => {
 *        supabase.removeChannel(channel);
 *      };
 *    }, [userId]);
 *    ```
 */
