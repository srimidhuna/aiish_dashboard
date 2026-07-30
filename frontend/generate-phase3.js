import fs from 'fs';
import path from 'path';

const files = {};

files['src/services/mockData.ts'] = `
import type { User, District, Hospital, Child, Screening, FollowUp, TimelineEvent } from '../types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@aiish.demo', role: 'ADMIN', hospitalId: 'h1', phone: '1234567890' } as User,
  { id: 'u2', name: 'Dr. Smith', email: 'smith@aiish.demo', role: 'DOCTOR' } as User,
];

export const mockDistricts: District[] = [
  { id: 'd1', name: 'Mysuru', state: 'Karnataka' },
  { id: 'd2', name: 'Bengaluru', state: 'Karnataka' },
];

export const mockHospitals: Hospital[] = [
  { id: 'h1', name: 'Mysuru General Hospital', districtId: 'd1', type: 'GOVERNMENT', contactPerson: 'Dr. Rao', phone: '9876543210' },
  { id: 'h2', name: 'AIISH Main Clinic', districtId: 'd1', type: 'GOVERNMENT', contactPerson: 'Dr. Kumar', phone: '9876543211' },
];

export let mockChildren: Child[] = Array.from({ length: 50 }, (_, i) => ({
  id: \`c\${i + 1}\`,
  hospitalNumber: \`HOS-\${1000 + i}\`,
  firstName: i % 2 === 0 ? 'Aarav' : 'Diya',
  lastName: i % 3 === 0 ? 'Patel' : 'Sharma',
  dateOfBirth: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
  gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
  birthWeightGrams: 2500 + Math.floor(Math.random() * 1000),
  gestationalAgeWeeks: 36 + Math.floor(Math.random() * 5),
  hospitalOfBirthId: i % 2 === 0 ? 'h1' : 'h2',
  parentName: 'Parent Name',
  contactNumber: '999888777' + (i % 10),
  address: '123 Main St, City',
  riskFactorIds: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

export let mockScreenings: Screening[] = mockChildren.slice(0, 30).map((c, i) => ({
  id: \`s\${i}\`,
  childId: c.id,
  hospitalId: c.hospitalOfBirthId,
  screenerId: 'u1',
  date: new Date().toISOString(),
  type: i % 2 === 0 ? 'OAE' : 'AABR',
  leftEarResult: 'PASS',
  rightEarResult: i % 5 === 0 ? 'REFER' : 'PASS',
  overallResult: i % 5 === 0 ? 'REFER' : 'PASS',
  recommendationIds: []
}));

export let mockFollowUps: FollowUp[] = mockScreenings.filter(s => s.overallResult === 'REFER').map((s, i) => ({
  id: \`f\${i}\`,
  childId: s.childId,
  hospitalId: s.hospitalId,
  providerId: 'u1',
  scheduledDate: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
  status: 'SCHEDULED'
}));

export let mockTimelineEvents: TimelineEvent[] = mockChildren.map(c => ({
  id: \`t\${c.id}_reg\`,
  childId: c.id,
  date: c.createdAt,
  type: 'REGISTRATION',
  title: 'Child Registered',
  description: 'Registered in the system'
}));
`;

