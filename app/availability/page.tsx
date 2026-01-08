'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Beschikbaarheid pagina
 * 
 * Deze pagina is bedoeld voor medewerkers om hun beschikbaarheid per dag in te stellen.
 * 
 * Functionaliteit:
 * - Overzicht van dagen (week of maand)
 * - Per dag kan de gebruiker kiezen: Beschikbaar / Niet ingesteld
 * - Bij beschikbare dagen kan je tijdstippen selecteren (ochtend, middag, avond)
 * - Meerdere tijdstippen kunnen geselecteerd worden
 * - Tijdstippen verschijnen achter een plusje
 * 
 * TODO: Later koppelen aan Supabase
 * - Opslaan van beschikbaarheid per gebruiker, datum en tijdstippen
 * - Ophalen van bestaande beschikbaarheid bij laden
 * - Real-time updates mogelijk maken
 */

// Type definitie voor beschikbaarheid status
type AvailabilityStatus = 'available' | null;

// Type definitie voor tijdstippen
type TimeSlot = 'morning' | 'afternoon' | 'evening';

// Type definitie voor een dag met beschikbaarheid
interface DayAvailability {
  date: Date;
  status: AvailabilityStatus;
  timeSlots: TimeSlot[];
  locked: boolean;
}

export default function AvailabilityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // State voor beschikbaarheid per dag
  const [days, setDays] = useState<DayAvailability[]>([]);
  
  // State voor huidige week/maand weergave
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  
  // State voor welke dag uitgeklapt is (timeSlots zichtbaar)
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    // Check of gebruiker ingelogd is
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
    
    if (!loggedIn) {
      router.push('/login');
      return;
    }
    
    // Initialiseer dagen voor huidige week
    initializeWeek();
    setIsLoading(false);
  }, [router, currentWeekStart]);

  /**
   * Initialiseer de dagen voor de huidige week
   * TODO: Later ophalen uit Supabase
   */
  const initializeWeek = () => {
    const weekDays: DayAvailability[] = [];
    const start = new Date(currentWeekStart);
    
    // Begin op maandag (of eerste dag van de week)
    const dayOfWeek = start.getDay();
    const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Maandag als eerste dag
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    
    // Genereer 7 dagen (maandag t/m zondag)
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      
      // TODO: Later ophalen uit Supabase
      // Voor nu: mock data - standaard null (niet ingesteld)
      weekDays.push({
        date,
        status: null,
        timeSlots: [],
        locked: false,
      });
    }
    
    setDays(weekDays);
  };

  /**
   * Toggle het uitklappen van tijdstippen voor een dag
   * 
   * Het plusje is altijd zichtbaar, ook bij niet ingestelde dagen
   */
  const toggleExpanded = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const dateString = date.toDateString();
    if (expandedDay === dateString) {
      setExpandedDay(null);
    } else {
      setExpandedDay(dateString);
    }
  };

  /**
   * Toggle een tijdstip voor een specifieke dag
   * 
   * Logica:
   * - Als tijdstip al geselecteerd is, verwijder het
   * - Als tijdstip niet geselecteerd is, voeg het toe
   * - Dag wordt automatisch 'available' als er tijdstippen zijn
   * - Dag wordt automatisch 'null' als er geen tijdstippen meer zijn
   * - Kan niet wijzigen als dag gelocked is
   * 
   * TODO: Later opslaan in Supabase
   */
  const toggleTimeSlot = (date: Date, timeSlot: TimeSlot) => {
    setDays(prevDays => 
      prevDays.map(day => {
        if (day.date.toDateString() === date.toDateString()) {
          // Als gelocked, niet wijzigen
          if (day.locked) {
            return day;
          }
          
          const newTimeSlots = day.timeSlots.includes(timeSlot)
            ? day.timeSlots.filter(ts => ts !== timeSlot) // Verwijder tijdstip
            : [...day.timeSlots, timeSlot]; // Voeg tijdstip toe
          
          // Bepaal status op basis van aantal tijdstippen
          const newStatus: AvailabilityStatus = newTimeSlots.length > 0 ? 'available' : null;
          
          // Als er geen tijdstippen meer zijn, sluit de uitgeklapte dag
          if (newTimeSlots.length === 0) {
            setExpandedDay(null);
          }
          
          // TODO: Hier zou je een Supabase update kunnen doen
          // await supabase.from('availability').upsert({
          //   user_id: userId,
          //   date: date.toISOString().split('T')[0],
          //   status: newStatus,
          //   time_slots: newTimeSlots
          // });
          
          return { ...day, status: newStatus, timeSlots: newTimeSlots };
        }
        return day;
      })
    );
  };

  /**
   * Lock of unlock een dag
   * 
   * Logica:
   * - Alleen locken als er tijdstippen zijn geselecteerd
   * - Bij unlocken kunnen tijdstippen weer gewijzigd worden
   * 
   * @param keepExpanded - Als true, blijft de dag uitgeklapt na unlocken (bijv. bij bewerken)
   * 
   * TODO: Later opslaan in Supabase
   */
  const toggleLock = (date: Date, e: React.MouseEvent, keepExpanded: boolean = false) => {
    e.stopPropagation();
    
    setDays(prevDays => 
      prevDays.map(day => {
        if (day.date.toDateString() === date.toDateString()) {
          // Alleen locken als er tijdstippen zijn
          if (!day.locked && day.timeSlots.length === 0) {
            return day; // Kan niet locken zonder tijdstippen
          }
          
          const newLocked = !day.locked;
          
          // Als unlocken, sluit de uitgeklapte dag alleen als keepExpanded false is
          if (!newLocked && !keepExpanded) {
            setExpandedDay(null);
          }
          
          // TODO: Hier zou je een Supabase update kunnen doen
          // await supabase.from('availability').upsert({
          //   user_id: userId,
          //   date: date.toISOString().split('T')[0],
          //   locked: newLocked
          // });
          
          return { ...day, locked: newLocked };
        }
        return day;
      })
    );
  };

  /**
   * Navigeer naar vorige week
   */
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  /**
   * Navigeer naar volgende week
   */
  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  /**
   * Ga naar huidige week
   */
  const goToCurrentWeek = () => {
    setCurrentWeekStart(new Date());
  };

  /**
   * Formatteer datum voor weergave
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('nl-NL', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  /**
   * Formatteer datum voor korte weergave (dag nummer)
   */
  const formatDayNumber = (date: Date): string => {
    return date.getDate().toString();
  };

  /**
   * Check of een datum vandaag is
   */
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  /**
   * Get status label voor weergave
   */
  const getStatusLabel = (status: AvailabilityStatus, timeSlots: TimeSlot[]): string => {
    if (status === 'available') {
      if (timeSlots.length > 0) {
        return `Beschikbaar (${timeSlots.length} tijdstip${timeSlots.length > 1 ? 'pen' : ''})`;
      }
      return 'Beschikbaar';
    }
    return 'Niet ingesteld';
  };


  /**
   * Get label voor tijdstip
   */
  const getTimeSlotLabel = (timeSlot: TimeSlot): string => {
    switch (timeSlot) {
      case 'morning':
        return 'Ochtend';
      case 'afternoon':
        return 'Middag';
      case 'evening':
        return 'Avond';
    }
  };

  /**
   * Get icon voor tijdstip
   */
  const getTimeSlotIcon = (timeSlot: TimeSlot) => {
    switch (timeSlot) {
      case 'morning':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
          </svg>
        );
      case 'afternoon':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        );
      case 'evening':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
          </svg>
        );
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Beschikbaarheid
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Geef aan op welke dagen je wel of niet kunt werken
          </p>
        </div>

        {/* Week navigatie */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousWeek}
              className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Vorige week"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            
            <div className="flex-1 text-center">
              <button
                onClick={goToCurrentWeek}
                className="text-sm sm:text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {days.length > 0 && (
                  <>
                    {days[0].date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })} -{' '}
                    {days[days.length - 1].date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </>
                )}
              </button>
            </div>
            
            <button
              onClick={goToNextWeek}
              className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Volgende week"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Dagen overzicht */}
        <div className="space-y-3">
          {days.map((day) => {
            const isTodayDate = isToday(day.date);
            const isExpanded = expandedDay === day.date.toDateString();
            const statusClasses = {
              available: 'bg-green-50 border-green-300 hover:bg-green-100',
              null: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
            };
            
            const textClasses = {
              available: 'text-green-700',
              null: 'text-gray-600',
            };

            // Alle mogelijke tijdstippen
            const allTimeSlots: TimeSlot[] = ['morning', 'afternoon', 'evening'];

            return (
              <div
                key={day.date.toISOString()}
                className={`
                  w-full rounded-xl border-2 transition-all duration-200
                  shadow-sm hover:shadow-md
                  ${statusClasses[day.status || 'null']}
                  ${isTodayDate ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
                `}
              >
                {/* Hoofdkaart - niet klikbaar, alleen informatie */}
                <div className="w-full p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Datum */}
                      <div className="text-left">
                        <div className={`text-lg font-bold ${textClasses[day.status || 'null']}`}>
                          {formatDayNumber(day.date)}
                        </div>
                        <div className={`text-xs sm:text-sm ${textClasses[day.status || 'null']} opacity-75`}>
                          {formatDate(day.date)}
                        </div>
                        {isTodayDate && (
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            Vandaag
                          </div>
                        )}
                      </div>
                      
                      {/* Status label */}
                      <div className={`text-sm sm:text-base font-medium ${textClasses[day.status || 'null']}`}>
                        {getStatusLabel(day.status, day.timeSlots)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Plusje of Vinkje - afhankelijk van of er tijdstippen zijn */}
                      {day.timeSlots.length > 0 ? (
                        // Vinkje - klik om te locken
                        <button
                          onClick={(e) => toggleLock(day.date, e)}
                          className={`
                            p-2 rounded-lg transition-all duration-200
                            ${day.locked
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }
                          `}
                          aria-label={day.locked ? "Ontgrendel dag" : "Vergrendel dag"}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                        </button>
                      ) : (
                        // Plusje - klik om tijdstippen te selecteren
                        <button
                          onClick={(e) => toggleExpanded(day.date, e)}
                          className={`
                            p-2 rounded-lg transition-all duration-200
                            ${isExpanded 
                              ? 'bg-gray-200 text-gray-800 rotate-45' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }
                          `}
                          aria-label="Tijdstippen bewerken"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Uitgeklapte tijdstippen - zichtbaar als expanded en niet gelocked */}
                {isExpanded && !day.locked && (
                  <div className={`px-4 pb-4 pt-2 border-t-2 ${day.status === 'available' ? 'border-green-200' : 'border-gray-200'}`}>
                    <div className={`text-xs font-medium mb-3 ${day.status === 'available' ? 'text-green-700' : 'text-gray-700'}`}>
                      Selecteer tijdstippen:
                    </div>
                    <div className="flex gap-2">
                      {allTimeSlots.map((timeSlot) => {
                        const isSelected = day.timeSlots.includes(timeSlot);
                        
                        return (
                          <button
                            key={timeSlot}
                            onClick={() => toggleTimeSlot(day.date, timeSlot)}
                            className={`
                              flex-1 py-3 px-3 rounded-lg border-2 transition-all duration-200
                              active:scale-[0.97] font-medium text-sm
                              flex flex-col items-center justify-center gap-1
                              ${isSelected
                                ? 'bg-green-600 border-green-700 text-white shadow-md'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-green-400 hover:bg-green-50'
                              }
                            `}
                          >
                            <div className={isSelected ? 'text-white' : 'text-gray-600'}>
                              {getTimeSlotIcon(timeSlot)}
                            </div>
                            <span className="text-xs sm:text-sm">
                              {getTimeSlotLabel(timeSlot)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Locked indicator - toon geselecteerde tijdstippen als gelocked */}
                {day.locked && day.timeSlots.length > 0 && (
                  <div className="px-4 pb-4 pt-2 border-t-2 border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-medium text-green-700">
                        Vergrendeld - Geselecteerde tijdstippen:
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Zorg eerst dat de dag uitgeklapt is
                          setExpandedDay(day.date.toDateString());
                          // Ontgrendel daarna (met keepExpanded=true zodat het niet weer inklapt)
                          toggleLock(day.date, e, true);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-300 rounded-lg transition-colors flex items-center gap-1.5"
                        aria-label="Bewerken"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                        Bewerken
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {day.timeSlots.map((timeSlot) => (
                        <div
                          key={timeSlot}
                          className="flex-1 py-3 px-3 rounded-lg border-2 bg-green-50 border-green-300 text-green-700 font-medium text-sm flex flex-col items-center justify-center gap-1"
                        >
                          <div className="text-green-700">
                            {getTimeSlotIcon(timeSlot)}
                          </div>
                          <span className="text-xs sm:text-sm">
                            {getTimeSlotLabel(timeSlot)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Hoe werkt het?</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-gray-100 border-2 border-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <span className="text-gray-700">Klik op het plusje bij een dag om tijdstippen (ochtend, middag, avond) te selecteren.</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-green-100 border-2 border-green-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <span className="text-gray-700">Zodra je een tijdstip selecteert, verandert het plusje in een vinkje. Klik op het vinkje om de dag te vergrendelen.</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-green-600 border-2 border-green-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <span className="text-gray-700">Een vergrendelde dag kan niet meer gewijzigd worden. Klik op "Bewerken" of op het vinkje om te ontgrendelen en aan te passen.</span>
            </div>
          </div>
        </div>

        {/* Info tekst */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Klik op het plusje om tijdstippen te selecteren, daarna op het vinkje om te vergrendelen
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * SUPABASE INTEGRATIE - Toekomstige implementatie
 * 
 * 1. Database structuur:
 *    - Tabel: availability
 *    - Kolommen:
 *      * id (uuid, primary key)
 *      * user_id (uuid, foreign key naar users)
 *      * date (date)
 *      * status (text: 'available' | null)
 *      * time_slots (text[] of jsonb: ['morning', 'afternoon', 'evening'])
 *      * created_at (timestamp)
 *      * updated_at (timestamp)
 * 
 * 2. Ophalen van beschikbaarheid bij laden:
 *    ```typescript
 *    const { data, error } = await supabase
 *      .from('availability')
 *      .select('*')
 *      .eq('user_id', userId)
 *      .gte('date', weekStart.toISOString().split('T')[0])
 *      .lte('date', weekEnd.toISOString().split('T')[0]);
 *    ```
 * 
 * 3. Opslaan van wijzigingen:
 *    ```typescript
 *    const { error } = await supabase
 *      .from('availability')
 *      .upsert({
 *        user_id: userId,
 *        date: date.toISOString().split('T')[0],
 *        status: newStatus,
 *        time_slots: newTimeSlots
 *      }, {
 *        onConflict: 'user_id,date'
 *      });
 *    ```
 * 
 * 4. Real-time updates (optioneel):
 *    ```typescript
 *    supabase
 *      .channel('availability-changes')
 *      .on('postgres_changes', {
 *        event: '*',
 *        schema: 'public',
 *        table: 'availability',
 *        filter: `user_id=eq.${userId}`
 *      }, (payload) => {
 *        // Update local state
 *      })
 *      .subscribe();
 *    ```
 */

