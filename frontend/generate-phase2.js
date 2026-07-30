import fs from 'fs';
import path from 'path';

const files = {};

files['src/services/mockData.ts'] = `
import type { User, District, Hospital, Child, Screening, FollowUp, TimelineEvent, RiskFactor, Recommendation } from '../types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@aiish.demo', role: 'ADMIN' },
  { id: 'u2', name: 'Dr. Smith', email: 'smith@aiish.demo', role: 'DOCTOR' },
];

export const mockDistricts: District[] = [
  { id: 'd1', name: 'Mysuru', state: 'Karnataka' },
  { id: 'd2', name: 'Bengaluru', state: 'Karnataka' },
];

export const mockHospitals: Hospital[] = [
  { id: 'h1', name: 'Mysuru General Hospital', districtId: 'd1', type: 'GOVERNMENT', contactPerson: 'Dr. Rao', phone: '9876543210' },
  { id: 'h2', name: 'AIISH Main Clinic', districtId: 'd1', type: 'GOVERNMENT', contactPerson: 'Dr. Kumar', phone: '9876543211' },
];

// In-memory array for mutations
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
`;

files['src/services/mockServices.ts'] = `
import { delay } from '../lib/utils';
import { mockUsers, mockChildren, mockScreenings, mockHospitals } from './mockData';
import type { User, Child, Screening, Hospital } from '../types';

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
    return {
      totalScreenings: mockScreenings.length,
      referralRate: '15%',
      activeHospitals: mockHospitals.length,
      pendingFollowUps: 45
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
  create: async (data: Partial<Child>): Promise<Child> => {
    await delay(800);
    const newChild: Child = {
      id: \`c\${Date.now()}\`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    } as Child;
    mockChildren.push(newChild);
    return newChild;
  },
  update: async (id: string, data: Partial<Child>): Promise<Child> => {
    await delay(600);
    const idx = mockChildren.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Not found');
    mockChildren[idx] = { ...mockChildren[idx], ...data, updatedAt: new Date().toISOString() };
    return mockChildren[idx];
  },
  delete: async (id: string): Promise<void> => {
    await delay(600);
    const idx = mockChildren.findIndex(c => c.id === id);
    if (idx !== -1) mockChildren.splice(idx, 1);
  }
};
`;

files['src/components/ui/Card.tsx'] = `
import * as React from "react"
import { cn } from "../../lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow", className)} {...props} />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
))
CardTitle.displayName = "CardTitle"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardContent }
`;

files['src/components/ui/Input.tsx'] = `
import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"
export { Input }
`;

files['src/components/ui/Badge.tsx'] = `
import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80": variant === "default",
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80": variant === "destructive",
          "text-foreground": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}
export { Badge }
`;

files['src/features/dashboard/DashboardPage.tsx'] = `
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/mockServices';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Activity, Hospital, Users, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: dashboardService.getOverview
  });

  const { data: trend, isLoading: isLoadingTrend } = useQuery({
    queryKey: ['dashboard-trend'],
    queryFn: dashboardService.getMonthlyTrend
  });

  if (isLoadingOverview || isLoadingTrend) return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Screenings</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalScreenings}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referral Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.referralRate}</div>
            <p className="text-xs text-muted-foreground">-2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Hospitals</CardTitle>
            <Hospital className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.activeHospitals}</div>
            <p className="text-xs text-muted-foreground">+3 new this year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.pendingFollowUps}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Screenings Trend</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="screenings" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">New Child Registered</p>
                  <p className="text-sm text-muted-foreground">HOS-1049 registered at Mysuru Gen.</p>
                </div>
                <div className="ml-auto font-medium text-xs text-muted-foreground">Just now</div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Screening Completed</p>
                  <p className="text-sm text-muted-foreground">HOS-1012 passed OAE.</p>
                </div>
                <div className="ml-auto font-medium text-xs text-muted-foreground">2h ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
`;

files['src/features/children/ChildrenPage.tsx'] = `
import { useQuery } from '@tanstack/react-query';
import { childrenService } from '../../services/mockServices';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Search, Plus } from 'lucide-react';

export default function ChildrenPage() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data: children, isLoading } = useQuery({
    queryKey: ['children', search],
    queryFn: () => childrenService.list(search)
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Children Registry</h1>
        <Button onClick={() => navigate('/children/register')}>
          <Plus className="mr-2 h-4 w-4" /> Register Child
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or hospital number..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading children...</div>
        ) : children?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No children found.</div>
        ) : (
          <div className="w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium">Hosp. No</th>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">DOB</th>
                  <th className="px-6 py-3 font-medium">Gender</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {children?.map(child => (
                  <tr key={child.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => navigate(\`/children/\${child.id}\`)}>
                    <td className="px-6 py-4 font-medium">{child.hospitalNumber}</td>
                    <td className="px-6 py-4">{child.firstName} {child.lastName}</td>
                    <td className="px-6 py-4">{new Date(child.dateOfBirth).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <Badge variant={child.gender === 'FEMALE' ? 'secondary' : 'default'}>{child.gender}</Badge>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <Link to={\`/children/\${child.id}\`} className="text-primary hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
`;

