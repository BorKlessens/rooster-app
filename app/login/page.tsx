'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect } from 'react';
import { createAdminAccountIfNeeded } from '@/lib/createAdminAccount';
import { isAdmin, supabase } from '@/lib/supabaseClient';
import { verifyPassword } from '@/lib/passwordUtils';

/**
 * Login pagina
 * 
 * Inloggen van medewerkers en admins
 * Ondersteunt automatisch invullen via password managers (Google Wachtwoorden, etc.)
 */
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Voorkom scrollen en verwijder witte achtergrond op deze pagina
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
    document.body.style.setProperty('padding-top', '0', 'important');
    document.documentElement.style.paddingTop = '0';
    document.body.style.marginTop = '0';
    document.documentElement.style.marginTop = '0';
    document.body.setAttribute('data-fullscreen-page', 'true');
    document.documentElement.setAttribute('data-fullscreen-page', 'true');
    
    // Zorg ervoor dat admin account bestaat (direct bij mount)
    createAdminAccountIfNeeded().catch(console.error);
    
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
      document.body.style.background = '';
      document.documentElement.style.background = '';
      document.body.style.paddingTop = '';
      document.documentElement.style.paddingTop = '';
      document.body.style.marginTop = '';
      document.documentElement.style.marginTop = '';
      document.body.removeAttribute('data-fullscreen-page');
      document.documentElement.removeAttribute('data-fullscreen-page');
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Zorg ervoor dat admin account bestaat voordat we proberen in te loggen
      await createAdminAccountIfNeeded();
      
      const trimmedUsername = username.trim().toLowerCase();

      // Probeer eerst in te loggen via Supabase
      const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('username', trimmedUsername)
        .limit(1);

      if (fetchError) {
        console.error('Error fetching user:', fetchError);
        // Fallback naar localStorage voor backward compatibility
        const storedUsers = localStorage.getItem('users');
        const localUsers = storedUsers ? JSON.parse(storedUsers) : [];
        
        const user = localUsers.find(
          (u: { username: string; password: string }) => 
            u.username.toLowerCase().trim() === trimmedUsername && u.password === password
        );
        
        if (!user) {
          setError('Gebruikersnaam of wachtwoord is onjuist.');
          setIsLoading(false);
          return;
        }
        
        // Login succesvol (localStorage fallback)
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', user.username);
        localStorage.setItem('userId', user.id || user.username);
        
        const admin = await isAdmin();
        if (admin) {
          router.push('/admin');
        } else {
          router.push('/home');
        }
        return;
      }

      if (!users || users.length === 0) {
        // Gebruiker niet gevonden in Supabase, probeer localStorage als fallback
        const storedUsers = localStorage.getItem('users');
        const localUsers = storedUsers ? JSON.parse(storedUsers) : [];
        
        const user = localUsers.find(
          (u: { username: string; password: string }) => 
            u.username.toLowerCase().trim() === trimmedUsername && u.password === password
        );
        
        if (!user) {
          setError('Gebruikersnaam of wachtwoord is onjuist.');
          setIsLoading(false);
          return;
        }
        
        // Login succesvol (localStorage fallback)
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', user.username);
        localStorage.setItem('userId', user.id || user.username);
        
        const admin = await isAdmin();
        if (admin) {
          router.push('/admin');
        } else {
          router.push('/home');
        }
        return;
      }

      const user = users[0];

      // Verifieer wachtwoord
      if (!user.password_hash) {
        setError('Account configuratie fout. Neem contact op met de beheerder.');
        setIsLoading(false);
        return;
      }

      const isValidPassword = await verifyPassword(password, user.password_hash);
      
      if (!isValidPassword) {
        setError('Wachtwoord is onjuist.');
        setIsLoading(false);
        return;
      }

      // Login succesvol
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', user.username);
      localStorage.setItem('userId', user.id);

      // Sla ook lokaal op voor backward compatibility
      const storedUsers = localStorage.getItem('users');
      const usersArray = storedUsers ? JSON.parse(storedUsers) : [];
      const existingUserIndex = usersArray.findIndex((u: { id: string }) => u.id === user.id);
      if (existingUserIndex === -1) {
        usersArray.push({
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          role: user.role,
        });
        localStorage.setItem('users', JSON.stringify(usersArray));
      } else {
        // Update bestaande gebruiker
        usersArray[existingUserIndex] = {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          role: user.role,
        };
        localStorage.setItem('users', JSON.stringify(usersArray));
      }

      // Check of gebruiker admin is
      const admin = await isAdmin();
      if (admin) {
        router.push('/admin');
      } else {
        router.push('/home');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Er is iets misgegaan. Probeer het opnieuw.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full overflow-hidden m-0 p-0" style={{ 
      height: '100dvh', 
      width: '100vw',
      marginTop: 0,
      paddingTop: 0,
      top: 0
    }}>
      {/* Achtergrond afbeelding */}
      <div className="absolute inset-0 h-full w-full m-0 p-0">
        <Image
          src="/background-login (1).png"
          alt="Login achtergrond"
          fill
          className="object-cover object-center"
          priority
          quality={100}
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
      </div>

      {/* Content - geplaatst op het witte gedeelte van de achtergrond */}
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center px-4 sm:px-6 pb-6 sm:pb-8" style={{ paddingTop: 'clamp(25%, 30%, 40%)' }}>
        {/* Formulier op witte gedeelte */}
        <div className="w-full max-w-md animate-fade-in-up">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="animate-slide-in-left relative" style={{ animationDelay: '0.1s' }}>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="w-full px-3 sm:px-4 pt-6 sm:pt-7 pb-2.5 sm:pb-3.5 text-sm sm:text-base bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-400 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                />
                <label 
                  htmlFor="username" 
                  className={`absolute left-3 sm:left-4 pointer-events-none transition-all duration-300 ${
                    username || focusedField === 'username' 
                      ? 'top-1.5 sm:top-2 text-xs sm:text-xs font-medium text-gray-700' 
                      : 'top-2.5 sm:top-3.5 text-sm sm:text-base text-gray-500'
                  }`}
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Gebruikersnaam
                </label>
              </div>
            </div>
            
            <div className="animate-slide-in-left relative" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="w-full px-3 sm:px-4 pt-6 sm:pt-7 pb-2.5 sm:pb-3.5 text-sm sm:text-base bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-400 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                />
                <label 
                  htmlFor="password" 
                  className={`absolute left-3 sm:left-4 pointer-events-none transition-all duration-300 ${
                    password || focusedField === 'password' 
                      ? 'top-1.5 sm:top-2 text-xs sm:text-xs font-medium text-gray-700' 
                      : 'top-2.5 sm:top-3.5 text-sm sm:text-base text-gray-500'
                  }`}
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Wachtwoord
                </label>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm animate-shake shadow-sm">
                {error}
              </div>
            )}

            {/* Test credentials voor docenten */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs sm:text-sm shadow-sm">
              <div className="font-semibold text-blue-900 mb-2">Test accounts voor docenten:</div>
              <div className="space-y-1.5 text-blue-800">
                <div>
                  <span className="font-medium">Gebruikersaccount:</span> Jan Jansen / <span className="font-mono">Jan123</span>
                </div>
                <div>
                  <span className="font-medium">Admin account:</span> Admin / <span className="font-mono">admin</span>
                </div>
              </div>
            </div>
          
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md mt-2 animate-slide-in-left text-sm sm:text-base"
              style={{ fontFamily: 'var(--font-geist-sans)', animationDelay: '0.3s' }}
            >
              <span className="relative">
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-2">⏳</span>
                    Inloggen...
                  </span>
                ) : (
                  'Inloggen'
                )}
              </span>
          </button>
          </form>
        </div>
      </div>
    </div>
  );
}

