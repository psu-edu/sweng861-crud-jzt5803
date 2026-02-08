import './globals.css';
import AuthProvider from './components/AuthProvider';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'Campus Analytics',
  description: 'Campus Analytics Platform - SWENG 861',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <AuthProvider>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
