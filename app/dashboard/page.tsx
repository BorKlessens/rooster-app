/**
 * Dashboard pagina
 * 
 * Deze pagina wordt later gebruikt voor:
 * - Overzicht van ingelogde gebruiker
 * - Aankomende shifts weergave
 * - Snelle acties (beschikbaarheid doorgeven, rooster bekijken)
 * - Notificaties over wijzigingen in rooster
 * - Verschillende weergave voor medewerker vs admin
 */
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
          Welkom terug! Hier zie je een overzicht van je rooster en beschikbaarheid.
        </p>
        
        {/* Placeholder content - mobile-first: 1 kolom op mobile */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Aankomende shifts card */}
          <div className="bg-white rounded-lg shadow-sm p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              Aankomende shifts
            </h2>
            <p className="text-sm sm:text-base text-gray-500">
              Hier worden je aankomende shifts getoond
            </p>
          </div>
          
          {/* Beschikbaarheid card */}
          <div className="bg-white rounded-lg shadow-sm p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              Beschikbaarheid
            </h2>
            <p className="text-sm sm:text-base text-gray-500">
              Hier kun je je beschikbaarheid doorgeven
            </p>
          </div>
          
          {/* Notificaties card */}
          <div className="bg-white rounded-lg shadow-sm p-5 sm:p-6 sm:col-span-2 lg:col-span-1">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              Notificaties
            </h2>
            <p className="text-sm sm:text-base text-gray-500">
              Wijzigingen in je rooster verschijnen hier
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

