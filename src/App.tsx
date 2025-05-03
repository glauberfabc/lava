import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './utils/supabase';
import Header from './components/Header';
import VehicleForm from './components/VehicleForm';
import ServiceForm from './components/ServiceForm';
import VehicleList from './components/VehicleList';
import SearchBar from './components/SearchBar';
import AuthForm from './components/AuthForm';
import Reports from './components/Reports';
import Admin from './components/Admin';
import { getVehicles, searchVehicles, getUserProfile } from './utils/storage';
import { Vehicle, User, Profile } from './types';

function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);

  // Load vehicles from storage
  const loadVehicles = async () => {
    try {
      setError(null);
      const data = await getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error('Error loading vehicles:', err);
      setError('Erro ao carregar veículos. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadVehicles();
  }, []);

  // Handle search
  const handleSearch = async (query: string) => {
    try {
      setError(null);
      const results = await searchVehicles(query);
      setVehicles(results);
    } catch (err) {
      console.error('Error searching vehicles:', err);
      setError('Erro ao buscar veículos. Por favor, tente novamente.');
    }
  };

  // Filter vehicles by status
  const getFilteredVehicles = (status: Vehicle['status']) => {
    return vehicles.filter(vehicle => vehicle.status === status);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="md:flex md:space-x-6">
        {/* Left sidebar with forms */}
        <div className="md:w-1/3 mb-6 md:mb-0">
          <div className="mb-4">
            <button
              onClick={() => setShowServiceForm(!showServiceForm)}
              className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              {showServiceForm ? 'Cadastrar Veículo' : 'Cadastrar Serviço'}
            </button>
          </div>

          {showServiceForm ? (
            <ServiceForm onAdd={loadVehicles} />
          ) : (
            <VehicleForm onAdd={loadVehicles} />
          )}
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-2">Estatísticas</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2 rounded shadow-sm">
                <p className="text-yellow-500 font-bold text-xl">{getFilteredVehicles('waiting').length}</p>
                <p className="text-gray-600 text-xs">Aguardando</p>
              </div>
              <div className="bg-white p-2 rounded shadow-sm">
                <p className="text-blue-500 font-bold text-xl">{getFilteredVehicles('in-progress').length}</p>
                <p className="text-gray-600 text-xs">Em Lavagem</p>
              </div>
              <div className="bg-white p-2 rounded shadow-sm">
                <p className="text-green-500 font-bold text-xl">{getFilteredVehicles('completed').length}</p>
                <p className="text-gray-600 text-xs">Concluídos</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content with vehicle list */}
        <div className="md:w-2/3">
          <SearchBar onSearch={handleSearch} />
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Carregando veículos...</p>
            </div>
          ) : (
            <VehicleList vehicles={vehicles} onUpdate={loadVehicles} />
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile();
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async () => {
    const profile = await getUserProfile();
    setProfile(profile);
  };

  if (!user) {
    return <AuthForm />;
  }

  const isAdmin = profile?.email === 'gladnb@hotmail.com';

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          {isAdmin && <Route path="/admin" element={<Admin />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;