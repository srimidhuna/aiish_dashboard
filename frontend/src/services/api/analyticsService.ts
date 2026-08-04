import { apiClient } from '../apiClient';
import type { DateFilterParams } from './dashboardService';

export interface NameValue {
  name: string;
  value: number;
}

export interface PerformanceRow {
  name: string;
  screenings: number;
  refers: number;
}

export interface LocationPerformanceRow extends PerformanceRow {
  state?: string;
  hospitals: number;
  registered: number;
  referralRate: string;
  passes?: number;
  pendingFollowUps: number;
}

/** District row derived from the parentDistrict field in Parent Information */
export interface ParentDistrictRow {
  name: string;
  state: string;
  registered: number;
  passes: number;
  refers: number;
}

export interface YearlyPerformanceRow {
  name: string;
  screenings: number;
  refers: number;
}

export interface AnalyticsPayload {
  passVsRefer: NameValue[];
  genderDist: NameValue[];
  urbanVsRural: NameValue[];
  hospitalPerformance: PerformanceRow[];
  districtPerformance: LocationPerformanceRow[];
  statePerformance: LocationPerformanceRow[];
  /** Babies grouped by the parentState entered in the registration form */
  parentStatePerformance: LocationPerformanceRow[];
  parentDistrictPerformance: ParentDistrictRow[];
  yearlyPerformance: YearlyPerformanceRow[];
  monthlyData: NameValue[];
  ageData: NameValue[];
  followUpSuccessRate: number;
  referralConversionRate: number;
}

export const analyticsService = {
  getAnalytics: async (params?: DateFilterParams): Promise<AnalyticsPayload> => {
    const { data } = await apiClient.get('/dashboard/analytics', { params });
    return data;
  },
};