files['src/services/mockServices.ts'] = `
import { delay } from '../lib/utils';
import { mockUsers, mockChildren, mockScreenings, mockHospitals, mockFollowUps, mockTimelineEvents } from './mockData';
import type { User, Child, Screening, Hospital, FollowUp, TimelineEvent } from '../types';

export const authService = {
  login: async (email: string, pass: string): Promise<User> => {
    await delay(500);
    if (email === 'admin@aiish.demo' && pass === 'password123') return mockUsers[0];
    throw new Error('Invalid credentials');
  },
  logout: async () => {
    await delay(300);
  }
};

export const dashboardService = {
  getOverview: async () => {
    await delay(600);
    const totalScreenings = mockScreenings.length;
    const referCount = mockScreenings.filter(s => s.overallResult === 'REFER').length;
    const referralRate = totalScreenings ? Math.round((referCount / totalScreenings) * 100) + '%' : '0%';
    const pendingFollowUps = mockFollowUps.filter(f => f.status === 'SCHEDULED').length;

    return {
      totalScreenings,
      referralRate,
      activeHospitals: mockHospitals.length,
      pendingFollowUps
    };
  },
  getMonthlyTrend: async () => {
    await delay(500);
    return [
      { name: 'Jan', screenings: 400, referrals: 24 },
      { name: 'Feb', screenings: 300, referrals: 13 },
      { name: 'Mar', screenings: 200, referrals: 98 },
      { name: 'Apr', screenings: 278, referrals: 39 },
      { name: 'May', screenings: 189, referrals: 48 },
      { name: 'Jun', screenings: 239, referrals: 38 },
    ];
  },
  getUpcomingFollowUps: async () => {
    await delay(400);
    return mockFollowUps.filter(f => f.status === 'SCHEDULED').slice(0, 5);
  }
};

export const hospitalsService = {
  list: async () => {
    await delay(500);
    return mockHospitals.map(h => {
      const childIds = mockChildren.filter(c => c.hospitalOfBirthId === h.id).map(c => c.id);
      const screenings = mockScreenings.filter(s => childIds.includes(s.childId));
      const refers = screenings.filter(s => s.overallResult === 'REFER').length;
      return {
        ...h,
        stats: {
          totalScreenings: screenings.length,
          referralRate: screenings.length ? Math.round((refers / screenings.length) * 100) + '%' : '0%'
        }
      };
    });
  }
};

export const childrenService = {
  list: async (search?: string): Promise<Child[]> => {
    await delay(600);
    let results = [...mockChildren];
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(c => 
        c.firstName.toLowerCase().includes(q) || 
        c.lastName.toLowerCase().includes(q) ||
        c.hospitalNumber.toLowerCase().includes(q)
      );
    }
    return results;
  },
  getById: async (id: string): Promise<Child> => {
    await delay(400);
    const child = mockChildren.find(c => c.id === id);
    if (!child) throw new Error('Child not found');
    return child;
  },
  getTimeline: async (childId: string): Promise<TimelineEvent[]> => {
    await delay(300);
    const events = mockTimelineEvents.filter(t => t.childId === childId);
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  create: async (data: Partial<Child>): Promise<Child> => {
    await delay(800);
    const newChild: Child = {
      id: \`c\${Date.now()}\`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    } as Child;
    mockChildren.push(newChild);
    mockTimelineEvents.push({
      id: \`t\${Date.now()}\`,
      childId: newChild.id,
      date: newChild.createdAt,
      type: 'REGISTRATION',
      title: 'Child Registered',
      description: 'Registered in the system via manual entry.'
    });
    return newChild;
  },
  delete: async (id: string): Promise<void> => {
    await delay(600);
    const idx = mockChildren.findIndex(c => c.id === id);
    if (idx !== -1) mockChildren.splice(idx, 1);
  }
};

export const screeningsService = {
  getByChildId: async (childId: string): Promise<Screening[]> => {
    await delay(400);
    return mockScreenings.filter(s => s.childId === childId);
  },
  create: async (data: Partial<Screening>): Promise<Screening> => {
    await delay(800);
    const newSc: Screening = {
      id: \`s\${Date.now()}\`,
      date: new Date().toISOString(),
      recommendationIds: [],
      ...data
    } as Screening;
    mockScreenings.push(newSc);
    mockTimelineEvents.push({
      id: \`t\${Date.now()}\`,
      childId: newSc.childId,
      date: newSc.date,
      type: 'SCREENING',
      title: 'Screening Completed',
      description: \`\${newSc.type} screening performed. Result: \${newSc.overallResult}\`,
      referenceId: newSc.id
    });
    return newSc;
  }
};

export const followUpsService = {
  getByChildId: async (childId: string): Promise<FollowUp[]> => {
    await delay(300);
    return mockFollowUps.filter(f => f.childId === childId);
  },
  create: async (data: Partial<FollowUp>): Promise<FollowUp> => {
    await delay(600);
    const nf: FollowUp = {
      id: \`f\${Date.now()}\`,
      ...data
    } as FollowUp;
    mockFollowUps.push(nf);
    mockTimelineEvents.push({
      id: \`t\${Date.now()}\`,
      childId: nf.childId,
      date: new Date().toISOString(),
      type: 'FOLLOW_UP',
      title: 'Follow-up Scheduled',
      description: \`Follow-up scheduled for \${new Date(nf.scheduledDate).toLocaleDateString()}\`,
      referenceId: nf.id
    });
    return nf;
  },
  updateStatus: async (id: string, status: FollowUp['status']): Promise<void> => {
    await delay(400);
    const idx = mockFollowUps.findIndex(f => f.id === id);
    if (idx !== -1) {
      mockFollowUps[idx].status = status;
      if (status === 'COMPLETED') mockFollowUps[idx].actualDate = new Date().toISOString();
      mockTimelineEvents.push({
        id: \`t\${Date.now()}\`,
        childId: mockFollowUps[idx].childId,
        date: new Date().toISOString(),
        type: 'STATUS_CHANGE',
        title: 'Follow-up Updated',
        description: \`Follow-up status changed to \${status}\`
      });
    }
  },
  delete: async (id: string): Promise<void> => {
    await delay(400);
    const idx = mockFollowUps.findIndex(f => f.id === id);
    if (idx !== -1) mockFollowUps.splice(idx, 1);
  }
};
`;

