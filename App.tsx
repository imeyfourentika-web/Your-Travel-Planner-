
import React, { useState, useCallback, useMemo } from 'react';
import InputGroup from './components/InputGroup';
import Button from './components/Button';
import Spinner from './components/Spinner';
import ItineraryCard from './components/ItineraryCard';
import { generateItinerary } from './services/geminiService';
import { DayItinerary, GenerateItineraryError, GroundingChunk, parseCostToNumber } from './types';

function App() {
  const [destination, setDestination] = useState<string>('');
  const [duration, setDuration] = useState<number | ''>(3);
  const [interests, setInterests] = useState<string>('');
  const [totalBudget, setTotalBudget] = useState<number | ''>(0); // Initialize with 0 for slider
  const [budgetInputCurrency, setBudgetInputCurrency] = useState<'Rp' | '$'>('Rp'); // New state for budget input currency
  const [itinerary, setItinerary] = useState<DayItinerary[]>([]);
  const [sourceUrls, setSourceUrls] = useState<GroundingChunk[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<GenerateItineraryError | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState<string>('Rp'); // Default to IDR

  // Handler for actual cost changes in ActivityItem
  const handleActualCostChange = useCallback((dayIdx: number, activityIdx: number, value: number | '') => {
    setItinerary(prevItinerary => {
      const newItinerary = [...prevItinerary];
      if (newItinerary[dayIdx] && newItinerary[dayIdx].activities[activityIdx]) {
        // Ensure that empty string resets to undefined
        newItinerary[dayIdx].activities[activityIdx].actualCost = value === '' ? undefined : value;
      }
      return newItinerary;
    });
  }, []);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!destination || duration === '' || !interests) {
      setError({ message: 'Harap isi semua kolom yang wajib (Tujuan Wisata, Durasi, Minat Khusus).' });
      return;
    }

    setLoading(true);
    setError(null);
    setItinerary([]);
    setSourceUrls([]);
    setCurrencySymbol('Rp'); // Reset currency symbol

    try {
      const response = await generateItinerary(destination, duration as number, interests);
      setItinerary(response.itinerary);
      setSourceUrls(response.sourceUrls);

      // Try to determine currency symbol from the first activity
      if (response.itinerary.length > 0 && response.itinerary[0].activities.length > 0) {
        const firstCost = response.itinerary[0].activities[0].estimatedCost;
        const { currency } = parseCostToNumber(firstCost);
        if (currency) {
          // A simple mapping for common currencies, can be expanded
          if (currency === 'IDR') setCurrencySymbol('Rp');
          else if (currency === 'USD') setCurrencySymbol('$');
          else if (currency === 'EUR') setCurrencySymbol('€');
          else if (currency === 'JPY') setCurrencySymbol('¥');
          else setCurrencySymbol(currency); // Use currency code if no specific symbol
        }
      }

    } catch (err: unknown) {
      console.error(err);
      setError({
        message: 'Gagal membuat itinerary.',
        details: (err instanceof Error) ? err.message : 'Terjadi kesalahan tidak dikenal.',
      });
    } finally {
      setLoading(false);
    }
  }, [destination, duration, interests]);

  // --- Budget Summary Calculations ---
  const totalEstimatedCostSubtotal = useMemo(() => {
    return itinerary.reduce((sum, day) => {
      return sum + day.activities.reduce((daySum, activity) => daySum + activity.estimatedCostValue, 0);
    }, 0);
  }, [itinerary]);

  const totalActualCostSubtotal = useMemo(() => {
    return itinerary.reduce((sum, day) => {
      return sum + day.activities.reduce((daySum, activity) => {
        // If actualCost is provided, use it, otherwise fall back to estimatedCostValue
        return daySum + (activity.actualCost !== undefined ? activity.actualCost : activity.estimatedCostValue);
      }, 0);
    }, itinerary); // Fix: The dependency array should be directly after the reduce callback
  }, [itinerary]);


  const dailyRecommendedRemainingBudget = useMemo(() => {
    if (totalBudget === '' || duration === 0 || duration === '') {
      return NaN; // Not a Number if budget or duration is not set/invalid
    }
    const remaining = (totalBudget as number) - totalActualCostSubtotal;
    return remaining / (duration as number);
  }, [totalBudget, duration, totalActualCostSubtotal]);

  // Format currency for both itinerary costs (with `currencySymbol`) and budget input (with `budgetInputCurrency`)
  const formatCurrency = useCallback((value: number, symbol?: string) => {
    const currentSymbol = symbol || currencySymbol; // Use provided symbol or itinerary default
    if (isNaN(value)) return 'N/A';
    return `${currentSymbol} ${new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)}`;
  }, [currencySymbol]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col items-center"> {/* bg-yellow-50 is now on body */}
      <header className="w-full max-w-3xl text-center mb-8">
        <h1 className="text-4xl font-extrabold text-blue-900 sm:text-5xl lg:text-6xl tracking-tight leading-tight mb-4">
          AI Travel Planner
        </h1>
        <p className="text-lg text-blue-500 sm:text-xl">
          Asisten pribadi Anda untuk membuat pengalaman perjalanan yang menakjubkan dengan insight real-time.
        </p>
      </header>

      <main className="w-full max-w-4xl bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-200">
        <form onSubmit={handleSubmit} className="mb-8">
          <InputGroup
            id="destination"
            label="Tujuan Wisata"
            type="text"
            placeholder="Contoh: Kyoto, Jepang"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
            aria-label="Tujuan Wisata"
          />
          <InputGroup
            id="duration"
            label="Durasi (Hari)"
            type="number"
            placeholder="Contoh: 5"
            min="1"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value, 10) || '')}
            required
            aria-label="Durasi"
          />
          <InputGroup
            id="interests"
            label="Minat Khusus"
            type="text"
            placeholder="Contoh: Kuliner dan Sejarah"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            required
            aria-label="Minat Khusus"
          />

          {/* Custom Range Slider for Total Budget */}
          <div className="mb-4 mt-4">
            <label htmlFor="totalBudgetSlider" className="block text-gray-700 text-sm font-bold mb-2">
              Total Budget Saya
            </label>
            <div className="flex items-center space-x-4">
              <input
                id="totalBudgetSlider"
                type="range"
                min="0"
                max="100000000" // Max 100 million
                step="100000" // Steps of 100,000
                value={totalBudget === '' ? 0 : totalBudget}
                onChange={(e) => setTotalBudget(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none"
                aria-label="Total Budget Slider"
              />
              <span className="text-gray-700 font-semibold text-lg flex-shrink-0 min-w-[150px] text-right">
                {formatCurrency(totalBudget as number, budgetInputCurrency)}
              </span>
              <div className="flex space-x-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setBudgetInputCurrency('Rp')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200
                              ${budgetInputCurrency === 'Rp' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  aria-pressed={budgetInputCurrency === 'Rp'}
                  aria-label="Select Rupiah currency"
                >
                  Rp
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetInputCurrency('$')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200
                              ${budgetInputCurrency === '$' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  aria-pressed={budgetInputCurrency === '$'}
                  aria-label="Select Dollar currency"
                >
                  $
                </button>
              </div>
            </div>
          </div>


          <Button type="submit" loading={loading} className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold">
            Generate Itinerary
          </Button>
        </form>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-8" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{error.message}</span>
            {error.details && <p className="text-sm mt-1">{error.details}</p>}
          </div>
        )}

        {loading && <Spinner />}

        {itinerary.length > 0 && (
          <section className="mt-8">
            <h2 className="text-3xl font-bold text-blue-900 mb-6 text-center">Your Itinerary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itinerary.map((dayPlan, index) => (
                <ItineraryCard
                  key={dayPlan.day}
                  dayItinerary={dayPlan}
                  dayIndex={index}
                  onActualCostChange={handleActualCostChange}
                  currencySymbol={currencySymbol}
                />
              ))}
            </div>

            {sourceUrls.length > 0 && (
              <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-md">
                <h3 className="font-bold mb-2">Sumber yang digunakan:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {sourceUrls.map((chunk, index) => chunk.web && (
                    <li key={index} className="text-sm">
                      <a
                        href={chunk.web.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                        title={chunk.web.title || chunk.web.uri}
                      >
                        {chunk.web.title || chunk.web.uri}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Budget Summary Section */}
            <div className="mt-8 p-6 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-blue-900 mb-4 pb-2 border-b-2 border-blue-300">
                Budget Summary
              </h3>
              <div className="space-y-2 text-lg">
                <p>
                  <span className="font-semibold">Total Estimasi Biaya Seluruh Perjalanan (Subtotal):</span>{' '}
                  <span className="font-bold">{formatCurrency(totalEstimatedCostSubtotal)}</span>
                </p>
                <p>
                  <span className="font-semibold">Total Biaya Aktual/Fallback (Subtotal):</span>{' '}
                  <span className="font-bold">{formatCurrency(totalActualCostSubtotal)}</span>
                </p>
                <p>
                  <span className="font-semibold">Total Budget Saya:</span>{' '}
                  <span className="font-bold">{totalBudget === '' ? 'Belum dimasukkan' : formatCurrency(totalBudget as number, budgetInputCurrency)}</span>
                </p>
                <p className="mt-4 pt-2 border-t border-blue-200">
                  <span className="font-semibold text-xl">Sisa Budget Harian Rata-rata yang Direkomendasikan:</span>{' '}
                  <span className={`font-bold text-xl ${dailyRecommendedRemainingBudget < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(dailyRecommendedRemainingBudget)} / hari
                  </span>
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;