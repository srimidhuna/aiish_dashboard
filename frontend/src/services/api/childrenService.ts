import { apiClient } from '../apiClient';
import type { Child, TimelineEvent } from '../../types';
import { mapBabyToChild, mapChildToBabyPayload, mapTimelineRecord } from './mappers';

export interface ChildFilters {
  search?: string;
  state?: string;
  districtId?: string;
  hospitalId?: string;
  audiologistId?: string;
  gender?: string;
  riskFactor?: 'ALL' | 'YES' | 'NO';
  referralStatus?: 'ALL' | 'PASS' | 'REFER' | 'PENDING';
  dateFrom?: string;
  dateTo?: string;
}

export const childrenService = {
  list: async (filters: ChildFilters = {}): Promise<Child[]> => {
    const { data } = await apiClient.get('/babies', { params: filters });
    return data.map(mapBabyToChild);
  },
  getById: async (id: string): Promise<Child> => {
    const { data } = await apiClient.get(`/babies/${id}`);
    return mapBabyToChild(data);
  },
  getTimeline: async (childId: string): Promise<TimelineEvent[]> => {
    const { data } = await apiClient.get(`/babies/${childId}/timeline`);
    return data.map(mapTimelineRecord);
  },
  create: async (child: Partial<Child>): Promise<Child> => {
    const { data } = await apiClient.post('/babies', mapChildToBabyPayload(child));
    return mapBabyToChild(data);
  },
  update: async (id: string, child: Partial<Child>): Promise<Child> => {
    const { data } = await apiClient.patch(`/babies/${id}`, mapChildToBabyPayload(child));
    return mapBabyToChild(data);
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/babies/${id}`);
  },
};
