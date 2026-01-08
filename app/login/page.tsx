'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect } from 'react';

/**
 * Login pagina
 * 
 * Inloggen van medewerkers en admins
 * Ondersteunt automatisch invullen via password managers (Google Wachtwoorden, etc.)
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Voorkom scrollen en verwijder witte achtergrond op deze pagina
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
    
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
      document.body.style.background = '';
      document.documentElement.style.background = '';
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simpele demo login (later vervangen door Supabase Auth)
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', email);
      router.push('/home');
    } catch (err) {
      setError('Er is iets misgegaan. Probeer het opnieuw.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full overflow-hidden m-0 p-0" style={{ height: '100dvh', width: '100vw' }}>
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
            <div className="animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
              <label 
                htmlFor="email" 
                className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 transition-colors duration-200"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 text-sm sm:text-base bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-400 hover:scale-[1.02] active:scale-[0.98]"
                placeholder="jouw@email.nl"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              />
            </div>
            
            <div className="animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
              <label 
                htmlFor="password" 
                className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 transition-colors duration-200"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Wachtwoord
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 text-sm sm:text-base bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-400 hover:scale-[1.02] active:scale-[0.98]"
                placeholder="••••••••"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm animate-shake">
                {error}
              </div>
            )}
          
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg mt-2 animate-slide-in-left text-sm sm:text-base"
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

