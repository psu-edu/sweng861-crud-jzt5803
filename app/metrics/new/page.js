import MetricForm from '@/app/components/MetricForm';

export default function NewMetricPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Create New Metric
      </h1>
      <MetricForm mode="create" />
    </div>
  );
}
