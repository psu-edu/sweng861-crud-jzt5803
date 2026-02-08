'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet, apiDelete, ForbiddenError } from '@/lib/apiClient';
import Spinner from '@/app/components/Spinner';

export default function MetricDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [metric, setMetric] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetric = async () => {
      try {
        const res = await apiGet(`/api/metrics/${id}`);
        if (!res) return;

        if (res.status === 404) {
          setError('This metric does not exist or has been deleted.');
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch metric');

        const data = await res.json();
        setMetric(data.data);
      } catch (err) {
        if (err instanceof ForbiddenError) {
          setError('You are not authorized to view this metric.');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMetric();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this metric?')) return;
    try {
      const res = await apiDelete(`/api/metrics/${id}`);
      if (res?.ok) {
        router.push('/metrics?saved=true');
      }
    } catch {
      setError('Failed to delete metric');
    }
  };

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
  if (!metric) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/metrics"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          &larr; Back to Metrics
        </Link>
        <div className="flex space-x-2">
          <Link
            href={`/metrics/${id}/edit`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">{metric.name}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Category</p>
            <p className="text-gray-900 capitalize">{metric.category}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Value</p>
            <p className="text-gray-900">
              {metric.value} {metric.unit}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Recorded At</p>
            <p className="text-gray-900">
              {new Date(metric.recordedAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="text-gray-900">
              {new Date(metric.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {metric.description && (
          <div>
            <p className="text-sm text-gray-500">Description</p>
            <p className="text-gray-900">{metric.description}</p>
          </div>
        )}

        {metric.metadata && Object.keys(metric.metadata).length > 0 && (
          <div>
            <p className="text-sm text-gray-500">Metadata</p>
            <pre className="bg-gray-50 p-3 rounded text-sm text-gray-800 overflow-x-auto">
              {JSON.stringify(metric.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
