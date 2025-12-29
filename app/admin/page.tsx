/**
 * Admin pagina
 * 
 * Deze pagina wordt later gebruikt voor:
 * - Overzicht van alle medewerkers
 * - Shifts aanmaken en beheren
 * - Beschikbaarheid van medewerkers bekijken
 * - Medewerkers inplannen op shifts
 * - Rooster wijzigingen doorvoeren
 * - Alleen toegankelijk voor gebruikers met admin rol
 */
export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mb-8">
          Beheer hier shifts, medewerkers en planningen.
        </p>
        
        {/* Placeholder content voor admin functionaliteit */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Shifts beheren card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Shifts beheren
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              Maak nieuwe shifts aan en wijzig bestaande shifts
            </p>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              disabled
            >
              Nieuwe shift (binnenkort)
            </button>
          </div>
          
          {/* Medewerkers overzicht card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Medewerkers
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              Bekijk beschikbaarheid en plan medewerkers in
            </p>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              disabled
            >
              Bekijk medewerkers (binnenkort)
            </button>
          </div>
          
          {/* Beschikbaarheid overzicht card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Beschikbaarheid
            </h2>
            <p className="text-gray-500 text-sm">
              Overzicht van beschikbaarheid van alle medewerkers
            </p>
          </div>
          
          {/* Rooster beheer card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Rooster beheer
            </h2>
            <p className="text-gray-500 text-sm">
              Bekijk en beheer het volledige rooster
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


