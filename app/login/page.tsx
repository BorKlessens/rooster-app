/**
 * Login pagina
 * 
 * Deze pagina wordt later gebruikt voor:
 * - Inloggen van medewerkers en admins
 * - Authenticatie via Supabase Auth
 * - Rol-detectie (medewerker vs admin/planner)
 * - Redirect naar juiste dashboard na login
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Inloggen
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6">
          Log in om toegang te krijgen tot je rooster en beschikbaarheid.
        </p>
        
        {/* Placeholder voor login formulier */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="jouw@email.nl"
              disabled
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Wachtwoord
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="••••••••"
              disabled
            />
          </div>
          
          <button
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            disabled
          >
            Inloggen (binnenkort beschikbaar)
          </button>
        </div>
        
        <p className="mt-6 text-xs sm:text-sm text-gray-500 text-center">
          Login functionaliteit wordt geïmplementeerd met Supabase Auth
        </p>
      </div>
    </div>
  );
}

