import { apiClient } from '../apiClient';
import type { User } from '../../types';

interface BackendUserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  hospitalId: string;
}

function mapUser(u: BackendUserProfile): User {
  return {
    id: u.id,
    name: u.fullName,
    email: u.email,
    role: u.role as User['role'],
    hospitalId: u.hospitalId,
  };
}

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    const { data } = await apiClient.post<BackendUserProfile>('/auth/login', { email, password });
    return mapUser(data);
  },
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
  me: async (): Promise<User> => {
    const { data } = await apiClient.get<BackendUserProfile>('/auth/me');
    return mapUser(data);
  },
};
