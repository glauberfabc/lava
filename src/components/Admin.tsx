import React, { useState, useEffect } from 'react';
import { Settings, Users, Car, Wrench } from 'lucide-react';
import {
  getUsers,
  getVehicles,
  getServices,
  updateUserRole,
  updateVehicle,
  updateService
} from '../utils/storage';
import { Profile, Vehicle, Service } from '../types';

const Admin: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'vehicles' | 'services'>('users');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, vehiclesData, servicesData] = await Promise.all([
        getUsers(),
        getVehicles(),
        getServices()
      ]);
      setUsers(usersData);
      setVehicles(vehiclesData);
      setServices(servicesData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleUserRoleUpdate = async (userId: string, role: 'admin' | 'user') => {
    try {
      await updateUserRole(userId, role);
      await loadData();
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Erro ao atualizar papel do usuário');
    }
  };

  const handleVehicleUpdate = async (id: string, updates: Partial<Vehicle>) => {
    try {
      await updateVehicle(id, updates);
      await loadData();
    } catch (err) {
      console.error('Error updating vehicle:', err);
      setError('Erro ao atualizar veículo');
    }
  };

  const handleServiceUpdate = async (id: string, updates: Partial<Service>) => {
    try {
      await updateService(id, updates);
      await loadData();
    } catch (err) {
      console.error('Error updating service:', err);
      setError('Erro ao atualizar serviço');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <Settings className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-2xl font-semibold text-gray-800">Painel de Administração</h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'users'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('users')}
          >
            <Users className="h-5 w-5 inline-block mr-2" />
            Usuários
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'vehicles'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('vehicles')}
          >
            <Car className="h-5 w-5 inline-block mr-2" />
            Veículos
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'services'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('services')}
          >
            <Wrench className="h-5 w-5 inline-block mr-2" />
            Serviços
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Papel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={user.role}
                        onChange={(e) => handleUserRoleUpdate(user.id, e.target.value as 'admin' | 'user')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="user">Usuário</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map(vehicle => (
                  <tr key={vehicle.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <input
                        type="text"
                        value={vehicle.licensePlate}
                        onChange={(e) => handleVehicleUpdate(vehicle.id, { licensePlate: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <input
                        type="text"
                        value={vehicle.customerName}
                        onChange={(e) => handleVehicleUpdate(vehicle.id, { customerName: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <input
                        type="text"
                        value={vehicle.customerPhone}
                        onChange={(e) => handleVehicleUpdate(vehicle.id, { customerPhone: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vehicle.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={vehicle.serviceId || ''}
                        onChange={(e) => handleVehicleUpdate(vehicle.id, { serviceId: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="">Selecione um serviço</option>
                        {services.map(service => (
                          <option key={service.id} value={service.id}>
                            {service.name} - R$ {service.price}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map(service => (
                  <tr key={service.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <input
                        type="text"
                        value={service.name}
                        onChange={(e) => handleServiceUpdate(service.id, { name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <input
                        type="number"
                        value={service.price}
                        onChange={(e) => handleServiceUpdate(service.id, { price: Number(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <select
                        value={service.category}
                        onChange={(e) => handleServiceUpdate(service.id, { category: e.target.value as VehicleCategory })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="carro_pequeno">Carro Pequeno</option>
                        <option value="carro_medio">Carro Médio</option>
                        <option value="carro_grande">Carro Grande</option>
                        <option value="suv">SUV</option>
                        <option value="van">Van</option>
                        <option value="caminhonete">Caminhonete</option>
                        <option value="moto">Moto</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;