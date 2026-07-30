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
const ScreeningQueuePage = React.lazy(() => import('../features/screenings/ScreeningQueuePage'));
const HospitalsPage = React.lazy(() => import('../features/hospitals/HospitalsPage'));
const HospitalDetailsPage = React.lazy(() => import('../features/hospitals/HospitalDetailsPage'));
const ProfilePage = React.lazy(() => import('../features/profile/ProfilePage'));
const AnalyticsPage = React.lazy(() => import('../features/analytics/AnalyticsPage'));
const SettingsPage = React.lazy(() => import('../features/settings/SettingsPage'));
const FollowUpsPage = React.lazy(() => import('../features/follow-ups/FollowUpsPage'));
const StaffPage = React.lazy(() => import('../features/staff/StaffPage'));

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    }
  >
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <SuspenseWrapper>
            <DashboardPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'children',
        element: (
          <SuspenseWrapper>
            <ChildrenPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'children/register',
        element: (
          <SuspenseWrapper>
            <RegisterChildPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'children/:id/edit',
        element: (
          <SuspenseWrapper>
            <RegisterChildPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'children/:id',
        element: (
          <SuspenseWrapper>
            <ChildDetailsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'screenings',
        element: (
          <SuspenseWrapper>
            <ScreeningQueuePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'screenings/new',
        element: (
          <SuspenseWrapper>
            <ScreeningFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'hospitals',
        element: (
          <SuspenseWrapper>
            <HospitalsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'hospitals/:id',
        element: (
          <SuspenseWrapper>
            <HospitalDetailsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'profile',
        element: (
          <SuspenseWrapper>
            <ProfilePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'analytics',
        element: (
          <SuspenseWrapper>
            <AnalyticsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'settings',
        element: (
          <SuspenseWrapper>
            <SettingsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'follow-ups',
        element: (
          <SuspenseWrapper>
            <FollowUpsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'staff',
        element: (
          <SuspenseWrapper>
            <StaffPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },
  {
    path: '*',
    element: (
      <div className="p-8 text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p>Page Not Found</p>
        <a href="/" className="text-primary mt-4 inline-block">
          Go Home
        </a>
      </div>
    ),
  },
]);
