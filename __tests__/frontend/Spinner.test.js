/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Spinner from '@/app/components/Spinner';

describe('Spinner component', () => {
  it('renders with default label', () => {
    render(<Spinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<Spinner label="Fetching data..." />);
    expect(screen.getByText('Fetching data...')).toBeInTheDocument();
  });

  it('renders an SVG spinner element', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('animate-spin');
  });

  it('applies correct wrapper styles', () => {
    const { container } = render(<Spinner />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('flex', 'flex-col', 'items-center');
  });
});
