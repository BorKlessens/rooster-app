'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isAdmin } from '@/lib/supabaseClient'
import AdminNav from '@/app/components/AdminNav'

/**
 * Admin Ledenlijst pagina
 * 
 * Deze pagina toont alle medewerkers met hun contactgegevens.
 * Alleen toegankelijk voor admins.
 */

interface Member {
  id: string
  username: string
  full_name: string | null
  email: string | null
  phone: string | null
  birthday: string | null
  role: string
  created_at: string
}

export default function AdminLedenPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [filterName, setFilterName] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'created'>('name')
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
    setIsLoggedIn(loggedIn)
    
    if (!loggedIn) {
      router.push('/login')
      return
    }

    checkAdmin()
  }, [router])

  useEffect(() => {
    if (isAdminUser) {
      loadMembers()
    }
  }, [filterName, sortBy, isAdminUser])

  const checkAdmin = async () => {
    const admin = await isAdmin()
    setIsAdminUser(admin)
    
    if (!admin) {
      router.push('/home')
    } else {
      setIsLoading(false)
    }
  }

  const loadMembers = async () => {
    setIsLoading(true)
    
    try {
      // Probeer eerst met alle kolommen (inclusief email, phone, birthday)
      let query = supabase
        .from('users')
        .select('id, username, full_name, email, phone, birthday, role, created_at')
        .neq('role', 'admin')

      // Filter op naam als ingevuld
      if (filterName.trim()) {
        const filterValue = `%${filterName.trim()}%`
        query = query.or(`username.ilike.${filterValue},full_name.ilike.${filterValue}`)
      }

      // Sorteer op naam of aanmaakdatum
      if (sortBy === 'created') {
        query = query.order('created_at', { ascending: false })
      } else {
        query = query.order('username', { ascending: true })
      }

      let { data, error } = await query

      // Als error door ontbrekende kolommen (email, phone, birthday), probeer zonder die kolommen
      if (error && (error.code === '42703' || error.code === 'PGRST116' || error.message?.includes('column') || error.message?.includes('does not exist'))) {
        console.log('Extra kolommen (email/phone/birthday) bestaan nog niet, gebruik alleen basisvelden...')
        
        let fallbackQuery = supabase
          .from('users')
          .select('id, username, full_name, role, created_at')
          .neq('role', 'admin')

        if (filterName.trim()) {
          const filterValue = `%${filterName.trim()}%`
          fallbackQuery = fallbackQuery.or(`username.ilike.${filterValue},full_name.ilike.${filterValue}`)
        }

        if (sortBy === 'created') {
          fallbackQuery = fallbackQuery.order('created_at', { ascending: false })
        } else {
          fallbackQuery = fallbackQuery.order('username', { ascending: true })
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery
        if (fallbackError) {
          console.error('Error loading members (fallback):', fallbackError)
          setMembers([])
        } else {
          console.log('✅ Members loaded (without email/phone/birthday):', fallbackData?.length || 0)
          // Voeg null waarden toe voor ontbrekende kolommen
          const membersWithNulls = (fallbackData || []).map((user: any) => ({
            ...user,
            email: null,
            phone: null,
            birthday: null
          }))
          setMembers(membersWithNulls)
        }
      } else if (error) {
        console.error('Error loading members:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        setMembers([])
      } else {
        console.log('✅ Members loaded (with all fields):', data?.length || 0)
        setMembers(data || [])
      }
    } catch (error: any) {
      console.error('Unexpected error:', error)
      setMembers([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Niet opgegeven'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return 'Ongeldige datum'
    }
  }

  const formatBirthday = (birthday: string | null): string => {
    if (!birthday) return 'Niet opgegeven'
    try {
      // Verjaardag wordt opgeslagen als datum (zonder jaar of met jaar)
      const date = new Date(birthday)
      // Als er alleen dag/maand is, gebruik alleen die
      return date.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long'
      })
    } catch {
      return 'Niet opgegeven'
    }
  }

  const calculateAge = (birthday: string | null): string => {
    if (!birthday) return ''
    try {
      const birthDate = new Date(birthday)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age > 0 ? `${age} jaar` : ''
    } catch {
      return ''
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
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 pt-20 sm:pt-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Ledenlijst
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Overzicht van alle medewerkers met contactgegevens
          </p>
        </div>

        {/* Filters en sorteer opties */}
        <div className="mb-4 sm:mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 space-y-3 sm:space-y-4 hover:shadow-md transition-shadow">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Zoek op naam
              </label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Zoek op naam of gebruikersnaam..."
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Sorteer op
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'created')}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
              >
                <option value="name">Naam (A-Z)</option>
                <option value="created">Nieuwste eerst</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ledenlijst - Compact met uitklap functie */}
        {members.length > 0 ? (
          <div className="space-y-2">
            {members.map((member) => {
              const isExpanded = expandedMembers.has(member.id)
              
              return (
                <div
                  key={member.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md"
                >
                  {/* Compacte header - altijd zichtbaar */}
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedMembers)
                      if (isExpanded) {
                        newExpanded.delete(member.id)
                      } else {
                        newExpanded.add(member.id)
                      }
                      setExpandedMembers(newExpanded)
                    }}
                    className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 text-left"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-700 font-semibold text-sm">
                            {(member.full_name || member.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                          {member.full_name || member.username}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          @{member.username}
                        </p>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
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

                  {/* Uitklapbare details */}
                  {isExpanded && (
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-gray-100 pt-3 sm:pt-4">
                      <div className="space-y-3 text-sm">
                        {/* Email */}
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-500 block mb-0.5">Email</span>
                            <a
                              href={member.email ? `mailto:${member.email}` : undefined}
                              className={`block truncate ${member.email ? 'text-blue-600 hover:text-blue-800 hover:underline' : 'text-gray-400'}`}
                            >
                              {member.email || 'Niet opgegeven'}
                            </a>
                          </div>
                        </div>

                        {/* Telefoonnummer */}
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-500 block mb-0.5">Telefoonnummer</span>
                            <a
                              href={member.phone ? `tel:${member.phone}` : undefined}
                              className={`block truncate ${member.phone ? 'text-blue-600 hover:text-blue-800 hover:underline' : 'text-gray-400'}`}
                            >
                              {member.phone || 'Niet opgegeven'}
                            </a>
                          </div>
                        </div>

                        {/* Verjaardag */}
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v.25m0 0v.25m0-.25h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM3.75 19.5v-.75a3 3 0 0 1 3-3h3m3 0h3a3 3 0 0 1 3 3v.75M6 18.75h12" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-500 block mb-0.5">Verjaardag</span>
                            <span className="block text-gray-900">
                              {formatBirthday(member.birthday)}
                              {member.birthday && calculateAge(member.birthday) && (
                                <span className="text-gray-500 ml-2">({calculateAge(member.birthday)})</span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Aangemaakt */}
                        <div className="pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-400">
                            Lid sinds {formatDate(member.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
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
                d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
              />
            </svg>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Geen leden gevonden
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              {filterName ? 'Geen leden gevonden met deze zoekterm.' : 'Er zijn nog geen medewerkers geregistreerd.'}
            </p>
          </div>
        )}

        {/* Statistieken */}
        {members.length > 0 && (
          <div className="mt-4 sm:mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Samenvatting</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{members.length}</div>
                <div className="text-gray-600 text-xs sm:text-sm">Totaal leden</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {members.filter(m => m.email).length}
                </div>
                <div className="text-gray-600 text-xs sm:text-sm">Met email</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {members.filter(m => m.phone).length}
                </div>
                <div className="text-gray-600 text-xs sm:text-sm">Met telefoon</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-purple-600">
                  {members.filter(m => m.birthday).length}
                </div>
                <div className="text-gray-600 text-xs sm:text-sm">Met verjaardag</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

