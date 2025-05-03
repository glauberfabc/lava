import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Droplets, LogOut, BarChart, Settings } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useProfile } from '../hooks/useProfile';

const Header: React.FC = () => {
  const location = useLocation();
  const { profile } = useProfile();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = profile?.email === 'gladnb@hotmail.com';

  return (
    <header className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center">
              <Droplets className="h-8 w-8 mr-3 text-blue-100" />
              <h1 className="text-2xl font-bold">Lava Rápido</h1>
            </Link>
            <nav className="hidden md:flex items-center space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md transition-colors ${
                  location.pathname === '/'
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`}
              >
                Início
              </Link>
              <Link
                to="/reports"
                className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  location.pathname === '/reports'
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`}
              >
                <BarChart className="h-5 w-5 mr-2" />
                Relatórios
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    location.pathname === '/admin'
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Editar
                </Link>
              )}
            </nav>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sair
          </button>
        </div>
        <p className="text-blue-100 text-sm mt-1">
          Sistema de gerenciamento de veículos
        </p>
      </div>
    </header>
  );
};

export default Header;