import fs from 'fs';
import path from 'path';

const files = {};

files['src/components/ui/Skeleton.tsx'] = `
import { cn } from "../../lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
`;

files['src/services/mockServices.ts'] = `
import { delay } from '../lib/utils';
import { mockUsers, mockChildren, mockScreenings, mockHospitals, mockFollowUps, mockTimelineEvents } from './mockData';
import type { User, Child, Screening, FollowUp, TimelineEvent } from '../types';

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

export const analyticsService = {
  getAnalytics: async () => {
    await delay(800);
    const passes = mockScreenings.filter(s => s.overallResult === 'PASS').length;
    const refers = mockScreenings.filter(s => s.overallResult === 'REFER').length;
    const incompletes = mockScreenings.filter(s => s.overallResult === 'INCOMPLETE').length;

    const males = mockChildren.filter(c => c.gender === 'MALE').length;
    const females = mockChildren.filter(c => c.gender === 'FEMALE').length;

    return {
      passVsRefer: [
        { name: 'PASS', value: passes },
        { name: 'REFER', value: refers },
        { name: 'INCOMPLETE', value: incompletes },
      ],
      genderDist: [
        { name: 'Male', value: males },
        { name: 'Female', value: females },
      ],
      hospitalPerformance: mockHospitals.map(h => {
        const hChildIds = mockChildren.filter(c => c.hospitalOfBirthId === h.id).map(c => c.id);
        const hScreenings = mockScreenings.filter(s => hChildIds.includes(s.childId));
        return {
          name: h.name.split(' ')[0],
          screenings: hScreenings.length,
          refers: hScreenings.filter(s => s.overallResult === 'REFER').length
        };
      })
    };
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

files['src/features/analytics/AnalyticsPage.tsx'] = `
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services/mockServices';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#2563eb', '#ef4444', '#f59e0b'];

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsService.getAnalytics
  });

  if (isLoading) return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Pass vs Refer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.passVsRefer} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {data?.passVsRefer.map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Hospital Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.hospitalPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Legend />
                  <Bar dataKey="screenings" fill="#2563eb" name="Screenings" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="refers" fill="#ef4444" name="Refers" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
`;

files['src/features/settings/SettingsPage.tsx'] = `
import { useTheme } from '../../hooks/useTheme';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Moon, Sun, Monitor, Bell, Accessibility, Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in duration-300">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize the look and feel of the application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" /> Light
              </Button>
              <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" /> Dark
              </Button>
              <Button variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" /> System
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Manage how you receive alerts and reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email Alerts</span>
                <Button variant="outline" onClick={() => toast.info('Demo: Preference saved.')}>Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Daily Summary</span>
                <Button variant="outline" onClick={() => toast.info('Demo: Preference saved.')}>Configure</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle>Language & Region</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
             <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:ring-1 focus-visible:ring-ring" onChange={() => toast.info('Demo: Language set.')}>
               <option>English (US)</option>
               <option>Kannada</option>
               <option>Hindi</option>
             </select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Accessibility className="h-5 w-5" />
              <CardTitle>Accessibility</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
             <div className="flex items-center justify-between">
                <span className="text-sm font-medium">High Contrast Mode</span>
                <Button variant="outline" onClick={() => toast.info('Demo: Toggle High Contrast.')}>Enable</Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
`;

files['src/routes/index.tsx'] = `
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../features/auth/pages/LoginPage';
import React, { Suspense } from 'react';
import { Skeleton } from '../components/ui/Skeleton';

const DashboardPage = React.lazy(() => import('../features/dashboard/DashboardPage'));
const ChildrenPage = React.lazy(() => import('../features/children/ChildrenPage'));
const RegisterChildPage = React.lazy(() => import('../features/children/RegisterChildPage'));
const ChildDetailsPage = React.lazy(() => import('../features/children/ChildDetailsPage'));
const ScreeningFormPage = React.lazy(() => import('../features/screenings/ScreeningFormPage'));
const HospitalsPage = React.lazy(() => import('../features/hospitals/HospitalsPage'));
const ProfilePage = React.lazy(() => import('../features/profile/ProfilePage'));
const AnalyticsPage = React.lazy(() => import('../features/analytics/AnalyticsPage'));
const SettingsPage = React.lazy(() => import('../features/settings/SettingsPage'));

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div className="p-8 space-y-4"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-[400px] w-full" /></div>}>{children}</Suspense>
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
      { path: 'analytics', element: <SuspenseWrapper><AnalyticsPage /></SuspenseWrapper> },
      { path: 'settings', element: <SuspenseWrapper><SettingsPage /></SuspenseWrapper> },
      { path: 'follow-ups', element: <Placeholder title="Follow-ups" /> },
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

console.log("Phase 4 files generated successfully.");
