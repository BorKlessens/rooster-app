'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
        
        dayShifts.push({
          id: `shift-${date.toISOString()}-${j}`,
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
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
    
    if (!loggedIn) {
      router.push('/login');
      return;
    }
    
    // Laad mock data
    // TODO: Later vervangen door Supabase query
    // const { data, error } = await supabase
    //   .from('shifts')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .gte('date', monthStart)
    //   .lte('date', monthEnd);
    
    const mockShifts = generateMockShifts();
    setShiftsData(mockShifts);
    setIsLoading(false);
  }, [router, currentMonth]);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Bezig met laden...</p>
        </div>
      </div>
    );
  }

  // Als niet ingelogd, toon loading (redirect wordt afgehandeld in useEffect)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Bezig met laden...</p>
        </div>
      </div>
    );
  }

  // DAGDETAIL VIEW
  if (selectedDay) {
    const shifts = getShiftsForDate(selectedDay);
    
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
          {/* Header met terug knop */}
          <div className="mb-6">
            <button
              onClick={() => setSelectedDay(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <span className="text-sm font-medium">Terug naar maandoverzicht</span>
            </button>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {formatDate(selectedDay)}
            </h1>
          </div>

          {/* Diensten lijst */}
          {shifts.length > 0 ? (
            <div className="space-y-3">
              {shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Tijden */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-lg sm:text-xl font-bold text-gray-900">
                          {formatTime(shift.startTime)}
                        </div>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                        <div className="text-lg sm:text-xl font-bold text-gray-900">
                          {formatTime(shift.endTime)}
                        </div>
                      </div>
                      
                      {/* Rol */}
                      {shift.role && (
                        <div className="text-sm font-medium text-blue-600 mb-1">
                          {shift.role}
                        </div>
                      )}
                      
                      {/* Beschrijving */}
                      {shift.description && (
                        <div className="text-sm text-gray-600">
                          {shift.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Lege staat */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Geen diensten
              </h3>
              <p className="text-sm text-gray-500">
                Je hebt op deze dag geen diensten ingepland.
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
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Rooster
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Bekijk je ingeplande diensten
          </p>
        </div>

        {/* Maand navigatie */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Vorige maand"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            
            <div className="flex-1 text-center">
              <button
                onClick={goToCurrentMonth}
                className="text-base sm:text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors capitalize"
              >
                {monthName}
              </button>
            </div>
            
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Volgende maand"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Kalender grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Weekdag headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-gray-600 bg-gray-50"
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

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDay(day)}
                  className={`
                    aspect-square p-1 sm:p-2 border-r border-b border-gray-200
                    transition-all duration-200 active:scale-95
                    ${isCurrentMonthDate ? 'bg-white' : 'bg-gray-50'}
                    ${isTodayDate 
                      ? 'ring-2 ring-blue-500 ring-inset' 
                      : 'hover:bg-gray-50'
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
                            ? 'text-blue-600 font-bold' 
                            : 'text-gray-900'
                          : 'text-gray-400'
                        }
                      `}
                    >
                      {day.getDate()}
                    </div>

                    {/* Diensten indicator */}
                    {hasShifts && (
                      <div className="flex gap-0.5 sm:gap-1 justify-center">
                        {dayShifts.slice(0, 3).map((_, shiftIndex) => (
                          <div
                            key={shiftIndex}
                            className={`
                              w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full
                              ${isTodayDate 
                                ? 'bg-blue-600' 
                                : 'bg-blue-500'
                              }
                            `}
                          />
                        ))}
                        {dayShifts.length > 3 && (
                          <div className="text-[8px] sm:text-[10px] text-gray-500 font-medium">
                            +{dayShifts.length - 3}
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
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">Dag met diensten</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
              <span className="text-gray-600">Vandaag</span>
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
