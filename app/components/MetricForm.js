'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost, apiPut } from '@/lib/apiClient';

const CATEGORIES = [
  'enrollment',
  'facilities',
  'academic',
  'financial',
  'other',
];

export default function MetricForm({ mode = 'create', metric = null }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: metric?.name || '',
    category: metric?.category || 'other',
    value: metric?.value ?? '',
    unit: metric?.unit || 'count',
    description: metric?.description || '',
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const validationErrors = [];

    if (!formData.name || formData.name.trim().length === 0) {
      validationErrors.push('Name is required.');
    } else if (formData.name.trim().length < 2) {
      validationErrors.push('Name must be at least 2 characters.');
    } else if (formData.name.trim().length > 255) {
      validationErrors.push('Name must be 255 characters or fewer.');
    }

    if (!CATEGORIES.includes(formData.category)) {
      validationErrors.push('Please select a valid category.');
    }

    if (
      formData.value === '' ||
      formData.value === null ||
      formData.value === undefined
    ) {
      validationErrors.push('Value is required.');
    } else if (isNaN(Number(formData.value))) {
      validationErrors.push('Value must be a valid number.');
    }

    return validationErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const body = {
        ...formData,
        value: Number(formData.value),
      };

      const res =
        mode === 'edit'
          ? await apiPut(`/api/metrics/${metric.id}`, body)
          : await apiPost('/api/metrics', body);

      if (!res) return;

      const data = await res.json();

      if (!res.ok) {
        setErrors(
          data.details?.map((d) => d.msg || d.message) || [
            data.error || 'An error occurred',
          ]
        );
        return;
      }

      router.push('/metrics?saved=true');
      router.refresh();
    } catch {
      setErrors(['An unexpected error occurred. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-md p-6 space-y-4"
    >
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          <ul className="list-disc list-inside">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          maxLength={255}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Value <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="value"
            value={formData.value}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            step="any"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit
          </label>
          <input
            type="text"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            maxLength={50}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          maxLength={1000}
        />
      </div>

      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800 text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? 'Saving...'
            : mode === 'edit'
              ? 'Update Metric'
              : 'Create Metric'}
        </button>
      </div>
    </form>
  );
}
