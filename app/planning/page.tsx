/**
 * Planning / Rooster pagina
 * 
 * Deze pagina wordt later gebruikt voor:
 * - Kalenderweergave van rooster
 * - Maand/week/dag weergave opties
 * - Ingeplande shifts per medewerker
 * - Filter opties (eigen rooster, alle medewerkers voor admins)
 * - Shift details (tijden, locatie, functie)
 */
export default function PlanningPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Planning
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
          Bekijk hier je rooster en ingeplande shifts.
        </p>
        
        {/* Placeholder voor kalender/rooster weergave */}
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <div className="text-center py-8 sm:py-12">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Rooster weergave
            </h2>
            <p className="text-sm sm:text-base text-gray-500 px-4">
              Hier komt een kalenderweergave met alle ingeplande shifts
            </p>
            <p className="text-xs sm:text-sm text-gray-400 mt-4">
              Functionaliteit wordt geïmplementeerd met data uit Supabase
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

