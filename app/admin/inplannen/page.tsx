'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AdminHeader from '@/app/components/AdminHeader'
import { useCurrentUser } from '@/app/components/UserProvider'

/**
 * Admin Inplannen pagina
 * 
 * Hier kunnen admins medewerkers inplannen voor diensten
 */

interface User {
  id: string
  username: string
  fullName?: string
}

function AdminInplannenPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAdmin: isAdminUser } = useCurrentUser()
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Form state - haal query parameters op voor quick plan
  const [selectedUserId, setSelectedUserId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [role, setRole] = useState('')
  const [description, setDescription] = useState('')

  // De middleware laat alleen admins op deze route toe; dit is het vangnet.
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAdminUser) {
        router.replace('/home')
        return
      }

      await loadUsers()
      
      // Haal query parameters op voor quick plan vanuit beschikbaarheid
      const userIdParam = searchParams.get('user_id')
      const dateParam = searchParams.get('date')
      const usernameParam = searchParams.get('username')
      
      if (userIdParam && dateParam) {
        // Zet de formulier velden in met de query parameters
        setSelectedUserId(userIdParam)
        setDate(dateParam)
        
        // Toon success message
        if (usernameParam) {
          setSuccessMessage(`${usernameParam} is vooringevuld. Vul de rest van de gegevens in.`)
        }
      }
      
      setIsLoading(false)
    }
    
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminUser, searchParams])

  const loadUsers = async () => {
    try {
      const { data: supabaseUsers, error: supabaseError } = await supabase
        .from('users')
        .select('id, username, full_name')
        .neq('role', 'admin')
        .order('username', { ascending: true });

      if (supabaseError) {
        console.error('Error loading users:', supabaseError);
        setErrorMessage('De medewerkerslijst kon niet geladen worden.');
        setUsers([]);
        return;
      }

      setUsers(
        (supabaseUsers ?? []).map((user) => ({
          id: user.id,
          username: user.username,
          fullName: user.full_name || user.username,
        }))
      );
    } catch (error) {
      console.error('Error loading users:', error);
      setErrorMessage('De medewerkerslijst kon niet geladen worden.');
      setUsers([]);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    if (!selectedUserId || !date || !startTime || !endTime) {
      setErrorMessage('Vul alle verplichte velden in.')
      setIsSubmitting(false)
      return
    }

    try {
      // Haal gebruikersnaam op
      const selectedUser = users.find(u => u.id === selectedUserId)
      if (!selectedUser) {
        setErrorMessage('Gebruiker niet gevonden.')
        setIsSubmitting(false)
        return
      }

      // Sla dienst op in Supabase
      const { error } = await supabase
        .from('shifts')
        .insert({
          user_id: selectedUserId,
          username: selectedUser.username,
          date: date,
          start_time: startTime,
          end_time: endTime,
          role: role || null,
          description: description || null,
        })

      if (error) {
        console.error('Error saving shift:', error)
        setErrorMessage('Er is een fout opgetreden bij het opslaan van de dienst.')
      } else {
        setSuccessMessage(`Dienst succesvol ingepland voor ${selectedUser.username}!`)
        // Reset form
        setSelectedUserId('')
        setDate('')
        setStartTime('09:00')
        setEndTime('17:00')
        setRole('')
        setDescription('')
      }
    } catch (error) {
      console.error('Error:', error)
      setErrorMessage('Er is een onverwachte fout opgetreden.')
    } finally {
      setIsSubmitting(false)
    }
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
      <AdminHeader title="Inplannen" />
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 header-offset">
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm sm:text-base text-gray-600">
            Plan een medewerker in voor een dienst
          </p>
        </div>

        {/* Success/Error messages */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm shadow-sm">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm shadow-sm">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6 hover:shadow-md transition-shadow">
          {/* Medewerker selectie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medewerker <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
            >
              <option value="">Selecteer een medewerker</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName || user.username}
                </option>
              ))}
            </select>
          </div>

          {/* Datum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Datum <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
            />
          </div>

          {/* Tijden */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Starttijd <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eindtijd <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
              />
            </div>
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol (optioneel)
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
            >
              <option value="">Geen rol</option>
              <option value="Bediening">Bediening</option>
              <option value="Keuken">Keuken</option>
              <option value="Bar">Bar</option>
              <option value="Receptie">Receptie</option>
            </select>
          </div>

          {/* Beschrijving */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschrijving (optioneel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Bijv. Horeca dienst, Evenement, etc."
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all hover:border-gray-400"
            />
          </div>

          {/* Submit button */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-sm hover:shadow-md"
            >
              {isSubmitting ? 'Bezig met opslaan...' : 'Dienst Inplannen'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 font-medium text-sm sm:text-base"
            >
              Annuleren
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminInplannenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Bezig met laden...</p>
        </div>
      </div>
    }>
      <AdminInplannenPageContent />
    </Suspense>
  )
}


