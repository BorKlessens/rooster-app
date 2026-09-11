'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { usernameToAuthEmail, validateUsername } from '@/lib/auth';

/**
 * Login pagina
 *
 * Inloggen gebeurt met gebruikersnaam en wachtwoord via Supabase Auth. De
 * gebruikersnaam wordt omgezet naar het interne auth-adres; zie lib/auth.ts.
 * Ondersteunt automatisch invullen via password managers.
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
      if (validateUsername(username)) {
        setError('Gebruikersnaam of wachtwoord is onjuist.');
        setIsLoading(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: usernameToAuthEmail(username),
        password,
      });

      if (signInError) {
        // Bewust één algemene melding, zodat niet te achterhalen is welke
        // gebruikersnamen bestaan.
        setError('Gebruikersnaam of wachtwoord is onjuist.');
        setIsLoading(false);
        return;
      }

      // De middleware stuurt door naar /admin of /home op basis van de rol.
      router.replace('/');
      router.refresh();
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

            <p className="text-center text-xs text-gray-600">
              Wachtwoord vergeten of nog geen account? Neem contact op met je
              leidinggevende.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
