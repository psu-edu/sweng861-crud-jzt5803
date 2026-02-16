/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LoginPage from '@/app/login/page';

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock next-auth/react
const mockSignIn = jest.fn();
jest.mock('next-auth/react', () => ({
  signIn: (...args) => mockSignIn(...args),
}));

// Helper: query inputs by type
function getUsernameInput() {
  return document.querySelector('input[type="text"]');
}
function getPasswordInput() {
  return document.querySelector('input[type="password"]');
}

// Mock fetch
const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  global.fetch = originalFetch;
  window.alert.mockRestore();
});

describe('LoginPage component', () => {
  describe('rendering', () => {
    it('renders login form with heading and submit button', () => {
      render(<LoginPage />);
      expect(
        screen.getByRole('heading', { name: /sign in/i })
      ).toBeInTheDocument();
      expect(getUsernameInput()).toBeInTheDocument();
      expect(getPasswordInput()).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it('renders Google OAuth button', () => {
      render(<LoginPage />);
      expect(
        screen.getByRole('button', { name: /continue with google/i })
      ).toBeInTheDocument();
    });

    it('renders toggle to register mode', () => {
      render(<LoginPage />);
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });
  });

  describe('mode toggling', () => {
    it('switches to register mode', () => {
      render(<LoginPage />);
      fireEvent.click(screen.getByText(/don't have an account/i));
      expect(
        screen.getByRole('heading', { name: /create account/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /register/i })
      ).toBeInTheDocument();
    });

    it('switches back to login mode', () => {
      render(<LoginPage />);
      fireEvent.click(screen.getByText(/don't have an account/i));
      fireEvent.click(screen.getByText(/already have an account/i));
      expect(
        screen.getByRole('heading', { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it('clears errors when toggling mode', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      });

      render(<LoginPage />);
      await userEvent.type(getUsernameInput(), 'user');
      await userEvent.type(getPasswordInput(), 'pass123');
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await screen.findByText('Invalid credentials');

      fireEvent.click(screen.getByText(/don't have an account/i));
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
    });
  });

  describe('login flow', () => {
    it('submits login and redirects on success', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            token: 'test.jwt.token',
            user: { id: 1, username: 'alice' },
          }),
      });
      mockSignIn.mockResolvedValue({ ok: true });

      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

      render(<LoginPage />);
      await userEvent.type(getUsernameInput(), 'alice');
      await userEvent.type(getPasswordInput(), 'password123');
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith('jwt', 'test.jwt.token');
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          username: 'alice',
          password: 'password123',
          redirect: false,
        });
        expect(mockPush).toHaveBeenCalledWith('/metrics');
      });

      setItemSpy.mockRestore();
    });

    it('displays error on invalid credentials', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      });

      render(<LoginPage />);
      await userEvent.type(getUsernameInput(), 'alice');
      await userEvent.type(getPasswordInput(), 'wrong');
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      expect(
        await screen.findByText('Invalid credentials')
      ).toBeInTheDocument();
    });

    it('shows "Please wait..." while loading', async () => {
      let resolveLogin;
      global.fetch.mockReturnValue(
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
      );

      render(<LoginPage />);
      await userEvent.type(getUsernameInput(), 'alice');
      await userEvent.type(getPasswordInput(), 'pass123');
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      expect(await screen.findByText('Please wait...')).toBeInTheDocument();

      resolveLogin({
        ok: true,
        json: () => Promise.resolve({ token: 'tok' }),
      });
    });

    it('disables submit button while loading', async () => {
      let resolveLogin;
      global.fetch.mockReturnValue(
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
      );

      render(<LoginPage />);
      await userEvent.type(getUsernameInput(), 'alice');
      await userEvent.type(getPasswordInput(), 'pass123');
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(
          screen.getByText('Please wait...').closest('button')
        ).toBeDisabled();
      });

      resolveLogin({
        ok: true,
        json: () => Promise.resolve({ token: 'tok' }),
      });
    });

    it('handles unexpected errors gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('Network failure'));

      render(<LoginPage />);
      await userEvent.type(getUsernameInput(), 'alice');
      await userEvent.type(getPasswordInput(), 'pass123');
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      expect(await screen.findByText(/unexpected error/i)).toBeInTheDocument();
    });
  });

  describe('registration flow', () => {
    it('calls register endpoint and shows success alert', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            message: 'User registered successfully',
            userId: 1,
          }),
      });

      render(<LoginPage />);
      fireEvent.click(screen.getByText(/don't have an account/i));

      await userEvent.type(getUsernameInput(), 'newuser');
      await userEvent.type(getPasswordInput(), 'pass123');
      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'newuser', password: 'pass123' }),
        });
        expect(window.alert).toHaveBeenCalledWith(
          'Registration successful! Please log in.'
        );
      });
    });

    it('shows registration error', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            error: 'Validation failed',
            details: [{ message: 'Username already exists' }],
          }),
      });

      render(<LoginPage />);
      fireEvent.click(screen.getByText(/don't have an account/i));

      await userEvent.type(getUsernameInput(), 'taken');
      await userEvent.type(getPasswordInput(), 'pass123');
      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      expect(
        await screen.findByText('Username already exists')
      ).toBeInTheDocument();
    });
  });

  describe('Google OAuth', () => {
    it('calls signIn with google provider on button click', () => {
      render(<LoginPage />);
      fireEvent.click(
        screen.getByRole('button', { name: /continue with google/i })
      );
      expect(mockSignIn).toHaveBeenCalledWith('google', {
        callbackUrl: '/metrics',
      });
    });
  });
});
