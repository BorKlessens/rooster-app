'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect } from 'react';

/**
 * Welkomstpagina
 * 
 * Eerste scherm waar gebruikers kunnen kiezen tussen Login en Sign Up
 */
export default function WelcomePage() {
  const router = useRouter();

  // Voorkom scrollen en verwijder witte achtergrond op deze pagina
  useEffect(() => {
    // Voorkom scrollen
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Verwijder witte achtergrond
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
    
    return () => {
      // Herstel bij verlaten van pagina
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
      document.body.style.background = '';
      document.documentElement.style.background = '';
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full overflow-hidden m-0 p-0" style={{ height: '100dvh', width: '100vw' }}>
      {/* Achtergrond afbeelding */}
      <div className="absolute inset-0 h-full w-full m-0 p-0">
        <Image
          src="/background-welcome (1).png"
          alt="Welkomst achtergrond"
          fill
          className="object-cover object-center"
          priority
          quality={100}
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
        {/* Overlay voor betere leesbaarheid indien nodig */}
        <div className="absolute inset-0 bg-black/5"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-end px-6 pb-8 pt-12">
        {/* Welkomst tekst */}
        <div className="w-full max-w-sm mb-6 text-left mb-12">
          <p className="text-white text-base sm:text-lg leading-relaxed" style={{ 
            fontFamily: 'var(--font-geist-sans)',
            fontWeight: 400,
            letterSpacing: '0.02em'
          }}>
            Welkom bij de rooster app. Bekijk je rooster, geef je beschikbaarheid door en blijf op de hoogte van je shifts.
          </p>
        </div>
        
        {/* Knoppen sectie */}
        <div className="w-full max-w-sm space-y-4 mb-12">
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:shadow-md hover:scale-[1.01] active:scale-[0.99]"
          >
            LOGIN
          </button>
          <button
            onClick={() => router.push('/signup')}
            className="w-full bg-blue-400/30 hover:bg-blue-400/40 active:bg-blue-400/50 border border-blue-300/50 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:shadow-md hover:scale-[1.01] active:scale-[0.99]"
          >
            SIGN UP
          </button>
        </div>
      </div>
    </div>
  );
}

