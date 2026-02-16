/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthProvider from '@/app/components/AuthProvider';

// Mock next-auth/react SessionProvider
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}));

describe('AuthProvider component', () => {
  it('renders children inside SessionProvider', () => {
    render(
      <AuthProvider>
        <p>Hello World</p>
      </AuthProvider>
    );

    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('passes through multiple children', () => {
    render(
      <AuthProvider>
        <p>Child 1</p>
        <p>Child 2</p>
      </AuthProvider>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });
});
