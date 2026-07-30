import { apiClient } from '../apiClient';

export interface StaffMember {
  id: string;
  employeeId: string;
  fullName: string;
  gender: string;
  dateOfBirth?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  role?: string | null;
  designation?: string | null;
  department?: string | null;
  qualification?: string | null;
  licenseNumber?: string | null;
  yearsOfExperience?: number | null;
  hospitalId?: string | null;
  status?: string;
  createdAt: string;
}

export interface CreateStaffPayload {
  employeeId: string;
  fullName: string;
  gender: string;
  dateOfBirth?: string;
  mobileNumber?: string;
  email?: string;
  photoUrl?: string;
  role?: string;
  designation?: string;
  department?: string;
  qualification?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  hospitalId?: string;
}

export const staffService = {
  list: async (hospitalId?: string): Promise<StaffMember[]> => {
    const { data } = await apiClient.get<StaffMember[]>('/masters/staff', {
      params: hospitalId ? { hospitalId } : {},
    });
    return data;
  },

  create: async (payload: CreateStaffPayload): Promise<StaffMember> => {
    const { data } = await apiClient.post<StaffMember>('/masters/staff', payload);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/masters/staff/${id}`);
  },
};