files['src/features/screenings/ScreeningFormPage.tsx'] = `
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { screeningsService } from '../../services/mockServices';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { toast } from 'sonner';

const schema = z.object({
  type: z.enum(['OAE', 'AABR']),
  leftEarResult: z.enum(['PASS', 'REFER', 'INCOMPLETE']),
  rightEarResult: z.enum(['PASS', 'REFER', 'INCOMPLETE']),
  overallResult: z.enum(['PASS', 'REFER', 'INCOMPLETE']),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ScreeningFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'OAE', leftEarResult: 'PASS', rightEarResult: 'PASS', overallResult: 'PASS' }
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => screeningsService.create({
      ...data,
      childId: childId!,
      hospitalId: 'h1',
      screenerId: 'u1'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screenings', childId] });
      queryClient.invalidateQueries({ queryKey: ['timeline', childId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      toast.success('Screening submitted successfully!');
      navigate(\`/children/\${childId}\`);
    }
  });

  if (!childId) return <div className="p-8">No child specified.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">New Screening</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Assessment Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Test Type</label>
              <select {...register('type')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 mt-1">
                <option value="OAE">OAE</option>
                <option value="AABR">AABR</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Left Ear Result</label>
                <select {...register('leftEarResult')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 mt-1">
                  <option value="PASS">Pass</option>
                  <option value="REFER">Refer</option>
                  <option value="INCOMPLETE">Incomplete</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Right Ear Result</label>
                <select {...register('rightEarResult')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 mt-1">
                  <option value="PASS">Pass</option>
                  <option value="REFER">Refer</option>
                  <option value="INCOMPLETE">Incomplete</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-primary">Overall Result</label>
              <select {...register('overallResult')} className="flex h-10 w-full rounded-md border-2 border-primary bg-primary/10 px-3 py-1 mt-1 font-bold">
                <option value="PASS">PASS</option>
                <option value="REFER">REFER</option>
                <option value="INCOMPLETE">INCOMPLETE</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Remarks</label>
              <Input {...register('notes')} placeholder="Any additional notes..." />
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={() => toast.info('Draft saved!')}>Save Draft</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Submitting...' : 'Submit Screening'}
          </Button>
        </div>
      </form>
    </div>
  );
}
`;

files['src/features/children/ChildDetailsPage.tsx'] = `
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { childrenService, screeningsService, followUpsService } from '../../services/mockServices';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';

export default function ChildDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: child, isLoading } = useQuery({
    queryKey: ['child', id],
    queryFn: () => childrenService.getById(id!)
  });

  const { data: screenings } = useQuery({
    queryKey: ['screenings', id],
    queryFn: () => screeningsService.getByChildId(id!)
  });

  const { data: followUps } = useQuery({
    queryKey: ['followUps', id],
    queryFn: () => followUpsService.getByChildId(id!)
  });

  const { data: timeline } = useQuery({
    queryKey: ['timeline', id],
    queryFn: () => childrenService.getTimeline(id!)
  });

  const deleteFollowUp = useMutation({
    mutationFn: (fId: string) => followUpsService.delete(fId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      toast.success('Follow-up deleted.');
    }
  });

  const addFollowUp = useMutation({
    mutationFn: () => followUpsService.create({ childId: id!, hospitalId: 'h1', providerId: 'u1', scheduledDate: new Date(Date.now() + 86400000*7).toISOString(), status: 'SCHEDULED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps', id] });
      queryClient.invalidateQueries({ queryKey: ['timeline', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      toast.success('Follow-up scheduled.');
    }
  });

  if (isLoading) return <div className="p-8">Loading child details...</div>;
  if (!child) return <div className="p-8 text-destructive">Error loading child.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{child.firstName} {child.lastName}</h1>
          <p className="text-muted-foreground">Hosp No: {child.hospitalNumber}</p>
        </div>
        <div className="space-x-2">
          <Button onClick={() => navigate(\`/screenings/new?childId=\${id}\`)}>New Screening</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Basic Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">DOB:</span> <span>{new Date(child.dateOfBirth).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Gender:</span> <span>{child.gender}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Screenings</CardTitle></CardHeader>
          <CardContent>
            {screenings?.length === 0 ? <p className="text-sm text-muted-foreground">No screenings yet.</p> : (
              <div className="space-y-2">
                {screenings?.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-2 border rounded-md">
                    <div>
                      <span className="font-medium">{s.type}</span>
                      <span className="text-xs text-muted-foreground ml-2">{new Date(s.date).toLocaleDateString()}</span>
                    </div>
                    <Badge variant={s.overallResult === 'PASS' ? 'default' : 'destructive'}>{s.overallResult}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Follow-ups</CardTitle>
            <Button variant="outline" size="sm" onClick={() => addFollowUp.mutate()}>Schedule</Button>
          </CardHeader>
          <CardContent>
            {followUps?.length === 0 ? <p className="text-sm text-muted-foreground">No follow-ups.</p> : (
              <div className="space-y-2">
                {followUps?.map(f => (
                  <div key={f.id} className="flex justify-between items-center p-2 border rounded-md">
                    <div>
                      <div className="font-medium">{new Date(f.scheduledDate).toLocaleDateString()}</div>
                      <Badge variant="outline">{f.status}</Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => confirm('Delete?') && deleteFollowUp.mutate(f.id)}>Del</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
          <CardContent>
             <div className="space-y-4">
               {timeline?.map(t => (
                 <div key={t.id} className="flex gap-4">
                   <div className="w-2 bg-primary/20 rounded-full shrink-0" />
                   <div>
                     <p className="text-sm font-medium">{t.title}</p>
                     <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleString()} - {t.description}</p>
                   </div>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
`;

