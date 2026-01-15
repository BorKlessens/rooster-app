'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAdmin, supabase, getCurrentUserId } from '@/lib/supabaseClient';
import AdminHeader from '@/app/components/AdminHeader';

/**
 * Admin Rooster pagina
 * 
 * Deze pagina toont het rooster in dezelfde stijl als de gebruikers versie,
 * maar met extra admin functionaliteit om diensten toe te voegen en te verwijderen.
 */

// Type definitie voor een dienst/shift
interface Shift {
  id: string;
  user_id: string;
  username: string;
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  role?: string;
  description?: string;
}

interface User {
  id: string;
  username: string;
  fullName?: string;
}

export default function AdminRoosterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  
  // State voor huidige maand
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // State voor geselecteerde dag (null = maandoverzicht, Date = dagdetail)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  // State voor diensten
  const [shiftsData, setShiftsData] = useState<Map<string, Shift[]>>(new Map());
  
  // State voor toevoegen van dienst
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [newShiftUserId, setNewShiftUserId] = useState('');
  const [newShiftStartTime, setNewShiftStartTime] = useState('09:00');
  const [newShiftEndTime, setNewShiftEndTime] = useState('17:00');
  const [newShiftRole, setNewShiftRole] = useState('');
  const [newShiftDescription, setNewShiftDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State voor verwijderen bevestiging
  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
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
      
      const admin = await isAdmin();
      setIsAdminUser(admin);
      
      if (!admin) {
        router.push('/home');
        return;
      }
      
      await loadUsers();
      await loadShifts();
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (isLoggedIn && !isLoading && isAdminUser) {
      loadShifts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  /**
   * Laad alle gebruikers
   */
  const loadUsers = async () => {
    try {
      const { data: supabaseUsers, error } = await supabase
        .from('users')
        .select('id, username, full_name')
        .neq('role', 'admin')
        .order('username', { ascending: true });

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      if (supabaseUsers) {
        setUsers(supabaseUsers.map(u => ({
          id: u.id,
          username: u.username,
          fullName: u.full_name,
        })));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  /**
   * Laad alle diensten uit Supabase
   */
  const loadShifts = async () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const formatDateForQuery = (date: Date): string => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    try {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .gte('date', formatDateForQuery(monthStart))
        .lte('date', formatDateForQuery(monthEnd))
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading shifts:', error);
        setShiftsData(new Map());
        return;
      }

      const shiftsMap = new Map<string, Shift[]>();
      if (data && data.length > 0) {
        const formatTimeFromDB = (time: string): string => {
          if (!time) return '';
          if (time.includes(':') && time.split(':').length === 3) {
            return time.substring(0, 5);
          }
          return time;
        };

        data.forEach((shift: any) => {
          const dateString = shift.date;
          if (!shiftsMap.has(dateString)) {
            shiftsMap.set(dateString, []);
          }
          
          const formattedStartTime = formatTimeFromDB(shift.start_time);
          const formattedEndTime = formatTimeFromDB(shift.end_time);
          
          shiftsMap.get(dateString)!.push({
            id: shift.id,
            user_id: shift.user_id,
            username: shift.username,
            startTime: formattedStartTime,
            endTime: formattedEndTime,
            role: shift.role || undefined,
            description: shift.description || undefined,
          });
        });
      }

      setShiftsData(shiftsMap);
    } catch (error) {
      console.error('Error:', error);
      setShiftsData(new Map());
    }
  };

  /**
   * Genereer alle dagen voor de huidige maand
   */
  const getDaysInMonth = (): Date[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDay = firstDay.getDay();
    const mondayOffset = startDay === 0 ? 6 : startDay - 1;
    
    const calendarStart = new Date(firstDay);
    calendarStart.setDate(firstDay.getDate() - mondayOffset);
    
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
   * Formatteer datum naar YYYY-MM-DD string
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
    if (!time) return '';
    if (time.includes(':') && time.split(':').length === 3) {
      return time.substring(0, 5);
    }
    return time;
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
   * Sla nieuwe dienst op
   */
  const handleAddShift = async () => {
    if (!selectedDay || !newShiftUserId || !newShiftStartTime || !newShiftEndTime) {
      alert('Vul alle verplichte velden in.');
      return;
    }

    setIsSubmitting(true);
    const dateString = formatDateToString(selectedDay);
    const selectedUser = users.find(u => u.id === newShiftUserId);

    if (!selectedUser) {
      alert('Gebruiker niet gevonden.');
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('shifts')
        .insert({
          user_id: newShiftUserId,
          username: selectedUser.username,
          date: dateString,
          start_time: newShiftStartTime,
          end_time: newShiftEndTime,
          role: newShiftRole || null,
          description: newShiftDescription || null,
        });

      if (error) {
        console.error('Error saving shift:', error);
        alert('Er is een fout opgetreden bij het opslaan van de dienst.');
      } else {
        // Reset form
        setNewShiftUserId('');
        setNewShiftStartTime('09:00');
        setNewShiftEndTime('17:00');
        setNewShiftRole('');
        setNewShiftDescription('');
        setShowAddShiftModal(false);
        
        // Herlaad shifts
        await loadShifts();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Er is een onverwachte fout opgetreden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Verwijder dienst
   */
  const handleDeleteShift = async () => {
    if (!shiftToDelete) return;

    try {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftToDelete.id);

      if (error) {
        console.error('Error deleting shift:', error);
        alert('Er is een fout opgetreden bij het verwijderen van de dienst.');
      } else {
        setShowDeleteConfirm(false);
        setShiftToDelete(null);
        await loadShifts();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Er is een onverwachte fout opgetreden.');
    }
  };

  /**
   * Weekdag namen
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

  if (!isLoggedIn || !isAdminUser) {
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
    
    const sortedShifts = [...allShifts].sort((a, b) => {
      if (a.startTime !== b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      return a.username.localeCompare(b.username);
    });
    
    return (
      <div className="min-h-screen bg-blue-50 pb-24">
        <AdminHeader title="Rooster" username={username} fullName={fullName} />
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 header-offset">
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
              
              {!isToday(selectedDay) && (
                <button
                  onClick={() => {
                    const today = new Date();
                    setSelectedDay(today);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span>Vandaag</span>
                </button>
              )}
            </div>
            
            {/* Datum navigatie */}
            <div className="flex items-center justify-between mb-4 gap-3 sm:gap-4">
              <button
                onClick={() => {
                  const prevDay = new Date(selectedDay);
                  prevDay.setDate(prevDay.getDate() - 1);
                  setSelectedDay(prevDay);
                }}
                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-900 transition-all duration-200 flex-shrink-0 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              
              <div className="flex-1 text-center min-w-0 px-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900 mb-2 break-words">
                  {formatDate(selectedDay)}
                </h1>
                {isToday(selectedDay) && (
                  <p className="text-xs sm:text-sm font-medium text-blue-600 mb-1">
                    Vandaag
                  </p>
                )}
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
                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-900 transition-all duration-200 flex-shrink-0 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>

          {/* Diensten lijst */}
          {sortedShifts.length > 0 ? (
            <div className="space-y-2 mb-4">
              {sortedShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="bg-white rounded-xl shadow-md border border-blue-200 p-2.5 sm:p-3 transition-all duration-200 hover:shadow-lg relative flex items-center"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 pr-8">
                    <div className="text-sm sm:text-base font-semibold whitespace-nowrap text-blue-900">
                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                    </div>
                    <span className="text-sm sm:text-base font-medium truncate text-blue-900">
                      {shift.username}
                    </span>
                    {shift.role && (
                      <span className="text-xs text-blue-600 hidden sm:inline">
                        ({shift.role})
                      </span>
                    )}
                  </div>
                  
                  {/* Verwijder knop */}
                  <button
                    onClick={() => {
                      setShiftToDelete(shift);
                      setShowDeleteConfirm(true);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Verwijder dienst"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md border border-blue-200 p-8 sm:p-12 text-center hover:shadow-lg transition-shadow mb-4">
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

          {/* Voeg dienst toe knop */}
          <button
            onClick={() => {
              setNewShiftUserId('');
              setNewShiftStartTime('09:00');
              setNewShiftEndTime('17:00');
              setNewShiftRole('');
              setNewShiftDescription('');
              setShowAddShiftModal(true);
            }}
            className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Dienst toevoegen
          </button>

          {/* Voeg dienst toe modal */}
          {showAddShiftModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none" onClick={() => setShowAddShiftModal(false)}>
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 pointer-events-auto border-2 border-blue-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-blue-900">Dienst toevoegen</h2>
                  <button
                    onClick={() => setShowAddShiftModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  {formatDate(selectedDay)}
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Medewerker *
                    </label>
                    <select
                      value={newShiftUserId}
                      onChange={(e) => setNewShiftUserId(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    >
                      <option value="">Selecteer medewerker</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.username} {user.fullName ? `(${user.fullName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Starttijd *
                      </label>
                      <input
                        type="time"
                        value={newShiftStartTime}
                        onChange={(e) => setNewShiftStartTime(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Eindtijd *
                      </label>
                      <input
                        type="time"
                        value={newShiftEndTime}
                        onChange={(e) => setNewShiftEndTime(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Rol (optioneel)
                    </label>
                    <input
                      type="text"
                      value={newShiftRole}
                      onChange={(e) => setNewShiftRole(e.target.value)}
                      placeholder="Bijv. Bediening, Keuken"
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Beschrijving (optioneel)
                    </label>
                    <textarea
                      value={newShiftDescription}
                      onChange={(e) => setNewShiftDescription(e.target.value)}
                      placeholder="Extra informatie over de dienst"
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                      rows={2}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddShiftModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg transition-all duration-200"
                    disabled={isSubmitting}
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleAddShift}
                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Opslaan...' : 'Opslaan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Verwijder bevestiging modal */}
          {showDeleteConfirm && shiftToDelete && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none" onClick={() => setShowDeleteConfirm(false)}>
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 pointer-events-auto border-2 border-red-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-red-900">Dienst verwijderen</h2>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-sm text-gray-700 mb-4">
                  Weet je zeker dat je deze dienst wilt verwijderen?
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-red-900">
                    {shiftToDelete.username}
                  </p>
                  <p className="text-xs text-red-700">
                    {formatTime(shiftToDelete.startTime)} - {formatTime(shiftToDelete.endTime)}
                    {shiftToDelete.role && ` • ${shiftToDelete.role}`}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {formatDate(selectedDay!)}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg transition-all duration-200"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleDeleteShift}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Verwijderen
                  </button>
                </div>
              </div>
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
      <AdminHeader title="Rooster" username={username} fullName={fullName} />
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 header-offset">
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm sm:text-base text-blue-900">
            Bekijk en beheer alle ingeplande diensten
          </p>
        </div>

        {/* Maand navigatie */}
        <div className="mb-6 bg-white rounded-xl shadow-md border border-blue-200 p-4 hover:shadow-lg transition-shadow">
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
        <div className="bg-white rounded-xl shadow-lg border border-blue-200 overflow-hidden hover:shadow-xl transition-shadow">
          {/* Weekdag headers */}
          <div className="grid grid-cols-7 border-b-2 border-blue-200">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-blue-900 bg-blue-50 shadow-sm"
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
                    aspect-square p-1 sm:p-2 border-r border-b border-blue-100
                    transition-all duration-200 active:scale-95
                    ${isCurrentMonthDate ? 'bg-white' : 'bg-blue-50'}
                    ${isTodayDate 
                      ? 'ring-2 ring-blue-500 ring-inset bg-blue-50 shadow-inner' 
                      : hasShifts 
                        ? 'hover:bg-blue-50 hover:shadow-md' 
                        : 'hover:bg-blue-50 hover:shadow-sm'
                    }
                    ${hasShifts ? 'cursor-pointer' : ''}
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <div
                      className={`
                        w-8 h-8 sm:w-9 sm:h-9 rounded-full
                        flex items-center justify-center
                        text-xs sm:text-sm font-semibold
                        transition-all duration-200
                        ${
                          hasShifts
                            ? isTodayDate
                              ? 'bg-green-600 text-white ring-2 ring-green-400 ring-offset-1 shadow-lg'
                              : 'bg-green-500 text-white shadow-md hover:shadow-lg'
                            : isTodayDate
                              ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-1 shadow-lg'
                              : isCurrentMonthDate
                                ? 'bg-gray-100 text-gray-700 shadow-sm hover:shadow-md'
                                : 'bg-gray-50 text-gray-400 shadow-sm'
                        }
                      `}
                      title={
                        hasShifts
                          ? `${dayShifts.length} ${dayShifts.length === 1 ? 'dienst' : 'diensten'}`
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
        <div className="mt-6 bg-white rounded-xl shadow-md border border-blue-200 p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4 text-xs sm:text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-green-500 text-white flex items-center justify-center text-xs sm:text-sm font-semibold shadow-md">
                15
              </div>
              <span className="text-blue-900">Diensten ingepland</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs sm:text-sm font-semibold shadow-sm">
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

