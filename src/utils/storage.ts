import { Vehicle, Service, VehicleCategory, Profile } from '../types';
import { supabase } from './supabase';

// Get all vehicles from storage
export const getVehicles = async (): Promise<Vehicle[]> => {
  const { data: session } = await supabase.auth.getSession();
  
  if (!session?.session) {
    throw new Error('Authentication required');
  }

  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      vehicle_services (
        services (
          id,
          name,
          price,
          category
        )
      )
    `)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }

  return data.map(vehicle => ({
    ...vehicle,
    id: vehicle.id,
    licensePlate: vehicle.license_plate,
    customerName: vehicle.customer_name,
    customerPhone: vehicle.customer_phone,
    timestamp: new Date(vehicle.timestamp).getTime(),
    status: vehicle.status as Vehicle['status'],
    services: vehicle.vehicle_services?.map((vs: any) => vs.services)
  }));
};

// Add a new vehicle
export const addVehicle = async (
  licensePlate: string,
  customerName: string,
  customerPhone: string,
  serviceIds: string[] = []
): Promise<Vehicle> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }

  // Start a transaction
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .insert([{
      license_plate: licensePlate.toUpperCase(),
      customer_name: customerName,
      customer_phone: customerPhone,
      status: 'waiting',
      user_id: session.user.id
    }])
    .select()
    .single();

  if (vehicleError) {
    console.error('Error adding vehicle:', vehicleError);
    throw vehicleError;
  }

  // Add services if any were selected
  if (serviceIds.length > 0) {
    const serviceLinks = serviceIds.map(serviceId => ({
      vehicle_id: vehicle.id,
      service_id: serviceId
    }));

    const { error: servicesError } = await supabase
      .from('vehicle_services')
      .insert(serviceLinks);

    if (servicesError) {
      console.error('Error linking services:', servicesError);
      throw servicesError;
    }
  }

  return {
    ...vehicle,
    id: vehicle.id,
    licensePlate: vehicle.license_plate,
    customerName: vehicle.customer_name,
    customerPhone: vehicle.customer_phone,
    timestamp: new Date(vehicle.timestamp).getTime(),
    status: vehicle.status as Vehicle['status'],
    services: []
  };
};

// Add service to vehicle
export const addServiceToVehicle = async (vehicleId: string, serviceId: string): Promise<void> => {
  const { error } = await supabase
    .from('vehicle_services')
    .insert([{ vehicle_id: vehicleId, service_id: serviceId }]);

  if (error) {
    console.error('Error adding service to vehicle:', error);
    throw error;
  }
};

// Remove service from vehicle
export const removeServiceFromVehicle = async (vehicleId: string, serviceId: string): Promise<void> => {
  const { error } = await supabase
    .from('vehicle_services')
    .delete()
    .match({ vehicle_id: vehicleId, service_id: serviceId });

  if (error) {
    console.error('Error removing service from vehicle:', error);
    throw error;
  }
};

// Update vehicle status
export const updateVehicleStatus = async (
  id: string,
  status: Vehicle['status']
): Promise<Vehicle | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }

  const { data, error } = await supabase
    .from('vehicles')
    .update({ status })
    .eq('id', id)
    .select(`
      *,
      vehicle_services (
        services (
          id,
          name,
          price,
          category
        )
      )
    `)
    .single();

  if (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }

  if (!data) return null;

  return {
    ...data,
    id: data.id,
    licensePlate: data.license_plate,
    customerName: data.customer_name,
    customerPhone: data.customer_phone,
    timestamp: new Date(data.timestamp).getTime(),
    status: data.status as Vehicle['status'],
    services: data.vehicle_services?.map((vs: any) => vs.services)
  };
};

// Remove a vehicle
export const removeVehicle = async (id: string): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }

  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error removing vehicle:', error);
    throw error;
  }

  return true;
};

// Search vehicles
export const searchVehicles = async (query: string): Promise<Vehicle[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }

  if (!query.trim()) return getVehicles();

  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      vehicle_services (
        services (
          id,
          name,
          price,
          category
        )
      )
    `)
    .or(`license_plate.ilike.%${query}%,customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%`)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error searching vehicles:', error);
    throw error;
  }

  return data.map(vehicle => ({
    ...vehicle,
    id: vehicle.id,
    licensePlate: vehicle.license_plate,
    customerName: vehicle.customer_name,
    customerPhone: vehicle.customer_phone,
    timestamp: new Date(vehicle.timestamp).getTime(),
    status: vehicle.status as Vehicle['status'],
    services: vehicle.vehicle_services?.map((vs: any) => vs.services)
  }));
};

