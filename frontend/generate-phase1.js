import fs from 'fs';
import path from 'path';

const files = {};

files['src/types/index.ts'] = `
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type ScreeningResult = 'PASS' | 'REFER' | 'INCOMPLETE';
export type FollowUpStatus = 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'LOST_TO_FOLLOWUP';
export type Ear = 'LEFT' | 'RIGHT' | 'BOTH';
export type Role = 'ADMIN' | 'DOCTOR' | 'SCREENER';

export interface District {
  id: string;
  name: string;
  state: string;
}

export interface Hospital {
  id: string;
  name: string;
  districtId: string;
  type: 'GOVERNMENT' | 'PRIVATE' | 'CLINIC';
  contactPerson: string;
  phone: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  hospitalId?: string;
  avatarUrl?: string;
}

export interface RiskFactor {
  id: string;
  code: string;
  description: string;
}

export interface Child {
  id: string;
  hospitalNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  birthWeightGrams: number;
  gestationalAgeWeeks: number;
  hospitalOfBirthId: string;
  parentName: string;
  contactNumber: string;
  address: string;
  riskFactorIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Recommendation {
  id: string;
  text: string;
  type: 'IMMEDIATE_ACTION' | 'MONITOR' | 'ROUTINE';
}

export interface Screening {
  id: string;
  childId: string;
  hospitalId: string;
  screenerId: string;
  date: string;
  type: 'OAE' | 'AABR';
  leftEarResult: ScreeningResult;
  rightEarResult: ScreeningResult;
  overallResult: ScreeningResult;
  notes?: string;
  recommendationIds: string[];
}

export interface FollowUp {
  id: string;
  childId: string;
  hospitalId: string;
  providerId: string;
  scheduledDate: string;
  actualDate?: string;
  status: FollowUpStatus;
  notes?: string;
  nextSteps?: string;
}

export interface TimelineEvent {
  id: string;
  childId: string;
  date: string;
  type: 'REGISTRATION' | 'SCREENING' | 'FOLLOW_UP' | 'STATUS_CHANGE';
  title: string;
  description: string;
  referenceId?: string;
}
`;

files['src/components/ThemeProvider.tsx'] = `
import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
      return
    }
    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")
  return context
}
`;

files['src/hooks/useAuth.tsx'] = `
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { authService } from '../services/mockServices';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await authService.login(email, pass);
    setUser(res);
    localStorage.setItem('auth_user', JSON.stringify(res));
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
`;

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

export const mockChildren: Child[] = [
  {
    id: 'c1', hospitalNumber: 'HOS-001', firstName: 'Aarav', lastName: 'Patel',
    dateOfBirth: '2023-01-15T00:00:00Z', gender: 'MALE', birthWeightGrams: 3200, gestationalAgeWeeks: 39,
    hospitalOfBirthId: 'h1', parentName: 'Ravi Patel', contactNumber: '9998887776', address: '123 Main St, Mysuru',
    riskFactorIds: [], createdAt: '2023-01-16T00:00:00Z', updatedAt: '2023-01-16T00:00:00Z'
  }
];
`;

files['src/services/mockServices.ts'] = `
import { delay } from '../lib/utils';
import { mockUsers, mockChildren } from './mockData';
import type { User, Child } from '../types';

export const authService = {
  login: async (email: string, pass: string): Promise<User> => {
    await delay(800);
    if (email === 'admin@aiish.demo' && pass === 'password123') {
      return mockUsers[0];
    }
    throw new Error('Invalid credentials');
  },
  logout: async () => {
    await delay(300);
  }
};

export const childrenService = {
  list: async (): Promise<Child[]> => {
    await delay(500);
    return mockChildren;
  }
};
`;

files['src/components/layout/AppLayout.tsx'] = `
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../ThemeProvider';
import { Activity, Baby, Calendar, LayoutDashboard, LogOut, Settings, Hospital, Moon, Sun, User as UserIcon } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../ui/Button';

export function AppLayout() {
  const { user, isLoading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Children', path: '/children', icon: Baby },
    { label: 'Screenings', path: '/screenings', icon: Activity },
    { label: 'Follow-ups', path: '/follow-ups', icon: Calendar },
    { label: 'Hospitals', path: '/hospitals', icon: Hospital },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={\`\${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 border-r border-border bg-card flex flex-col\`}>
        <div className="h-16 flex items-center justify-center border-b border-border">
          <span className="font-bold text-primary truncate px-4">{sidebarOpen ? 'AIISH NHSMS' : 'NHSMS'}</span>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} className="flex items-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground group">
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span className="ml-3">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border flex items-center justify-center">
          <Button variant="ghost" onClick={() => setSidebarOpen(!sidebarOpen)}>Toggle</Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Navbar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
          <div className="text-sm text-muted-foreground">App &gt; {window.location.pathname.substring(1) || 'Dashboard'}</div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              <span className="text-sm font-medium">{user.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}><LogOut className="h-4 w-4 mr-2" /> Logout</Button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto p-6 bg-secondary/20">
          <Outlet />
        </main>
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

const DashboardPage = React.lazy(() => import('../features/dashboard/DashboardPage'));
const ChildrenPage = React.lazy(() => import('../features/children/ChildrenPage'));

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

files['src/features/auth/pages/LoginPage.tsx'] = `
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '../../../components/ui/Button';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@aiish.demo', password: 'password123' }
  });

  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (data: any) => {
    try {
      setError('');
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-lg border border-border">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-2">AIISH NHSMS</h1>
          <p className="text-muted-foreground text-sm">Sign in to your account</p>
        </div>
        
        {error && <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              {...register('email')} 
              className="w-full p-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
            />
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input 
              type="password"
              {...register('password')} 
              className="w-full p-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
            />
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message as string}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
`;

files['src/features/dashboard/DashboardPage.tsx'] = `
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <h3 className="text-muted-foreground text-sm font-medium">Total Screenings</h3>
          <p className="text-3xl font-bold mt-2">1,248</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <h3 className="text-muted-foreground text-sm font-medium">Follow-ups Pending</h3>
          <p className="text-3xl font-bold mt-2 text-primary">45</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <h3 className="text-muted-foreground text-sm font-medium">Active Hospitals</h3>
          <p className="text-3xl font-bold mt-2">12</p>
        </div>
      </div>
    </div>
  );
}
`;

files['src/features/children/ChildrenPage.tsx'] = `
export default function ChildrenPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Children Registry</h1>
      <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
        <p className="text-muted-foreground">List of children will go here...</p>
      </div>
    </div>
  );
}
`;

files['src/components/ui/Button.tsx'] = `
import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
            "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
`;

files['src/components/ui/Toaster.tsx'] = `
import { Toaster as Sonner } from "sonner"
import { useTheme } from "../ThemeProvider"

export function Toaster() {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme as "light" | "dark" | "system"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
    />
  )
}
`;


Object.entries(files).forEach(([filepath, content]) => {
  const fullPath = path.join(process.cwd(), filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim());
});

console.log("Phase 1 files generated successfully.");
