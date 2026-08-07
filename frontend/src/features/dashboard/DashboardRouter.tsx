import { useAuth } from '../../hooks/useAuth';

import DashboardPage from './DashboardPage';
import StaffDashboardPage from './StaffDashboardPage';

/**
 * DashboardRouter — renders the correct dashboard based on the user's role.
 *
 * - admin  → full Admin Dashboard (existing DashboardPage)
 * - audiologist / doctor → Staff Dashboard (StaffDashboardPage)
 *
 * This keeps the existing DashboardPage completely unchanged while
 * adding the new staff-specific view.
 */
export default function DashboardRouter() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <DashboardPage />;
  }

  return <StaffDashboardPage />;
}
