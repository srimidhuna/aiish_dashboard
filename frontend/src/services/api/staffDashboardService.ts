import { apiClient } from '../apiClient';

export interface StaffDashboardOverview {
  todaysScreenings: number;
  rescreeningRequired: number;
  todaysFollowUps: number;
  recentChildren: {
    id: string;
    firstName: string;
    lastName: string;
    mrNumber: string;
    registeredAt: string;
    lastScreeningStatus: 'draft' | 'scheduled' | 'completed' | null;
    lastScreeningResult: 'pass' | 'refer' | null;
  }[];
}

export const staffDashboardService = {
  getStaffOverview: async (hospitalId: string): Promise<StaffDashboardOverview> => {
    const { data } = await apiClient.get('/dashboard/staff-overview', {
      params: { hospitalId },
    });
    return data;
  },
};
