import { apiClient } from '../apiClient';
import type { Audiologist } from '../../types';

interface BackendAudiologist {
  id: string;
  fullName: string;
  email: string;
  hospitalId: string;
}

export const audiologistsService = {
  list: async (hospitalId?: string): Promise<Audiologist[]> => {
    const { data } = await apiClient.get<BackendAudiologist[]>('/masters/audiologists', {
      params: hospitalId ? { hospitalId } : {},
    });
    return data.map((a) => ({
      id: a.id,
      name: a.fullName,
      email: a.email,
      hospitalId: a.hospitalId,
    }));
  },
};
