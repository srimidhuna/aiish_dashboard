import { apiClient } from '../apiClient';
import type { District } from '../../types';

export const districtsService = {
  list: async (): Promise<District[]> => {
    const { data } = await apiClient.get('/masters/districts');
    return data.map((d: { id: string; name: string; state: { name: string } }) => ({
      id: d.id,
      name: d.name,
      state: d.state.name,
    }));
  },
  listStates: async (): Promise<string[]> => {
    const { data } = await apiClient.get('/masters/states');
    return data.map((s: { name: string }) => s.name);
  },
  listByState: async (state: string): Promise<District[]> => {
    const { data } = await apiClient.get('/masters/districts', { params: { state } });
    return data.map((d: { id: string; name: string; state: { name: string } }) => ({
      id: d.id,
      name: d.name,
      state: d.state.name,
    }));
  },
};
