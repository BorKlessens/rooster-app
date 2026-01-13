'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { hashPassword } from '@/lib/passwordUtils';
import { testSupabaseConnection } from '@/lib/testSupabaseConnection';

/**
 * Sign Up pagina
 * 
 * Registratie pagina voor nieuwe gebruikers
 */
export default function SignUpPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Voorkom scrollen en verwijder witte achtergrond op deze pagina
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
    document.body.style.paddingTop = '0';
    document.documentElement.style.paddingTop = '0';
    document.body.style.marginTop = '0';
    document.documentElement.style.marginTop = '0';
    
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
      document.body.style.background = '';
      document.documentElement.style.background = '';
      document.body.style.paddingTop = '';
      document.documentElement.style.paddingTop = '';
      document.body.style.marginTop = '';
      document.documentElement.style.marginTop = '';
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validatie
    if (!username.trim()) {
      setError('Gebruikersnaam is verplicht.');
      setIsLoading(false);
      return;
    }

    if (username.length < 3) {
      setError('Gebruikersnaam moet minimaal 3 tekens lang zijn.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens lang zijn.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const trimmedUsername = username.trim().toLowerCase();
      
      // Test Supabase connectie eerst
      const connectionTest = await testSupabaseConnection();
      console.log('Supabase connection test:', connectionTest);
      
      if (!connectionTest.connected) {
        console.warn('⚠️ Supabase niet verbonden:', connectionTest.error);
        console.warn('Details:', connectionTest.details);
      }
      
      // Check of Supabase environment variables zijn ingesteld
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase environment variables niet ingesteld, gebruik alleen localStorage');
        // Fallback: sla alleen in localStorage op
        const storedUsers = localStorage.getItem('users');
        const users = storedUsers ? JSON.parse(storedUsers) : [];
        
        const usernameExists = users.some(
          (u: { username: string }) => u.username.toLowerCase() === trimmedUsername
        );
        
        if (usernameExists) {
          setError('Deze gebruikersnaam is al in gebruik.');
          setIsLoading(false);
          return;
        }
        
        const newUser = {
          id: `user_${Date.now()}`,
          username: trimmedUsername,
          fullName: fullName.trim() || username.trim(),
          password: password, // Plain text in localStorage (niet ideaal maar werkt)
          role: 'user',
          createdAt: new Date().toISOString(),
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', newUser.username);
        localStorage.setItem('userId', newUser.id);
        
        setError('⚠️ Account aangemaakt in localStorage. Supabase is niet geconfigureerd. Configureer NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY voor database opslag.');
        setTimeout(() => {
          router.push('/home');
        }, 2000);
        return;
      }
      
      // Check of gebruikersnaam al bestaat in Supabase
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', trimmedUsername)
        .limit(1);

      if (checkError) {
        console.error('Error checking username:', checkError);
        console.error('Supabase URL:', supabaseUrl);
        console.error('Error details:', JSON.stringify(checkError, null, 2));
        setError(`Er is iets misgegaan bij het controleren van de gebruikersnaam: ${checkError.message}`);
        setIsLoading(false);
        return;
      }

      if (existingUsers && existingUsers.length > 0) {
        setError('Deze gebruikersnaam is al in gebruik.');
        setIsLoading(false);
        return;
      }

      // Hash het wachtwoord
      const passwordHash = await hashPassword(password);

      // Maak nieuwe gebruiker in Supabase
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          username: trimmedUsername,
          full_name: fullName.trim() || username.trim(),
          password_hash: passwordHash,
          role: 'user',
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating user in Supabase:', insertError);
        console.error('Error code:', insertError.code);
        console.error('Error message:', insertError.message);
        console.error('Error details:', JSON.stringify(insertError, null, 2));
        console.error('Supabase URL:', supabaseUrl);
        
        // Toon meer specifieke error message
        if (insertError.code === '23505') {
          setError('Deze gebruikersnaam is al in gebruik.');
        } else if (insertError.code === 'PGRST116') {
          setError('De users tabel bestaat niet. Neem contact op met de beheerder.');
        } else if (insertError.message?.includes('JWT')) {
          setError('Supabase authenticatie fout. Check je NEXT_PUBLIC_SUPABASE_ANON_KEY.');
        } else if (insertError.message?.includes('relation') || insertError.message?.includes('does not exist')) {
          setError('De users tabel bestaat niet in Supabase. Maak de tabel eerst aan.');
        } else {
          setError(`Er is iets misgegaan bij het aanmaken van je account: ${insertError.message || 'Onbekende fout'}`);
        }
        setIsLoading(false);
        return;
      }

      if (!newUser) {
        console.error('❌ User created but no data returned');
        setError('Account aangemaakt maar geen data ontvangen. Check de database.');
        setIsLoading(false);
        return;
      }

      console.log('✅ User successfully created in Supabase:', newUser);
      console.log('User ID:', newUser.id);
      console.log('Username:', newUser.username);

      // Sla ook lokaal op voor backward compatibility (optioneel)
      const storedUsers = localStorage.getItem('users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      const userExists = users.find((u: { id: string }) => u.id === newUser.id);
      if (!userExists) {
        users.push({
          id: newUser.id,
          username: newUser.username,
          fullName: newUser.full_name,
          role: newUser.role,
        });
        localStorage.setItem('users', JSON.stringify(users));
      }

      // Sla login state op
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', newUser.username);
      localStorage.setItem('userId', newUser.id);

      // Redirect naar home
      router.push('/home');
    } catch (err) {
      console.error('Signup error:', err);
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
          alt="Signup achtergrond"
          fill
          className="object-cover object-center"
          priority
          quality={100}
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
      </div>

      {/* Content - geplaatst op het witte gedeelte van de achtergrond */}
      <div className="relative z-10 h-full w-full flex flex-col items-center mt-60 px-4 sm:px-6 pb-6 sm:pb-8" style={{ paddingTop: 'clamp(20%, 25%, 35%)' }}>
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
                  minLength={3}
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
                  Gebruikersnaam *
                </label>
              </div>
            </div>

            <div className="animate-slide-in-left relative" style={{ animationDelay: '0.15s' }}>
              <div className="relative">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onFocus={() => setFocusedField('fullName')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-3 sm:px-4 pt-6 sm:pt-7 pb-2.5 sm:pb-3.5 text-sm sm:text-base bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-400 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                />
                <label 
                  htmlFor="fullName" 
                  className={`absolute left-3 sm:left-4 pointer-events-none transition-all duration-300 ${
                    fullName || focusedField === 'fullName' 
                      ? 'top-1.5 sm:top-2 text-xs sm:text-xs font-medium text-gray-700' 
                      : 'top-2.5 sm:top-3.5 text-sm sm:text-base text-gray-500'
                  }`}
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Volledige naam (optioneel)
                </label>
              </div>
            </div>
            
            <div className="animate-slide-in-left relative" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  minLength={6}
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

            <div className="animate-slide-in-left relative" style={{ animationDelay: '0.25s' }}>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  required
                  minLength={6}
                  className="w-full px-3 sm:px-4 pt-6 sm:pt-7 pb-2.5 sm:pb-3.5 text-sm sm:text-base bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-400 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                />
                <label 
                  htmlFor="confirmPassword" 
                  className={`absolute left-3 sm:left-4 pointer-events-none transition-all duration-300 ${
                    confirmPassword || focusedField === 'confirmPassword' 
                      ? 'top-1.5 sm:top-2 text-xs sm:text-xs font-medium text-gray-700' 
                      : 'top-2.5 sm:top-3.5 text-sm sm:text-base text-gray-500'
                  }`}
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Bevestig wachtwoord
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
                    Account aanmaken...
                  </span>
                ) : (
                  'Account aanmaken'
                )}
              </span>
            </button>
          </form>

          <div className="mt-4 sm:mt-6 text-center animate-slide-in-left" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={() => router.push('/login')}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Al een account? Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

