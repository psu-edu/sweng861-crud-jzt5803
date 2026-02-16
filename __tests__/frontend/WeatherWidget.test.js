/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WeatherWidget from '@/app/components/WeatherWidget';

// Mock the API client
const mockApiGet = jest.fn();
jest.mock('@/lib/apiClient', () => ({
  apiGet: (...args) => mockApiGet(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const mockWeatherData = {
  temperature: 22.5,
  humidity: 65,
  windSpeed: 12.3,
  description: 'Partly cloudy',
};

describe('WeatherWidget component', () => {
  it('shows loading spinner initially', () => {
    mockApiGet.mockReturnValue(new Promise(() => {})); // never resolves
    render(<WeatherWidget />);
    expect(screen.getByText('Loading weather...')).toBeInTheDocument();
  });

  it('displays weather data on successful fetch', async () => {
    mockApiGet.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockWeatherData }),
    });

    render(<WeatherWidget />);

    expect(await screen.findByText('22.5°C')).toBeInTheDocument();
    expect(screen.getByText('Partly cloudy')).toBeInTheDocument();
    expect(screen.getByText('Humidity: 65%')).toBeInTheDocument();
    expect(screen.getByText('Wind: 12.3 km/h')).toBeInTheDocument();
    expect(screen.getByText('Penn State University Park')).toBeInTheDocument();
  });

  it('shows error when API returns null (401)', async () => {
    mockApiGet.mockResolvedValue(null);

    render(<WeatherWidget />);

    expect(
      await screen.findByText('Login to view weather')
    ).toBeInTheDocument();
  });

  it('shows error when API response is not ok', async () => {
    mockApiGet.mockResolvedValue({ ok: false });

    render(<WeatherWidget />);

    expect(
      await screen.findByText('Failed to fetch weather')
    ).toBeInTheDocument();
  });

  it('shows error on network failure', async () => {
    mockApiGet.mockRejectedValue(new Error('Network error'));

    render(<WeatherWidget />);

    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });

  it('calls apiGet with weather preview URL', async () => {
    mockApiGet.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockWeatherData }),
    });

    render(<WeatherWidget />);
    await screen.findByText('22.5°C');

    expect(mockApiGet).toHaveBeenCalledWith(
      '/api/weather/preview?latitude=40.7983&longitude=-77.8599'
    );
  });

  it('shows Refresh button and refetches on click', async () => {
    mockApiGet.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockWeatherData }),
    });

    render(<WeatherWidget />);
    await screen.findByText('22.5°C');

    expect(mockApiGet).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Refresh'));

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledTimes(2);
    });
  });

  it('returns null when no weather and no error', async () => {
    mockApiGet.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: null }),
    });

    const { container } = render(<WeatherWidget />);

    await waitFor(() => {
      expect(screen.queryByText('Loading weather...')).not.toBeInTheDocument();
    });

    // Should render nothing
    expect(container.textContent).toBe('');
  });
});
