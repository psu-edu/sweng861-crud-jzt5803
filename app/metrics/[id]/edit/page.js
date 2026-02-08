'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { apiGet, ForbiddenError } from '@/lib/apiClient';
import MetricForm from '@/app/components/MetricForm';
import Spinner from '@/app/components/Spinner';

export default function EditMetricPage({ params }) {
  const { id } = use(params);
  const [metric, setMetric] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetric = async () => {
      try {
        const res = await apiGet(`/api/metrics/${id}`);
        if (!res) return;

        if (!res.ok) throw new Error('Failed to fetch metric');

        const data = await res.json();
        setMetric(data.data);
      } catch (err) {
        if (err instanceof ForbiddenError) {
          setError('You are not authorized to edit this metric.');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMetric();
  }, [id]);

  if (loading) return <Spinner label="Loading metric..." />;
  if (error)
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/metrics" className="text-blue-600 hover:text-blue-800">
          Back to Metrics
        </Link>
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Metric</h1>
      <MetricForm mode="edit" metric={metric} />
    </div>
  );
}
