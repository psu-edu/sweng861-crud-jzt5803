/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navbar from '@/app/components/Navbar';

// Mock next-auth/react
const mockSignOut = jest.fn();
let mockSessionData = null;
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: mockSessionData }),
  signOut: (...args) => mockSignOut(...args),
}));

// Mock the API client
let mockJwtUser = null;
jest.mock('@/lib/apiClient', () => ({
  getJwtUser: () => mockJwtUser,
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockSessionData = null;
  mockJwtUser = null;
});

describe('Navbar component', () => {
  describe('unauthenticated state', () => {
    it('shows Login link when no session or JWT', () => {
      render(<Navbar />);
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });

    it('renders app name', () => {
      render(<Navbar />);
      expect(screen.getByText('Campus Analytics')).toBeInTheDocument();
    });

    it('renders Dashboard and Metrics navigation links', () => {
      render(<Navbar />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Metrics')).toBeInTheDocument();
    });
  });

  describe('authenticated via NextAuth session', () => {
    it('shows username and Logout button', () => {
      mockSessionData = { user: { name: 'Alice', role: 'user' } };
      render(<Navbar />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
    });

    it('shows Admin badge for admin users', () => {
      mockSessionData = { user: { name: 'AdminUser', role: 'admin' } };
      render(<Navbar />);
      expect(screen.getByText('Admin')).toBeInTheDocument(); // badge text
      expect(screen.getByText('AdminUser')).toBeInTheDocument(); // username
    });
  });

  describe('authenticated via JWT (no NextAuth session)', () => {
    it('shows JWT username and Logout button', () => {
      mockJwtUser = { username: 'bob', role: 'user' };
      render(<Navbar />);
      expect(screen.getByText('bob')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  describe('logout behavior', () => {
    it('calls signOut and clears JWT on logout', () => {
      mockSessionData = { user: { name: 'Alice' } };
      // Mock localStorage
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

      render(<Navbar />);
      fireEvent.click(screen.getByText('Logout'));

      expect(removeItemSpy).toHaveBeenCalledWith('jwt');
      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' });

      removeItemSpy.mockRestore();
    });
  });

  describe('navigation links', () => {
    it('Dashboard links to /', () => {
      render(<Navbar />);
      const dashLink = screen.getByText('Dashboard');
      expect(dashLink.closest('a')).toHaveAttribute('href', '/');
    });

    it('Metrics links to /metrics', () => {
      render(<Navbar />);
      const metricsLink = screen.getByText('Metrics');
      expect(metricsLink.closest('a')).toHaveAttribute('href', '/metrics');
    });

    it('Campus Analytics links to /', () => {
      render(<Navbar />);
      const logo = screen.getByText('Campus Analytics');
      expect(logo.closest('a')).toHaveAttribute('href', '/');
    });
  });
});
