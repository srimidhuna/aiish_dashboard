import { apiClient } from '../apiClient';
import type { TimelineEvent, FollowUp } from '../../types';
import { mapFollowUpRecord } from './mappers';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface DateFilterParams {
  year?: string;
  month?: string;
  day?: string;
}

export interface DashboardOverview {
  totalRegistered: number;
  todaysScreenings: number;
  totalScreenings: number;
  referralRate: string;
  activeHospitals: number;
  pendingFollowUps: number;
  rescreeningRequired: number;
  highRiskBabies: number;
  todaysRegistrations: number;
  todaysFollowUps: number;
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

export interface TodaysFollowUp {
  id: string;
  firstName: string;
  lastName: string;
  hospital: string;
  status: string;
  followUpType: string;
}

export const dashboardService = {
  getOverview: async (params?: DateFilterParams): Promise<DashboardOverview> => {
    const { data } = await apiClient.get('/dashboard/overview', { params });
    return data;
  },
  getActivityTimeline: async (params?: DateFilterParams): Promise<TimelineEvent[]> => {
    const { data } = await apiClient.get('/dashboard/activity-timeline', { params });
    return data.map((t: any) => ({
      id: t.id,
      childId: t.babyId,
      date: t.createdAt,
      type: t.event,
      title: t.description ?? t.event,
      description: t.baby ? `${t.baby.firstName} ${t.baby.lastName}` : (t.description ?? ''),
    }));
  },
  getUpcomingFollowUps: async (params?: DateFilterParams): Promise<FollowUp[]> => {
    const { data } = await apiClient.get('/dashboard/upcoming-follow-ups', { params });
    return data.map(mapFollowUpRecord);
  },
  getTodaysFollowUps: async (params?: DateFilterParams): Promise<TodaysFollowUp[]> => {
    const { data } = await apiClient.get('/dashboard/todays-follow-ups', { params });
    return data;
  },
  getNotifications: async (params?: DateFilterParams): Promise<Notification[]> => {
    const { data } = await apiClient.get('/dashboard/notifications', { params });
    return data;
  },
  getHighRiskBabies: async (params?: DateFilterParams): Promise<HighRiskBaby[]> => {
    const { data } = await apiClient.get('/dashboard/high-risk-babies', { params });
    return data;
  },
  getAvailableYears: async (): Promise<string[]> => {
    const { data } = await apiClient.get('/dashboard/available-years');
    return data;
  },
};