// Get all services
export const getServices = async (): Promise<Service[]> => {
  const { data: session } = await supabase.auth.getSession();
  
  if (!session?.session) {
    throw new Error('Authentication required');
  }

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching services:', error);
    throw error;
  }

  return data.map(service => ({
    id: service.id,
    name: service.name,
    price: service.price,
    category: service.category
  }));
};

// Add a new service
export const addService = async (
  name: string,
  price: number,
  category: VehicleCategory
): Promise<Service> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }

  const { data, error } = await supabase
    .from('services')
    .insert([{
      name,
      price,
      category,
      user_id: session.user.id
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding service:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    price: data.price,
    category: data.category
  };
};

// Get reports data
export const getReports = async (
  startDate: Date,
  endDate: Date,
  selectedServices: string[] = []
): Promise<{ serviceName: string; count: number; totalRevenue: number }[]> => {
  const { data: session } = await supabase.auth.getSession();
  
  if (!session?.session) {
    throw new Error('Authentication required');
  }

  let query = supabase
    .from('vehicles')
    .select(`
      vehicle_services (
        services (
          id,
          name,
          price
        )
      )
    `)
    .eq('status', 'completed')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString());

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching report data:', error);
    throw error;
  }

  const serviceStats = data.reduce((acc: { [key: string]: { count: number; totalRevenue: number } }, vehicle) => {
    if (!vehicle.vehicle_services) return acc;
    
    vehicle.vehicle_services.forEach((vs: any) => {
      const service = vs.services;
      if (!service) return;
      
      if (selectedServices.length === 0 || selectedServices.includes(service.id)) {
        if (!acc[service.name]) {
          acc[service.name] = { count: 0, totalRevenue: 0 };
        }
        acc[service.name].count += 1;
        acc[service.name].totalRevenue += Number(service.price);
      }
    });
    
    return acc;
  }, {});

  return Object.entries(serviceStats).map(([serviceName, stats]) => ({
    serviceName,
    count: stats.count,
    totalRevenue: stats.totalRevenue
  }));
};

// Get user profile
export const getUserProfile = async (): Promise<Profile | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      role: data.role
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};

// Get all users (admin only)
export const getUsers = async (): Promise<Profile[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('email', { ascending: true });

  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }

  return data.map(profile => ({
    id: profile.id,
    email: profile.email,
    role: profile.role
  }));
};

// Update user role (admin only)
export const updateUserRole = async (userId: string, role: 'admin' | 'user'): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Update vehicle
export const updateVehicle = async (
  id: string,
  updates: Partial<Vehicle>
): Promise<Vehicle> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }

  const { data, error } = await supabase
    .from('vehicles')
    .update({
      license_plate: updates.licensePlate,
      customer_name: updates.customerName,
      customer_phone: updates.customerPhone
    })
    .eq('id', id)
    .select(`
      *,
      vehicle_services (
        services (
          id,
          name,
          price,
          category
        )
      )
    `)
    .single();

  if (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }

  return {
    ...data,
    id: data.id,
    licensePlate: data.license_plate,
    customerName: data.customer_name,
    customerPhone: data.customer_phone,
    timestamp: new Date(data.timestamp).getTime(),
    status: data.status as Vehicle['status'],
    services: data.vehicle_services?.map((vs: any) => vs.services)
  };
};

// Update service
export const updateService = async (
  id: string,
  updates: Partial<Service>
): Promise<Service> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }

  const { data, error } = await supabase
    .from('services')
    .update({
      name: updates.name,
      price: updates.price,
      category: updates.category
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating service:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    price: data.price,
    category: data.category
  };
};