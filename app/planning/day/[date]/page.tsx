'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, getCurrentUserId } from '@/lib/supabaseClient';

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

function DayDetailContent() {
  const router = useRouter();
  const params = useParams();
  const dateParam = params.date as string;
  
  const [shifts, setShifts] = useState<ShiftDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDayShifts();
  }, [dateParam]);

  const loadDayShifts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('shifts')
        .select('*')
        .eq('date', dateParam)
        .order('start_time', { ascending: true })
        .order('username', { ascending: true });

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
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const userId = getCurrentUserId();

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
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="text-sm font-medium">Terug</span>
          </button>
          <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Terug knop */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span className="text-sm font-medium">Terug naar overzicht</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">
            Alle diensten
          </h1>
          <p className="text-sm sm:text-base text-blue-900">
            {formatDate(dateParam)}
          </p>
          <p className="text-xs sm:text-sm text-blue-500 mt-1">
            {shifts.length} {shifts.length === 1 ? 'dienst' : 'diensten'} ingepland
          </p>
        </div>

        {/* Shifts lijst */}
        {shifts.length > 0 ? (
          <div className="space-y-4">
            {shifts.map((shift) => {
              const isMyShift = shift.user_id === userId;
              return (
                <div
                  key={shift.id}
                  className={`rounded-xl shadow-sm border-2 p-4 sm:p-6 transition-colors ${
                    isMyShift
                      ? 'bg-green-50 border-green-400 hover:border-green-500'
                      : 'bg-white border-blue-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Medewerker naam */}
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className={`text-lg sm:text-xl font-bold ${
                          isMyShift ? 'text-green-900' : 'text-blue-900'
                        }`}>
                          {shift.username}
                        </h3>
                        {isMyShift && (
                          <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-lg">
                            Jij
                          </span>
                        )}
                      </div>
                      
                      {/* Tijden */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`text-xl sm:text-2xl font-bold ${
                          isMyShift ? 'text-green-800' : 'text-blue-900'
                        }`}>
                          {formatTime(shift.start_time)}
                        </div>
                        <svg className={`w-5 h-5 ${
                          isMyShift ? 'text-green-500' : 'text-blue-400'
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                        <div className={`text-xl sm:text-2xl font-bold ${
                          isMyShift ? 'text-green-800' : 'text-blue-900'
                        }`}>
                          {formatTime(shift.end_time)}
                        </div>
                      </div>
                      
                      {/* Rol */}
                      {shift.role && (
                        <div className={`text-sm font-medium mb-2 ${
                          isMyShift ? 'text-green-700' : 'text-blue-600'
                        }`}>
                          <span className="font-semibold">Rol:</span> {shift.role}
                        </div>
                      )}
                      
                      {/* Beschrijving */}
                      {shift.description && (
                        <div className={`text-sm ${
                          isMyShift ? 'text-green-700' : 'text-blue-700'
                        }`}>
                          <span className="font-semibold">Beschrijving:</span> {shift.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
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
            <p className="text-sm text-blue-900">
              Er zijn op deze dag geen diensten ingepland.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DayDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-blue-50 flex items-center justify-center pb-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-700">Bezig met laden...</p>
        </div>
      </div>
    }>
      <DayDetailContent />
    </Suspense>
  );
}

