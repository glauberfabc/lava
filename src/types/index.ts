export interface Vehicle {
  id: string;
  licensePlate: string;
  customerName: string;
  customerPhone: string;
  timestamp: number;
  status: 'waiting' | 'in-progress' | 'completed';
  services?: Service[];
}

export type VehicleStatus = 'waiting' | 'in-progress' | 'completed';

export type VehicleCategory = 'carro_pequeno' | 'carro_medio' | 'carro_grande' | 'suv' | 'van' | 'caminhonete' | 'moto';

export interface Service {
  id: string;
  name: string;
  price: number;
  category: VehicleCategory;
}

export interface User {
  email: string;
  id: string;
}

export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'user';
}