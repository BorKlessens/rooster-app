'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registered successfully:', reg.scope);
          setRegistration(reg);

          // Check for updates immediately
          reg.update();

          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker is installed, but old one is still active
                  setUpdateAvailable(true);
                }
              });
            }
          });

          // Check for updates every 5 minutes
          setInterval(() => {
            reg.update();
          }, 5 * 60 * 1000);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Listen for controller change (when new SW takes over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('New service worker activated');
        // Reload page to get new version
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = async () => {
    if (!registration || !registration.waiting) return;

    setIsUpdating(true);
    
    // Tell service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Wait a bit for the new service worker to activate
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50">
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 border border-blue-700">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Nieuwe versie beschikbaar</h3>
            <p className="text-xs text-blue-100 mb-3">
              Er is een nieuwe versie van de app beschikbaar. Update om de nieuwste functies te krijgen.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Bijwerken...' : 'Nu bijwerken'}
              </button>
              <button
                onClick={() => setUpdateAvailable(false)}
                className="px-4 py-2 bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 active:bg-blue-900 transition-all duration-200 text-sm"
              >
                Later
              </button>
            </div>
          </div>
          <button
            onClick={() => setUpdateAvailable(false)}
            className="text-blue-200 hover:text-white transition-colors"
            aria-label="Sluiten"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
