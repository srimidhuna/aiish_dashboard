import { apiClient } from '../apiClient';
import type { Hospital, HospitalStatus } from '../../types';
import { mapHospitalRecord } from './mappers';

export interface HospitalFilters {
  search?: string;
  state?: string;
  districtId?: string;
}

export interface HospitalPayload {
  name: string;
  districtId: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  primaryAudiologistId?: string;
  status?: HospitalStatus;
}

export const hospitalsService = {
  list: async (filters: HospitalFilters = {}): Promise<Hospital[]> => {
    const { data } = await apiClient.get('/masters/hospitals', { params: filters });
    return data.map(mapHospitalRecord);
  },
  getById: async (id: string): Promise<Hospital> => {
    const { data } = await apiClient.get(`/masters/hospitals/${id}`);
    return mapHospitalRecord(data);
  },
  create: async (payload: HospitalPayload): Promise<Hospital> => {
    const { data } = await apiClient.post('/masters/hospitals', payload);
    return mapHospitalRecord(data);
  },
  update: async (id: string, payload: Partial<HospitalPayload>): Promise<Hospital> => {
    const { data } = await apiClient.patch(`/masters/hospitals/${id}`, payload);
    return mapHospitalRecord(data);
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/masters/hospitals/${id}`);
  },
};
