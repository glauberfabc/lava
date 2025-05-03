import React from 'react';
import { Vehicle, VehicleStatus, Service } from '../types';
import { Clock, CheckCircle, Play, X, Phone, Tag, Plus, Trash } from 'lucide-react';
import { updateVehicleStatus, removeVehicle, addServiceToVehicle, removeServiceFromVehicle } from '../utils/storage';

interface VehicleListProps {
  vehicles: Vehicle[];
  onUpdate: () => void;
}

const VehicleList: React.FC<VehicleListProps> = ({ vehicles, onUpdate }) => {
  // Format timestamp to readable date/time
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status icon and color
  const getStatusDetails = (status: VehicleStatus) => {
    switch (status) {
      case 'waiting':
        return {
          icon: <Clock className="h-5 w-5" />,
          color: 'text-yellow-500 bg-yellow-50'
        };
      case 'in-progress':
        return {
          icon: <Play className="h-5 w-5" />,
          color: 'text-blue-500 bg-blue-50'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          color: 'text-green-500 bg-green-50'
        };
      default:
        return {
          icon: <Clock className="h-5 w-5" />,
          color: 'text-gray-500 bg-gray-50'
        };
    }
  };

  // Handle status update
  const handleStatusChange = async (id: string, status: VehicleStatus) => {
    try {
      await updateVehicleStatus(id, status);
      onUpdate();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Handle vehicle removal
  const handleRemove = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este veículo?')) {
      try {
        await removeVehicle(id);
        onUpdate();
      } catch (err) {
        console.error('Error removing vehicle:', err);
      }
    }
  };

  // Handle adding service
  const handleAddService = async (vehicleId: string, serviceId: string) => {
    try {
      await addServiceToVehicle(vehicleId, serviceId);
      onUpdate();
    } catch (err) {
      console.error('Error adding service:', err);
    }
  };

  // Handle removing service
  const handleRemoveService = async (vehicleId: string, serviceId: string) => {
    try {
      await removeServiceFromVehicle(vehicleId, serviceId);
      onUpdate();
    } catch (err) {
      console.error('Error removing service:', err);
    }
  };

  // Format category label
  const formatCategory = (category: string) => {
    const labels = {
      carro_pequeno: 'Carro Pequeno',
      carro_medio: 'Carro Médio',
      carro_grande: 'Carro Grande',
      suv: 'SUV',
      van: 'Van',
      caminhonete: 'Caminhonete',
      moto: 'Moto'
    };
    return labels[category as keyof typeof labels] || category;
  };

  // Calculate total price for a vehicle
  const calculateTotal = (services: Service[]) => {
    return services.reduce((total, service) => total + service.price, 0);
  };

  // Generate WhatsApp message
  const getWhatsAppLink = (vehicle: Vehicle) => {
    const phone = vehicle.customerPhone.replace(/\D/g, '');
    const currentTime = formatTime(Date.now());
    const services = vehicle.services || [];
    const total = calculateTotal(services);
    
    const servicesList = services
      .map(service => `${service.name} - R$ ${service.price.toFixed(2)}`)
      .join('%0A');

    const message = `Olá ${vehicle.customerName},%0A%0A` +
      `Finalizamos o serviço do seu veículo de placa ${vehicle.licensePlate} agora as ${currentTime}.%0A%0A` +
      `Os serviços são:%0A${servicesList}%0A` +
      `Total: R$ ${total.toFixed(2)}%0A%0A` +
      `Pode buscar seu veículo!%0A%0A` +
      `*Estética Automotiva Du Brilho* agradece pela sua preferência.%0A` +
      `https://g.co/kgs/zSz8N6d%0A` +
      `Avaliem-nos no Google e ganhe Cera Liquida GRÁTIS na próxima lavagem`;

    return `https://api.whatsapp.com/send?phone=55${phone}&text=${message}`;
  };

  // Filter out completed vehicles
  const activeVehicles = vehicles.filter(v => v.status !== 'completed');

  if (activeVehicles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum veículo em atendimento.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activeVehicles.map((vehicle) => {
        const { icon, color } = getStatusDetails(vehicle.status);
        const services = vehicle.services || [];
        const total = calculateTotal(services);
        
        return (
          <div 
            key={vehicle.id} 
            className="bg-white rounded-lg shadow-md p-4 transition-all hover:shadow-lg"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-lg">{vehicle.licensePlate}</h3>
                <p className="text-gray-700">{vehicle.customerName}</p>
                <p className="text-gray-600 flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-1" />
                  <a 
                    href={getWhatsAppLink(vehicle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {vehicle.customerPhone}
                  </a>
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Entrada: {formatTime(vehicle.timestamp)}
                </p>
              </div>
              
              <div className={`px-2 py-1 rounded-md flex items-center ${color}`}>
                {icon}
                <span className="ml-1 text-sm capitalize">
                  {vehicle.status === 'waiting' ? 'Aguardando' : 
                   vehicle.status === 'in-progress' ? 'Em Lavagem' : 'Concluído'}
                </span>
              </div>
            </div>

            {/* Services List */}
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-gray-700 flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                Serviços
              </h4>
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                >
                  <div>
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatCategory(service.category)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      R$ {service.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleRemoveService(vehicle.id, service.id)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {total > 0 && (
                <div className="bg-green-50 p-2 rounded-md">
                  <p className="text-green-700 font-medium text-right">
                    Total: R$ {total.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-between space-x-2">
              {vehicle.status !== 'waiting' && (
                <button 
                  onClick={() => handleStatusChange(vehicle.id, 'waiting')}
                  className="flex-1 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors"
                >
                  Aguardando
                </button>
              )}
              
              {vehicle.status !== 'in-progress' && (
                <button 
                  onClick={() => handleStatusChange(vehicle.id, 'in-progress')}
                  className="flex-1 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Iniciar
                </button>
              )}
              
              {vehicle.status !== 'completed' && (
                <button 
                  onClick={() => handleStatusChange(vehicle.id, 'completed')}
                  className="flex-1 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                >
                  Concluir
                </button>
              )}
              
              <button 
                onClick={() => handleRemove(vehicle.id)}
                className="flex-none ml-1 p-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                aria-label="Remover veículo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VehicleList;