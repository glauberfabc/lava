import { supabase } from './supabase';
import { Vehicle, Profile } from '../types';

// Add this new function to get completed vehicles
export const getCompletedVehicles = async (startDate: Date, endDate: Date): Promise<Vehicle[]> => {
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
    .eq('status', 'completed')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString())
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching completed vehicles:', error);
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

// Add the missing getUserProfile function
export const getUserProfile = async (): Promise<Profile | null> => {
  const { data: session } = await supabase.auth.getSession();
  
  if (!session?.session) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.session.user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }

  return data;
};