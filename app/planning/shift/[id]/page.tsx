'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
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

function ShiftDetailContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const shiftId = params.id as string;
  const dateParam = searchParams.get('date');
  
  const [shift, setShift] = useState<ShiftDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShiftDetail();
  }, [shiftId]);

  const loadShiftDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('shifts')
        .select('*')
        .eq('id', shiftId)
        .single();

      if (fetchError) {
        console.error('Error loading shift:', fetchError);
        setError('Dienst niet gevonden');
        return;
      }

      if (data) {
        setShift(data);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Er is iets misgegaan bij het laden van de dienst');
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
  const isMyShift = shift && shift.user_id === userId;

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

  if (error || !shift) {
    return (
      <div className="min-h-screen bg-blue-50 pb-24">
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
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
            <p className="text-red-600">{error || 'Dienst niet gevonden'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
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

        {/* Shift detail card */}
        <div className={`rounded-xl shadow-lg border-2 p-6 sm:p-8 ${
          isMyShift
            ? 'bg-green-50 border-green-400'
            : 'bg-white border-blue-200'
        }`}>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className={`text-2xl sm:text-3xl font-bold ${
                isMyShift ? 'text-green-900' : 'text-blue-900'
              }`}>
                Dienst Details
              </h1>
              {isMyShift && (
                <span className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-lg">
                  Jouw dienst
                </span>
              )}
            </div>
            <p className={`text-sm ${
              isMyShift ? 'text-green-700' : 'text-blue-900'
            }`}>
              {formatDate(shift.date)}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Medewerker */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${
                isMyShift ? 'text-green-700' : 'text-blue-700'
              }`}>
                Medewerker
              </label>
              <p className={`text-base sm:text-lg font-semibold ${
                isMyShift ? 'text-green-900' : 'text-blue-900'
              }`}>
                {shift.username}
              </p>
            </div>

            {/* Tijden */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${
                isMyShift ? 'text-green-700' : 'text-blue-700'
              }`}>
                Tijden
              </label>
              <div className="flex items-center gap-3">
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
            </div>

            {/* Rol */}
            {shift.role && (
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${
                  isMyShift ? 'text-green-700' : 'text-blue-700'
                }`}>
                  Rol
                </label>
                <p className={`text-base font-medium ${
                  isMyShift ? 'text-green-900' : 'text-blue-900'
                }`}>
                  {shift.role}
                </p>
              </div>
            )}

            {/* Beschrijving */}
            {shift.description && (
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${
                  isMyShift ? 'text-green-700' : 'text-blue-700'
                }`}>
                  Beschrijving
                </label>
                <p className={`text-sm ${
                  isMyShift ? 'text-green-800' : 'text-blue-800'
                }`}>
                  {shift.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShiftDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-blue-50 flex items-center justify-center pb-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-700">Bezig met laden...</p>
        </div>
      </div>
    }>
      <ShiftDetailContent />
    </Suspense>
  );
}

