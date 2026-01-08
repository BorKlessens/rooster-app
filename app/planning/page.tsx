'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAdmin, supabase, getCurrentUserId } from '@/lib/supabaseClient';

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

    try {
      // Haal ALLE shifts op (niet alleen van ingelogde gebruiker)
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .gte('date', monthStart.toISOString().split('T')[0])
        .lte('date', monthEnd.toISOString().split('T')[0])
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
        data.forEach((shift: any) => {
          const dateString = shift.date;
          if (!shiftsMap.has(dateString)) {
            shiftsMap.set(dateString, []);
          }
          shiftsMap.get(dateString)!.push({
            id: shift.id,
            user_id: shift.user_id,
            username: shift.username,
            startTime: shift.start_time,
            endTime: shift.end_time,
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
   * Haal diensten op voor een specifieke datum
   */
  const getShiftsForDate = (date: Date): Shift[] => {
    const dateString = date.toISOString().split('T')[0];
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
   * Formatteer tijd voor weergave
   */
  const formatTime = (time: string): string => {
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
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
          {/* Header met terug knop */}
          <div className="mb-6">
            <button
              onClick={() => setSelectedDay(null)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <span className="text-sm font-medium">Terug naar maandoverzicht</span>
            </button>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">
              {formatDate(selectedDay)}
            </h1>
            <p className="text-sm text-blue-600">
              {sortedShifts.length > 0 
                ? `${sortedShifts.length} ${sortedShifts.length === 1 ? 'medewerker' : 'medewerkers'} ingepland`
                : 'Geen medewerkers ingepland'}
            </p>
          </div>

          {/* Diensten lijst - alle werknemers */}
          {sortedShifts.length > 0 ? (
            <div className="space-y-3">
              {sortedShifts.map((shift) => {
                const isMyShiftValue = isMyShift(shift);
                return (
                  <div
                    key={shift.id}
                    className={`rounded-xl shadow-sm border-2 p-4 sm:p-5 transition-colors ${
                      isMyShiftValue
                        ? 'bg-green-50 border-green-400 hover:border-green-500'
                        : 'bg-white border-blue-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Werknemer naam */}
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`text-base sm:text-lg font-bold ${
                            isMyShiftValue ? 'text-green-900' : 'text-blue-900'
                          }`}>
                            {shift.username}
                          </h3>
                          {isMyShiftValue && (
                            <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded">
                              Jij
                            </span>
                          )}
                        </div>
                        
                        {/* Tijden */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`text-lg sm:text-xl font-bold ${
                            isMyShiftValue ? 'text-green-800' : 'text-blue-900'
                          }`}>
                            {formatTime(shift.startTime)}
                          </div>
                          <svg className={`w-4 h-4 ${
                            isMyShiftValue ? 'text-green-500' : 'text-blue-400'
                          }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                          <div className={`text-lg sm:text-xl font-bold ${
                            isMyShiftValue ? 'text-green-800' : 'text-blue-900'
                          }`}>
                            {formatTime(shift.endTime)}
                          </div>
                        </div>
                        
                        {/* Rol */}
                        {shift.role && (
                          <div className={`text-sm font-medium mb-1 ${
                            isMyShiftValue ? 'text-green-700' : 'text-blue-600'
                          }`}>
                            {shift.role}
                          </div>
                        )}
                        
                        {/* Beschrijving */}
                        {shift.description && (
                          <div className={`text-sm ${
                            isMyShiftValue ? 'text-green-700' : 'text-blue-700'
                          }`}>
                            {shift.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Lege staat */
            <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-8 sm:p-12 text-center">
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
              <p className="text-sm text-blue-600">
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
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">
            Rooster
          </h1>
          <p className="text-sm sm:text-base text-blue-700">
            Bekijk je ingeplande diensten
          </p>
        </div>

        {/* Maand navigatie */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border-2 border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors"
              aria-label="Vorige maand"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
              className="p-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors"
              aria-label="Volgende maand"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Kalender grid */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 overflow-hidden">
          {/* Weekdag headers */}
          <div className="grid grid-cols-7 border-b-2 border-blue-200">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50"
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
                    {/* Datum nummer */}
                    <div
                      className={`
                        text-xs sm:text-sm font-medium mb-1
                        ${isCurrentMonthDate 
                          ? isTodayDate 
                            ? 'text-blue-700 font-bold' 
                            : 'text-blue-900'
                          : 'text-blue-400'
                        }
                      `}
                    >
                      {day.getDate()}
                    </div>

                    {/* Diensten indicator */}
                    {hasShifts && (
                      <div className="flex gap-0.5 sm:gap-1 justify-center flex-wrap">
                        {/* Eigen shifts (groen) */}
                        {hasMyShifts && (
                          <div
                            className={`
                              w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full
                              ${isTodayDate ? 'bg-green-600' : 'bg-green-500'}
                            `}
                            title="Jouw dienst"
                          />
                        )}
                        {/* Andere shifts (blauw) */}
                        {hasOtherShifts && (
                          <>
                            {otherShifts.slice(0, hasMyShifts ? 2 : 3).map((_, shiftIndex) => (
                              <div
                                key={`other-${shiftIndex}`}
                                className={`
                                  w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full
                                  ${isTodayDate ? 'bg-blue-600' : 'bg-blue-500'}
                                `}
                              />
                            ))}
                            {otherShifts.length > (hasMyShifts ? 2 : 3) && (
                              <div className="text-[8px] sm:text-[10px] text-blue-600 font-medium">
                                +{otherShifts.length - (hasMyShifts ? 2 : 3)}
                              </div>
                            )}
                          </>
                        )}
                        {/* Totaal aantal als er veel zijn */}
                        {dayShifts.length > 4 && (
                          <div className="text-[8px] sm:text-[10px] text-blue-600 font-medium">
                            {dayShifts.length}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border-2 border-blue-200 p-4">
          <div className="flex items-center gap-4 text-xs sm:text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-blue-700">Jouw dienst</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-blue-700">Andere diensten</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
              <span className="text-blue-700">Vandaag</span>
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
