import { apiClient } from '../apiClient';
import type { Screening, ScreeningStatus } from '../../types';
import { mapScreeningRecord, mapScreeningToPayload } from './mappers';

export interface ScreeningFilters {
  status?: ScreeningStatus;
  hospitalId?: string;
  districtId?: string;
  state?: string;
  audiologistId?: string;
  dateFrom?: string;
  dateTo?: string;
  childId?: string;
  result?: 'pass' | 'refer';
}

export const screeningsService = {
  list: async (filters: ScreeningFilters = {}): Promise<Screening[]> => {
    const { data } = await apiClient.get('/screening', { params: filters });
    return data.map(mapScreeningRecord);
  },
  getById: async (id: string): Promise<Screening> => {
    const { data } = await apiClient.get(`/screening/${id}`);
    return mapScreeningRecord(data);
  },
  getByChildId: async (childId: string): Promise<Screening[]> => {
    const { data } = await apiClient.get(`/screening/by-baby/${childId}`);
    return data.map(mapScreeningRecord);
  },
  create: async (screening: Partial<Screening>): Promise<Screening> => {
    const { data } = await apiClient.post('/screening', mapScreeningToPayload(screening));
    return mapScreeningRecord(data);
  },
  update: async (id: string, screening: Partial<Screening>): Promise<Screening> => {
    const { data } = await apiClient.patch(`/screening/${id}`, mapScreeningToPayload(screening));
    return mapScreeningRecord(data);
  },
};
