import Link from "next/link";

/**
 * Home pagina
 * 
 * Welkomstpagina voor de planning app.
 * Later uitbreiden met:
 * - Call-to-action voor login
 * - Korte uitleg over de app
 * - Feature highlights
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Welkom bij Rooster App
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Eenvoudige planning en rooster beheer voor horeca medewerkers en managers
          </p>
        </div>

        {/* Feature cards - mobile-first: 1 kolom op mobile */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              📅 Rooster bekijken
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Bekijk je ingeplande shifts overzichtelijk in een kalender
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              ✅ Beschikbaarheid doorgeven
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Geef eenvoudig je beschikbaarheid door aan planners
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-5 sm:p-6 sm:col-span-2 lg:col-span-1">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              👥 Planning beheren
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Voor admins: beheer shifts en plan medewerkers in
            </p>
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 sm:px-8 sm:py-3 rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-base sm:text-lg w-full sm:w-auto"
          >
            Inloggen
          </Link>
        </div>
      </div>
    </div>
  );
}
