import Link from 'next/link';
import WeatherWidget from './components/WeatherWidget';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Campus Analytics Platform
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          A unified platform for university administrators and department heads
          to gain data-driven insights into campus-wide trends.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/metrics"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Metrics</h2>
          <p className="text-gray-600">
            View and manage campus analytics metrics across enrollment,
            facilities, academic, and financial categories.
          </p>
        </Link>

        <Link
          href="/metrics/new"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Add Metric
          </h2>
          <p className="text-gray-600">
            Create new campus analytics data points to track and monitor key
            performance indicators.
          </p>
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Weather</h2>
          <p className="text-gray-600 mb-4">
            Current weather conditions for campus locations.
          </p>
          <WeatherWidget />
        </div>
      </div>
    </div>
  );
}
