'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAdmin, supabase } from '@/lib/supabaseClient';
import AdminHeader from '@/app/components/AdminHeader';

/**
 * Admin Dashboard pagina
 * 
 * Overzicht van alle belangrijke informatie voor admins:
 * - Statistieken (medewerkers, shifts, uren)
 * - Vandaag's shifts
 * - Waarschuwingen
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
  user_id: string;
  username?: string;
  full_name?: string;
}

interface Stats {
  totalMembers: number;
  availabilityCount: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  
  // Data states
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    availabilityCount: 0,
  });
  const [todayShifts, setTodayShifts] = useState<Shift[]>([]);
  const [upcomingShifts, setUpcomingShifts] = useState<Shift[]>([]);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [warnings, setWarnings] = useState<{
    membersWithoutAvailability: number;
  }>({
    membersWithoutAvailability: 0,
  });

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
      
      // Check admin status
      const admin = await isAdmin();
      setIsAdminUser(admin);
      
      if (!admin) {
        // Redirect naar home als geen admin
        router.push('/home');
        return;
      }
      
      // Laad alle data
      await loadDashboardData();
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      const today = new Date();
      const todayString = formatDateToString(today);
      
      // Bereken komende week
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekEndString = formatDateToString(weekEnd);

      // 1. Totaal medewerkers
      const { data: members } = await supabase
        .from('users')
        .select('id')
        .neq('role', 'admin');

      // 2. Vandaag's shifts - haal eerst alle shifts op
      const { data: allTodayShifts } = await supabase
        .from('shifts')
        .select('id, date, start_time, end_time, role, description, user_id')
        .eq('date', todayString)
        .not('user_id', 'is', null)
        .order('start_time', { ascending: true });

      // Haal user info op voor alle shifts
      const todayShiftsWithUsers: Shift[] = [];
      if (allTodayShifts && allTodayShifts.length > 0) {
        const userIds = [...new Set(allTodayShifts.map(s => s.user_id).filter(Boolean))];
        
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, username, full_name')
            .in('id', userIds);

          const usersMap = new Map(
            (usersData || []).map(u => [u.id, { username: u.username, full_name: u.full_name }])
          );

          allTodayShifts.forEach(shift => {
            const userInfo = usersMap.get(shift.user_id);
            if (userInfo) {
              todayShiftsWithUsers.push({
                id: shift.id,
                date: shift.date,
                start_time: shift.start_time,
                end_time: shift.end_time,
                role: shift.role,
                description: shift.description,
                user_id: shift.user_id,
                username: userInfo.username,
                full_name: userInfo.full_name,
              });
            }
          });
        }
      }

      // 3. Aankomende shifts (komende 7 dagen)
      const { data: allUpcomingShifts } = await supabase
        .from('shifts')
        .select('id, date, start_time, end_time, role, description, user_id')
        .gte('date', todayString)
        .lte('date', weekEndString)
        .not('user_id', 'is', null)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(10);

      // Haal user info op voor aankomende shifts
      const upcomingShiftsWithUsers: Shift[] = [];
      if (allUpcomingShifts && allUpcomingShifts.length > 0) {
        const userIds = [...new Set(allUpcomingShifts.map(s => s.user_id).filter(Boolean))];
        
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, username, full_name')
            .in('id', userIds);

          const usersMap = new Map(
            (usersData || []).map(u => [u.id, { username: u.username, full_name: u.full_name }])
          );

          allUpcomingShifts.forEach(shift => {
            const userInfo = usersMap.get(shift.user_id);
            if (userInfo) {
              upcomingShiftsWithUsers.push({
                id: shift.id,
                date: shift.date,
                start_time: shift.start_time,
                end_time: shift.end_time,
                role: shift.role,
                description: shift.description,
                user_id: shift.user_id,
                username: userInfo.username,
                full_name: userInfo.full_name,
              });
            }
          });
        }
      }

      // 4. Beschikbaarheid deze week
      const { data: availabilityData } = await supabase
        .from('availability')
        .select('user_id')
        .gte('date', todayString)
        .lte('date', weekEndString);

      // 5. Medewerkers zonder beschikbaarheid deze week
      const { data: allMembers } = await supabase
        .from('users')
        .select('id')
        .neq('role', 'admin');

      const membersWithAvailability = new Set(
        (availabilityData || []).map(a => a.user_id)
      );
      const membersWithoutAvailability = (allMembers || []).filter(
        m => !membersWithAvailability.has(m.id)
      ).length;

      setStats({
        totalMembers: members?.length || 0,
        availabilityCount: new Set((availabilityData || []).map(a => a.user_id)).size,
      });

      setTodayShifts(todayShiftsWithUsers);
      setUpcomingShifts(upcomingShiftsWithUsers);
      setWarnings({
        membersWithoutAvailability,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Vandaag';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Morgen';
    }
    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
    });
  };

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
    <div className="min-h-screen bg-gray-50 pb-24">
      <AdminHeader title="Dashboard" username={username} fullName={fullName} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 header-offset">

        {/* Header beschrijving */}
        <div className="mb-4 sm:mb-6">
          <p className="text-sm sm:text-base text-gray-600">
            Overzicht van medewerkers, shifts van vandaag, waarschuwingen en aankomende diensten.
          </p>
        </div>

        {/* Statistieken KPI Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{stats.totalMembers}</div>
            <div className="text-xs sm:text-sm text-gray-600">Medewerkers</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{stats.availabilityCount}</div>
            <div className="text-xs sm:text-sm text-gray-600">Met beschikbaarheid</div>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 mb-6">
          {/* Vandaag's Shifts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Vandaag's Shifts</h2>
              <Link
                href="/admin/rooster"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Bekijk rooster →
              </Link>
            </div>
            {todayShifts.length > 0 ? (
              <div className="space-y-2">
                {todayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">
                          {shift.full_name || shift.username || 'Onbekend'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                        </div>
                      </div>
                      {shift.role && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full ml-3">
                          {shift.role}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                <p className="text-sm text-gray-500">Geen shifts vandaag</p>
              </div>
            )}
          </div>

          {/* Waarschuwingen */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Waarschuwingen</h2>
              {warnings.membersWithoutAvailability > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                  {warnings.membersWithoutAvailability}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {warnings.membersWithoutAvailability > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div className="flex-1">
                      <div className="font-semibold text-orange-900 text-sm mb-1">
                        {warnings.membersWithoutAvailability} medewerker{warnings.membersWithoutAvailability !== 1 ? 's' : ''} zonder beschikbaarheid
                      </div>
                      <p className="text-xs text-orange-700">
                        Deze week hebben nog niet alle medewerkers beschikbaarheid doorgegeven
                      </p>
                      <Link
                        href="/admin/beschikbaarheid"
                        className="text-xs text-orange-600 hover:text-orange-700 font-medium mt-1 inline-block"
                      >
                        Bekijk beschikbaarheid →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
              {warnings.membersWithoutAvailability === 0 && (
                <div className="text-center py-6">
                  <svg className="w-12 h-12 text-green-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <p className="text-sm text-gray-500">Geen waarschuwingen</p>
                  <p className="text-xs text-gray-400 mt-1">Alles ziet er goed uit!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Aankomende Shifts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Aankomende Shifts</h2>
            <Link
              href="/admin/rooster"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Bekijk alle shifts →
            </Link>
          </div>
          {upcomingShifts.length > 0 ? (
            <div className="space-y-2">
              {(() => {
                // Groepeer shifts per datum
                const shiftsByDate = new Map<string, Shift[]>();
                upcomingShifts.forEach(shift => {
                  if (!shiftsByDate.has(shift.date)) {
                    shiftsByDate.set(shift.date, []);
                  }
                  shiftsByDate.get(shift.date)!.push(shift);
                });

                // Sorteer datums
                const sortedDates = Array.from(shiftsByDate.keys()).sort();

                return sortedDates.map(date => {
                  const shifts = shiftsByDate.get(date)!;
                  const isExpanded = expandedDates.has(date);

                  return (
                    <div
                      key={date}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Datum header - klikbaar om uit te klappen */}
                      <button
                        onClick={() => {
                          const newExpanded = new Set(expandedDates);
                          if (isExpanded) {
                            newExpanded.delete(date);
                          } else {
                            newExpanded.add(date);
                          }
                          setExpandedDates(newExpanded);
                        }}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">
                            {formatDate(date)}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                            {shifts.length} shift{shifts.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>

                      {/* Uitklapbare content */}
                      {isExpanded && (
                        <div className="p-3 bg-white space-y-2 border-t border-gray-200">
                          {shifts.map((shift) => (
                            <div
                              key={shift.id}
                              className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900 mb-1">
                                    {shift.full_name || shift.username || 'Onbekend'}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                  </div>
                                </div>
                                {shift.role && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full ml-3">
                                    {shift.role}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="text-center py-6">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <p className="text-sm text-gray-500">Geen aankomende shifts</p>
            </div>
          )}
        </div>

        {/* Snelle Acties */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Snelle Acties</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Link
              href="/admin/leden"
              className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors text-center"
            >
              <svg className="w-6 h-6 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
              <span className="text-xs sm:text-sm font-medium text-blue-900">Ledenlijst</span>
            </Link>

            <Link
              href="/admin/inplannen"
              className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors text-center"
            >
              <svg className="w-6 h-6 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-xs sm:text-sm font-medium text-green-900">Inplannen</span>
            </Link>

            <Link
              href="/admin/rooster"
              className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors text-center"
            >
              <svg className="w-6 h-6 text-purple-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <span className="text-xs sm:text-sm font-medium text-purple-900">Rooster</span>
            </Link>

            <Link
              href="/admin/beschikbaarheid"
              className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors text-center"
            >
              <svg className="w-6 h-6 text-orange-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span className="text-xs sm:text-sm font-medium text-orange-900">Beschikbaarheid</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}






