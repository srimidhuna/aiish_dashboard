import { apiClient } from '../apiClient';
import type { RiskCategory, RecommendationType } from '../../types';

export const mastersService = {
  listRiskCategories: async (): Promise<RiskCategory[]> => {
    const { data } = await apiClient.get('/masters/risk-categories');
    return data;
  },
  listRecommendationTypes: async (): Promise<RecommendationType[]> => {
    const { data } = await apiClient.get('/masters/recommendation-types');
    return data;
  },
};
