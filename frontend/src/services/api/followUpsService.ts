import { apiClient } from '../apiClient';
import type { FollowUp, FollowUpStatus } from '../../types';
import { mapFollowUpRecord, mapFollowUpToPayload } from './mappers';

export interface FollowUpFilters {
  status?: FollowUpStatus;
  hospitalId?: string;
  districtId?: string;
  state?: string;
  childId?: string;
}

export interface PhoneSurveillanceItem {
  id: string; // baby id
  mrNumber: string;
  pocdNumber: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  motherName: string;
  fatherName: string;
  contactNumber: string;
  whatsappNumber: string;
  phone2: string;
  hospitalName: string;
  district: string;
  state: string;
  riskFactors: string[];
  screeningPassDate: string;
  dueDate: string;
  status: 'due' | 'upcoming' | 'completed';
  isDue: boolean;
  daysUntilDue: number;
  followUpId?: string;
  callStatus?: string;
  callNotes?: string;
  callDate?: string;
}

export interface LogPhoneCallPayload {
  babyId: string;
  status: 'completed' | 'rescheduled' | 'missed';
  notes?: string;
  callDate?: string;
  nextSteps?: string;
}

export const followUpsService = {
  getPhoneSurveillance: async (): Promise<PhoneSurveillanceItem[]> => {
    const { data } = await apiClient.get('/follow-up/phone-surveillance');
    return data;
  },
  logPhoneCall: async (payload: LogPhoneCallPayload): Promise<FollowUp> => {
    const { data } = await apiClient.post('/follow-up/log-phone-call', payload);
    return mapFollowUpRecord(data);
  },
  list: async (filters: FollowUpFilters = {}): Promise<FollowUp[]> => {
    const { data } = await apiClient.get('/follow-up', { params: filters });
    return data.map(mapFollowUpRecord);
  },
  getByChildId: async (childId: string): Promise<FollowUp[]> => {
    const { data } = await apiClient.get(`/follow-up/by-baby/${childId}`);
    return data.map(mapFollowUpRecord);
  },
  create: async (followUp: Partial<FollowUp>): Promise<FollowUp> => {
    const { data } = await apiClient.post('/follow-up', mapFollowUpToPayload(followUp));
    return mapFollowUpRecord(data);
  },
  update: async (id: string, followUp: Partial<FollowUp>): Promise<FollowUp> => {
    const { data } = await apiClient.patch(`/follow-up/${id}`, mapFollowUpToPayload(followUp));
    return mapFollowUpRecord(data);
  },
  updateStatus: async (id: string, status: FollowUpStatus): Promise<void> => {
    await apiClient.patch(`/follow-up/${id}/status`, { status });
  },
  reschedule: async (id: string, scheduledDate: string): Promise<void> => {
    await apiClient.patch(`/follow-up/${id}/reschedule`, { scheduledDate });
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/follow-up/${id}`);
  },
};
