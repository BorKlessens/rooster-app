'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isAdmin, getCurrentUserId } from '@/lib/supabaseClient'
import AdminNav from '@/app/components/AdminNav'

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

export default function AdminInplannenPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Form state
  const [selectedUserId, setSelectedUserId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [role, setRole] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
      setIsLoggedIn(loggedIn)
      
      if (!loggedIn) {
        router.push('/login')
        return
      }
      
      // Check admin status
      const admin = await isAdmin()
      setIsAdminUser(admin)
      
      if (!admin) {
        router.push('/home')
        return
      }
      
      // Laad gebruikers
      loadUsers()
      setIsLoading(false)
    }
    
    checkAuth()
  }, [router])

  const loadUsers = () => {
    try {
      const storedUsers = localStorage.getItem('users')
      if (storedUsers) {
        const usersData = JSON.parse(storedUsers)
        // Filter admin accounts eruit
        const regularUsers = usersData.filter((u: { role?: string }) => u.role !== 'admin')
        setUsers(regularUsers)
      }
    } catch (error) {
      console.error('Error loading users:', error)
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
      <AdminNav />
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 pt-20 sm:pt-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Medewerker Inplannen
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Plan een medewerker in voor een dienst
          </p>
        </div>

        {/* Success/Error messages */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Medewerker selectie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medewerker <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {/* Submit button */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isSubmitting ? 'Bezig met opslaan...' : 'Dienst Inplannen'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
            >
              Annuleren
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

