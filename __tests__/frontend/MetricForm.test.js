/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import MetricForm from '@/app/components/MetricForm';

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: mockBack,
  }),
}));

// Mock the API client
const mockApiPost = jest.fn();
const mockApiPut = jest.fn();
jest.mock('@/lib/apiClient', () => ({
  apiPost: (...args) => mockApiPost(...args),
  apiPut: (...args) => mockApiPut(...args),
}));

// Helper: query form inputs by name attribute
function getInput(name) {
  return document.querySelector(`[name="${name}"]`);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MetricForm component', () => {
  describe('rendering', () => {
    it('renders all form fields in create mode', () => {
      render(<MetricForm />);
      expect(getInput('name')).toBeInTheDocument();
      expect(getInput('category')).toBeInTheDocument();
      expect(getInput('value')).toBeInTheDocument();
      expect(getInput('unit')).toBeInTheDocument();
      expect(getInput('description')).toBeInTheDocument();
    });

    it('shows "Create Metric" button in create mode', () => {
      render(<MetricForm mode="create" />);
      expect(
        screen.getByRole('button', { name: /create metric/i })
      ).toBeInTheDocument();
    });

    it('shows "Update Metric" button in edit mode', () => {
      render(
        <MetricForm
          mode="edit"
          metric={{ id: '1', name: 'Test', category: 'other', value: 10 }}
        />
      );
      expect(
        screen.getByRole('button', { name: /update metric/i })
      ).toBeInTheDocument();
    });

    it('pre-fills form fields in edit mode', () => {
      render(
        <MetricForm
          mode="edit"
          metric={{
            id: '1',
            name: 'Enrollment Count',
            category: 'enrollment',
            value: 1500,
            unit: 'students',
            description: 'Total enrollment',
          }}
        />
      );
      expect(getInput('name')).toHaveValue('Enrollment Count');
      expect(getInput('category')).toHaveValue('enrollment');
      expect(getInput('value')).toHaveValue(1500);
      expect(getInput('unit')).toHaveValue('students');
      expect(getInput('description')).toHaveValue('Total enrollment');
    });

    it('has a Cancel button', () => {
      render(<MetricForm />);
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it('renders all five category options', () => {
      render(<MetricForm />);
      const select = getInput('category');
      expect(select.options).toHaveLength(5);
      const values = Array.from(select.options).map((o) => o.value);
      expect(values).toEqual([
        'enrollment',
        'facilities',
        'academic',
        'financial',
        'other',
      ]);
    });
  });

  describe('client-side validation', () => {
    it('shows error when name is empty', async () => {
      render(<MetricForm />);
      fireEvent.click(screen.getByRole('button', { name: /create metric/i }));
      expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    });

    it('shows error when name is too short', async () => {
      render(<MetricForm />);
      await userEvent.type(getInput('name'), 'A');
      fireEvent.click(screen.getByRole('button', { name: /create metric/i }));
      expect(
        await screen.findByText(/at least 2 characters/i)
      ).toBeInTheDocument();
    });

    it('shows error when value is empty', async () => {
      render(<MetricForm />);
      await userEvent.type(getInput('name'), 'Test Metric');
      fireEvent.click(screen.getByRole('button', { name: /create metric/i }));
      expect(await screen.findByText(/value is required/i)).toBeInTheDocument();
    });

    it('does not call API when validation fails', async () => {
      render(<MetricForm />);
      fireEvent.click(screen.getByRole('button', { name: /create metric/i }));
      await screen.findByText(/name is required/i);
      expect(mockApiPost).not.toHaveBeenCalled();
    });
  });

  describe('form submission', () => {
    async function fillValidForm() {
      await userEvent.type(getInput('name'), 'New Metric');
      // Clear default value and type new value
      await userEvent.clear(getInput('value'));
      await userEvent.type(getInput('value'), '42');
    }

    it('calls apiPost on create mode submit with valid data', async () => {
      mockApiPost.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { id: 'new-1' } }),
      });

      render(<MetricForm mode="create" />);
      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /create metric/i }));

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledWith(
          '/api/metrics',
          expect.objectContaining({
            name: 'New Metric',
            value: 42,
          })
        );
      });
    });

    it('calls apiPut on edit mode submit', async () => {
      mockApiPut.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { id: 'm-1' } }),
      });

      render(
        <MetricForm
          mode="edit"
          metric={{ id: 'm-1', name: 'Old Name', category: 'other', value: 10 }}
        />
      );
      await userEvent.clear(getInput('name'));
      await userEvent.type(getInput('name'), 'Updated Name');

      fireEvent.click(screen.getByRole('button', { name: /update metric/i }));

      await waitFor(() => {
        expect(mockApiPut).toHaveBeenCalledWith(
          '/api/metrics/m-1',
          expect.objectContaining({ name: 'Updated Name' })
        );
      });
    });

    it('redirects to /metrics?saved=true on successful create', async () => {
      mockApiPost.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { id: 'new-1' } }),
      });

      render(<MetricForm />);
      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /create metric/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/metrics?saved=true');
      });
    });

    it('shows "Saving..." while submitting', async () => {
      let resolveApi;
      mockApiPost.mockReturnValue(
        new Promise((resolve) => {
          resolveApi = resolve;
        })
      );

      render(<MetricForm />);
      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /create metric/i }));

      expect(await screen.findByText(/saving/i)).toBeInTheDocument();

      resolveApi({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      });
    });

    it('disables submit button while loading', async () => {
      let resolveApi;
      mockApiPost.mockReturnValue(
        new Promise((resolve) => {
          resolveApi = resolve;
        })
      );

      render(<MetricForm />);
      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /create metric/i }));

      await waitFor(() => {
        expect(screen.getByText(/saving/i).closest('button')).toBeDisabled();
      });

      resolveApi({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      });
    });

    it('displays server-side validation errors', async () => {
      mockApiPost.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            error: 'Validation failed',
            details: [{ msg: 'Name already exists' }],
          }),
      });

      render(<MetricForm />);
      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /create metric/i }));

      expect(
        await screen.findByText('Name already exists')
      ).toBeInTheDocument();
    });

    it('shows generic error on network failure', async () => {
      mockApiPost.mockRejectedValue(new Error('Network error'));

      render(<MetricForm />);
      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /create metric/i }));

      expect(await screen.findByText(/unexpected error/i)).toBeInTheDocument();
    });

    it('handles null response from apiPost (401 redirect)', async () => {
      mockApiPost.mockResolvedValue(null);

      render(<MetricForm />);
      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /create metric/i }));

      // Should not redirect (apiClient handles 401 redirect internally)
      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe('cancel button', () => {
    it('calls router.back() when Cancel is clicked', () => {
      render(<MetricForm />);
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockBack).toHaveBeenCalled();
    });
  });
});
