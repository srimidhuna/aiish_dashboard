import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { RoleGuard } from '../components/layout/RoleGuard';
import { LoginPage } from '../features/auth/pages/LoginPage';
import React, { Suspense } from 'react';
import { Skeleton } from '../components/ui/Skeleton';

const DashboardRouter = React.lazy(() => import('../features/dashboard/DashboardRouter'));
const ChildrenPage = React.lazy(() => import('../features/children/ChildrenPage'));
const RegisterChildPage = React.lazy(() => import('../features/children/RegisterChildPage'));
const ChildDetailsPage = React.lazy(() => import('../features/children/ChildDetailsPage'));
const ScreeningFormPage = React.lazy(() => import('../features/screenings/ScreeningFormPage'));
const ScreeningQueuePage = React.lazy(() => import('../features/screenings/ScreeningQueuePage'));
const HospitalsPage = React.lazy(() => import('../features/hospitals/HospitalsPage'));
const HospitalDetailsPage = React.lazy(() => import('../features/hospitals/HospitalDetailsPage'));
const ProfilePage = React.lazy(() => import('../features/profile/ProfilePage'));
const AnalyticsPage = React.lazy(() => import('../features/analytics/AnalyticsPage'));
const FollowUpsPage = React.lazy(() => import('../features/follow-ups/FollowUpsPage'));
const StaffPage = React.lazy(() => import('../features/staff/StaffPage'));
const ReScreeningPage = React.lazy(() => import('../features/rescreening/ReScreeningPage'));
const StartReScreeningPage = React.lazy(() => import('../features/rescreening/StartReScreeningPage'));

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

import { AuthProvider } from '../hooks/useAuth';

export const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
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
                <DashboardRouter />
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
            path: 'rescreening',
            element: (
              <SuspenseWrapper>
                <ReScreeningPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'rescreening/start/:id',
            element: (
              <SuspenseWrapper>
                <StartReScreeningPage />
              </SuspenseWrapper>
            ),
          },
          // ─── Admin-only routes ─────────────────────────────────────────────
          {
            path: 'hospitals',
            element: (
              <SuspenseWrapper>
                <RoleGuard allowedRoles={['admin']}>
                  <HospitalsPage />
                </RoleGuard>
              </SuspenseWrapper>
            ),
          },
          {
            path: 'hospitals/:id',
            element: (
              <SuspenseWrapper>
                <RoleGuard allowedRoles={['admin']}>
                  <HospitalDetailsPage />
                </RoleGuard>
              </SuspenseWrapper>
            ),
          },
          {
            path: 'analytics',
            element: (
              <SuspenseWrapper>
                <RoleGuard allowedRoles={['admin']}>
                  <AnalyticsPage />
                </RoleGuard>
              </SuspenseWrapper>
            ),
          },
          {
            path: 'follow-ups',
            element: (
              <SuspenseWrapper>
                <RoleGuard allowedRoles={['admin']}>
                  <FollowUpsPage />
                </RoleGuard>
              </SuspenseWrapper>
            ),
          },
          {
            path: 'staff',
            element: (
              <SuspenseWrapper>
                <RoleGuard allowedRoles={['admin']}>
                  <StaffPage />
                </RoleGuard>
              </SuspenseWrapper>
            ),
          },
          // ─── Shared routes ─────────────────────────────────────────────────
          {
            path: 'profile',
            element: (
              <SuspenseWrapper>
                <ProfilePage />
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
    ],
  },
]);
