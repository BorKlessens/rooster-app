'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isAdmin } from '@/lib/supabaseClient'
import AdminNav from '@/app/components/AdminNav'

/**
 * Admin Beschikbaarheid Overzicht pagina
 * 
 * Deze pagina toont alle beschikbaarheid van medewerkers.
 * Alleen toegankelijk voor admins.
 */

interface AvailabilityRecord {
  id: string
  user_id: string
  username: string
  date: string
  status: string | null
  time_slots: string[]
  locked: boolean
  created_at: string
  updated_at: string
}

export default function AdminAvailabilityPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [availability, setAvailability] = useState<AvailabilityRecord[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [filterUsername, setFilterUsername] = useState('')

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
    setIsLoggedIn(loggedIn)
    
    if (!loggedIn) {
      router.push('/login')
      return
    }

    // Check admin status
    checkAdmin()
  }, [router])

  useEffect(() => {
    if (isAdminUser) {
      loadAvailability()
    }
  }, [selectedDate, filterUsername, isAdminUser])

  const checkAdmin = async () => {
    const admin = await isAdmin()
    setIsAdminUser(admin)
    
    if (!admin) {
      // Redirect naar home als geen admin
      router.push('/home')
    } else {
      setIsLoading(false)
    }
  }

  const loadAvailability = async () => {
    setIsLoading(true)
    
    try {
      let query = supabase
        .from('availability')
        .select('*')
        .eq('date', selectedDate)
        .order('username', { ascending: true })

      // Filter op gebruikersnaam als ingevuld
      if (filterUsername) {
        query = query.ilike('username', `%${filterUsername}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading availability:', error)
        setAvailability([])
      } else {
        setAvailability(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
      setAvailability([])
    } finally {
      setIsLoading(false)
    }
  }

  const getTimeSlotLabel = (slot: string): string => {
    const labels: { [key: string]: string } = {
      morning: 'Ochtend',
      afternoon: 'Middag',
      evening: 'Avond'
    }
    return labels[slot] || slot
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const handleQuickPlan = (userId: string, username: string) => {
    // Navigeer naar inplannen pagina met user_id en date als query parameters
    const params = new URLSearchParams({
      user_id: userId,
      date: selectedDate,
      username: username
    })
    router.push(`/admin/inplannen?${params.toString()}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Bezig met laden...</p>
        </div>
      </div>
    )
  }

  if (!isAdminUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AdminNav />
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 pt-20 sm:pt-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Beschikbaarheid Overzicht
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Bekijk alle beschikbaarheid van medewerkers
          </p>
        </div>

        {/* Filters */}
        <div className="mb-4 sm:mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 space-y-3 sm:space-y-4 hover:shadow-md transition-shadow">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Selecteer datum
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Filter op gebruikersnaam
              </label>
              <input
                type="text"
                value={filterUsername}
                onChange={(e) => setFilterUsername(e.target.value)}
                placeholder="Zoek op naam..."
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
              />
            </div>
          </div>
          
          {/* Datum info */}
          <div className="text-xs sm:text-sm text-gray-600">
            <strong>Geselecteerde datum:</strong> {formatDate(selectedDate)}
          </div>
        </div>

        {/* Overzicht */}
        {availability.length > 0 ? (
          <div className="space-y-3">
            {availability.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">
                        {item.username}
                      </h3>
                      <button
                        onClick={() => handleQuickPlan(item.user_id, item.username)}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        title="Snel inplannen"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span className="hidden sm:inline">Inplannen</span>
                        <span className="sm:hidden">Plan</span>
                      </button>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className={item.status === 'available' ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                          {item.status === 'available' ? 'Beschikbaar' : 'Niet ingesteld'}
                        </span>
                      </div>
                      {item.time_slots && item.time_slots.length > 0 && (
                        <div className="flex items-start sm:items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-700 flex-shrink-0">Tijdstippen:</span>
                          <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                            {item.time_slots.map((slot, index) => (
                              <span
                                key={index}
                                className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium"
                              >
                                {getTimeSlotLabel(slot)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-700">Vergrendeld:</span>
                        <span className={item.locked ? 'text-orange-600 font-semibold' : 'text-gray-500'}>
                          {item.locked ? 'Ja' : 'Nee'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 pt-1.5 sm:pt-2 border-t border-gray-100">
                        Laatst bijgewerkt: {new Date(item.updated_at).toLocaleString('nl-NL')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 md:p-12 text-center">
            <svg
              className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
              />
            </svg>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Geen beschikbaarheid gevonden
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Er is nog geen beschikbaarheid ingevuld voor {formatDate(selectedDate)}.
            </p>
          </div>
        )}

        {/* Statistieken */}
        {availability.length > 0 && (
          <div className="mt-4 sm:mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Samenvatting</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{availability.length}</div>
                <div className="text-gray-600 text-xs sm:text-sm">Totaal ingevuld</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {availability.filter(a => a.status === 'available').length}
                </div>
                <div className="text-gray-600 text-xs sm:text-sm">Beschikbaar</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-orange-600">
                  {availability.filter(a => a.locked).length}
                </div>
                <div className="text-gray-600 text-xs sm:text-sm">Vergrendeld</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {availability.filter(a => a.time_slots && a.time_slots.length > 0).length}
                </div>
                <div className="text-gray-600 text-xs sm:text-sm">Met tijdstippen</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