files['src/features/children/RegisterChildPage.tsx'] = `
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { childrenService } from '../../services/mockServices';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { toast } from 'sonner';

const schema = z.object({
  firstName: z.string().min(2, 'Required'),
  lastName: z.string().min(2, 'Required'),
  hospitalNumber: z.string().min(1, 'Required'),
  dateOfBirth: z.string().min(1, 'Required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  birthWeightGrams: z.coerce.number().min(500),
  gestationalAgeWeeks: z.coerce.number().min(20).max(45),
  parentName: z.string().min(2, 'Required'),
  contactNumber: z.string().min(10, 'Invalid number'),
});

type FormData = z.infer<typeof schema>;

export default function RegisterChildPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gender: 'MALE' }
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => childrenService.create({
      ...data,
      hospitalOfBirthId: 'h1',
      address: '',
      riskFactorIds: []
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      toast.success('Child registered successfully!');
      navigate(\`/children/\${data.id}\`);
    },
    onError: () => {
      toast.error('Failed to register child.');
    }
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Register New Child</h1>
        <Button variant="outline" onClick={() => navigate('/children')}>Cancel</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Demographics & Birth Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input {...register('firstName')} />
                {errors.firstName && <span className="text-xs text-destructive">{errors.firstName.message}</span>}
              </div>
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input {...register('lastName')} />
                {errors.lastName && <span className="text-xs text-destructive">{errors.lastName.message}</span>}
              </div>
              <div>
                <label className="text-sm font-medium">Hospital Number</label>
                <Input {...register('hospitalNumber')} />
                {errors.hospitalNumber && <span className="text-xs text-destructive">{errors.hospitalNumber.message}</span>}
              </div>
              <div>
                <label className="text-sm font-medium">Date of Birth</label>
                <Input type="date" {...register('dateOfBirth')} />
                {errors.dateOfBirth && <span className="text-xs text-destructive">{errors.dateOfBirth.message}</span>}
              </div>
              <div>
                <label className="text-sm font-medium">Gender</label>
                <select {...register('gender')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Birth Weight (grams)</label>
                <Input type="number" {...register('birthWeightGrams')} />
                {errors.birthWeightGrams && <span className="text-xs text-destructive">{errors.birthWeightGrams.message}</span>}
              </div>
              <div>
                <label className="text-sm font-medium">Gestational Age (weeks)</label>
                <Input type="number" {...register('gestationalAgeWeeks')} />
                {errors.gestationalAgeWeeks && <span className="text-xs text-destructive">{errors.gestationalAgeWeeks.message}</span>}
              </div>
              <div>
                <label className="text-sm font-medium">Parent Name</label>
                <Input {...register('parentName')} />
                {errors.parentName && <span className="text-xs text-destructive">{errors.parentName.message}</span>}
              </div>
              <div>
                <label className="text-sm font-medium">Contact Number</label>
                <Input {...register('contactNumber')} />
                {errors.contactNumber && <span className="text-xs text-destructive">{errors.contactNumber.message}</span>}
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Register Child'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
`;

files['src/features/children/ChildDetailsPage.tsx'] = `
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { childrenService } from '../../services/mockServices';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';

export default function ChildDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: child, isLoading, error } = useQuery({
    queryKey: ['child', id],
    queryFn: () => childrenService.getById(id!)
  });

  const deleteMutation = useMutation({
    mutationFn: () => childrenService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      toast.success('Child record deleted.');
      navigate('/children');
    }
  });

  if (isLoading) return <div className="p-8">Loading child details...</div>;
  if (error || !child) return <div className="p-8 text-destructive">Error loading child.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{child.firstName} {child.lastName}</h1>
          <p className="text-muted-foreground">Hosp No: {child.hospitalNumber}</p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => toast.info('Edit mode not fully implemented in prompt 2 (requires form).')}>Edit</Button>
          <Button variant="destructive" onClick={() => {
            if (confirm('Are you sure you want to delete this record?')) {
              deleteMutation.mutate();
            }
          }}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Basic Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">DOB:</span> <span>{new Date(child.dateOfBirth).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Gender:</span> <span>{child.gender}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Birth Weight:</span> <span>{child.birthWeightGrams}g</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Gestational Age:</span> <span>{child.gestationalAgeWeeks} weeks</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Parent:</span> <span>{child.parentName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone:</span> <span>{child.contactNumber}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Address:</span> <span>{child.address || 'N/A'}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Screening History</CardTitle></CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/30 rounded-md text-center text-sm text-muted-foreground border">
            Screening timeline implementation placeholder.
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
      { path: 'screenings', element: <Placeholder title="Screenings" /> },
      { path: 'follow-ups', element: <Placeholder title="Follow-ups" /> },
      { path: 'hospitals', element: <Placeholder title="Hospitals" /> },
      { path: 'settings', element: <Placeholder title="Settings" /> },
      { path: 'profile', element: <Placeholder title="Profile" /> },
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

console.log("Phase 2 files generated successfully.");
