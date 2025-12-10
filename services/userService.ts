import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  company_name?: string;
  company_address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  currency?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// Fetch all users
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching users:', error.message);
    throw error;
  }
};

// Fetch user by ID
export const getUserById = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error fetching user:', error.message);
    throw error;
  }
};

// Create user
export const createUser = async (userProfile: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([userProfile])
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error creating user:', error.message);
    throw error;
  }
};

// Update user
export const updateUser = async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error updating user:', error.message);
    throw error;
  }
};

// Delete user
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);
    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting user:', error.message);
    throw error;
  }
};
