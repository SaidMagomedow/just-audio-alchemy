
import React from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="py-4 bg-white border-b border-gray-100">
        <div className="container flex justify-center">
          <Link to="/" className="text-xl font-semibold">Just.<span style={{ color: '#FF7A00' }}>Audio</span>.AI</Link>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        {children}
      </main>
      
      <footer className="py-4 bg-white border-t border-gray-100">
        <div className="container text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Just.Audio.AI. Все права защищены.
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