files['src/features/hospitals/HospitalsPage.tsx'] = `
import { useQuery } from '@tanstack/react-query';
import { hospitalsService } from '../../services/mockServices';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Building } from 'lucide-react';

export default function HospitalsPage() {
  const { data: hospitals, isLoading } = useQuery({
    queryKey: ['hospitals'],
    queryFn: hospitalsService.list
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Hospitals Directory</h1>
      {isLoading ? <p>Loading...</p> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hospitals?.map(h => (
            <Card key={h.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-base font-bold">{h.name}</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">{h.type} • Contact: {h.contactPerson}</div>
                <div className="grid grid-cols-2 gap-2 text-sm border-t pt-2">
                  <div>
                    <span className="block text-muted-foreground">Screenings</span>
                    <span className="font-bold">{h.stats.totalScreenings}</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground">Referral Rate</span>
                    <span className="font-bold">{h.stats.referralRate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
`;

files['src/features/profile/ProfilePage.tsx'] = `
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuth();
  
  const handleNoOp = () => toast.info('This action is disabled in the demo.');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
           <div><span className="text-sm text-muted-foreground block">Name</span><div className="font-medium">{user?.name}</div></div>
           <div><span className="text-sm text-muted-foreground block">Email</span><div className="font-medium">{user?.email}</div></div>
           <div><span className="text-sm text-muted-foreground block">Role</span><div className="font-medium">{user?.role}</div></div>
           <div className="pt-4 space-x-2">
             <Button onClick={handleNoOp}>Edit Profile</Button>
             <Button variant="outline" onClick={handleNoOp}>Change Password</Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
`;

files['src/routes/index.tsx'] = `
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../features/auth/pages/LoginPage';
import React, { Suspense } from 'react';

const DashboardPage = React.lazy(() => import('../features/dashboard/DashboardPage'));
const ChildrenPage = React.lazy(() => import('../features/children/ChildrenPage'));
const RegisterChildPage = React.lazy(() => import('../features/children/RegisterChildPage'));
const ChildDetailsPage = React.lazy(() => import('../features/children/ChildDetailsPage'));
const ScreeningFormPage = React.lazy(() => import('../features/screenings/ScreeningFormPage'));
const HospitalsPage = React.lazy(() => import('../features/hospitals/HospitalsPage'));
const ProfilePage = React.lazy(() => import('../features/profile/ProfilePage'));

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div className="p-4">Loading...</div>}>{children}</Suspense>
);

const Placeholder = ({ title }: { title: string }) => <div className="p-4"><h1 className="text-2xl font-bold">{title}</h1><p>Placeholder page</p></div>;

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: 'dashboard', element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper> },
      { path: 'children', element: <SuspenseWrapper><ChildrenPage /></SuspenseWrapper> },
      { path: 'children/register', element: <SuspenseWrapper><RegisterChildPage /></SuspenseWrapper> },
      { path: 'children/:id', element: <SuspenseWrapper><ChildDetailsPage /></SuspenseWrapper> },
      { path: 'screenings/new', element: <SuspenseWrapper><ScreeningFormPage /></SuspenseWrapper> },
      { path: 'hospitals', element: <SuspenseWrapper><HospitalsPage /></SuspenseWrapper> },
      { path: 'profile', element: <SuspenseWrapper><ProfilePage /></SuspenseWrapper> },
      { path: 'follow-ups', element: <Placeholder title="Follow-ups" /> },
      { path: 'settings', element: <Placeholder title="Settings" /> },
      { path: 'screenings', element: <Navigate to="/dashboard" replace /> },
    ]
  },
  { path: '*', element: <div className="p-8 text-center"><h1 className="text-4xl font-bold">404</h1><p>Page Not Found</p><a href="/" className="text-primary mt-4 inline-block">Go Home</a></div> }
]);
`;

Object.entries(files).forEach(([filepath, content]) => {
  const fullPath = path.join(process.cwd(), filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim());
});

console.log("Phase 3 files generated successfully.");
