import { apiClient } from '../apiClient';
import type { TimelineEvent, FollowUp } from '../../types';
import { mapFollowUpRecord } from './mappers';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface DashboardOverview {
  totalRegistered: number;
  todaysScreenings: number;
  totalScreenings: number;
  referralRate: string;
  activeHospitals: number;
  pendingFollowUps: number;
  highRiskBabies: number;
  todaysRegistrations: number;
  todaysPass: number;
  todaysRefer: number;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  date: string;
  severity: 'high' | 'medium';
}

export interface HighRiskBaby {
  id: string;
  firstName: string;
  lastName: string;
  hospital: string;
  reason: string;
  riskLevel: 'High' | 'Medium';
}

export const dashboardService = {
  getOverview: async (year?: string): Promise<DashboardOverview> => {
    const { data } = await apiClient.get('/dashboard/overview', { params: { year } });
    return data;
  },
  getActivityTimeline: async (year?: string): Promise<TimelineEvent[]> => {
    const { data } = await apiClient.get('/dashboard/activity-timeline', { params: { year } });
    return data.map((t: any) => ({
      id: t.id,
      childId: t.babyId,
      date: t.createdAt,
      type: t.event,
      title: t.description ?? t.event,
      description: t.baby ? `${t.baby.firstName} ${t.baby.lastName}` : (t.description ?? ''),
    }));
  },
  getUpcomingFollowUps: async (year?: string): Promise<FollowUp[]> => {
    const { data } = await apiClient.get('/dashboard/upcoming-follow-ups', { params: { year } });
    return data.map(mapFollowUpRecord);
  },
  getNotifications: async (year?: string): Promise<Notification[]> => {
    const { data } = await apiClient.get('/dashboard/notifications', { params: { year } });
    return data;
  },
  getHighRiskBabies: async (year?: string): Promise<HighRiskBaby[]> => {
    const { data } = await apiClient.get('/dashboard/high-risk-babies', { params: { year } });
    return data;
  },
  getAvailableYears: async (): Promise<string[]> => {
    const { data } = await apiClient.get('/dashboard/available-years');
    return data;
  },
};
