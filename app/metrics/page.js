'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { apiGet, apiDelete, getToken } from '@/lib/apiClient';
import Spinner from '@/app/components/Spinner';

const CATEGORIES = [
  'all',
  'enrollment',
  'facilities',
  'academic',
  'financial',
  'other',
];

export default function MetricsPage() {
  return (
    <Suspense fallback={<Spinner label="Loading metrics..." />}>
      <MetricsContent />
    </Suspense>
  );
}

function MetricsContent() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [metrics, setMetrics] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
  });
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (searchParams.get('saved') === 'true') {
      setSuccessMsg('Metric saved successfully!');
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const fetchMetrics = useCallback(async () => {
    // Wait until session is resolved and a JWT is available
    if (status === 'loading') return;
    if (!getToken()) return;

    setLoading(true);
    setError(null);
    try {
      let url = `/api/metrics?limit=${pagination.limit}&offset=${pagination.offset}`;
      if (category !== 'all') url += `&category=${category}`;

      const res = await apiGet(url);
      if (!res) return;

      if (!res.ok) throw new Error('Failed to fetch metrics');

      const data = await res.json();
      setMetrics(data.data);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination.total,
        hasMore: data.pagination.hasMore,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, category, pagination.limit, pagination.offset]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this metric?')) return;
    try {
      const res = await apiDelete(`/api/metrics/${id}`);
      if (res?.ok) fetchMetrics();
    } catch {
      setError('Failed to delete metric');
    }
  };

  const categoryColors = {
    enrollment: 'bg-blue-100 text-blue-800',
    facilities: 'bg-green-100 text-green-800',
    academic: 'bg-purple-100 text-purple-800',
    financial: 'bg-yellow-100 text-yellow-800',
    other: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Metrics</h1>
        <Link
          href="/metrics/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Create Metric
        </Link>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
          {successMsg}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCategory(cat);
              setPagination((prev) => ({ ...prev, offset: 0 }));
            }}
            className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
              category === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner label="Loading metrics..." />
      ) : metrics.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No metrics found.</p>
          <Link
            href="/metrics/new"
            className="text-blue-600 hover:text-blue-800"
          >
            Create your first metric
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.map((metric) => (
                <tr key={metric.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/metrics/${metric.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {metric.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        categoryColors[metric.category] || categoryColors.other
                      }`}
                    >
                      {metric.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {metric.value} {metric.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm hidden sm:table-cell">
                    {new Date(metric.recordedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <Link
                      href={`/metrics/${metric.id}/edit`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(metric.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.total > pagination.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {pagination.offset + 1} to{' '}
            {Math.min(pagination.offset + pagination.limit, pagination.total)}{' '}
            of {pagination.total}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  offset: Math.max(0, prev.offset - prev.limit),
                }))
              }
              disabled={pagination.offset === 0}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  offset: prev.offset + prev.limit,
                }))
              }
              disabled={!pagination.hasMore}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
