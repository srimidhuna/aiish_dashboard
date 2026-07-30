import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { hospitalsService } from '../services/api';
import type { LocationFilterValue } from '../components/shared/LocationFilter';

/** Resolves the logged-in user's default state/district/hospital/audiologist assignment. */
export function useDefaultLocationFilters(): LocationFilterValue {
  const { user } = useAuth();

  const { data: hospital } = useQuery({
    queryKey: ['hospital', user?.hospitalId],
    queryFn: () => hospitalsService.getById(user!.hospitalId!),
    enabled: !!user?.hospitalId,
  });

  return useMemo(() => {
    if (!hospital) return {};
    return {
      state: hospital.state,
      districtId: hospital.districtId,
      hospitalId: hospital.id,
      audiologistId: user?.audiologistId,
    };
  }, [hospital, user?.audiologistId]);
}

/** Applies default filters to a URLSearchParams-backed filter object only when no filter is set yet. */
export function withLocationDefaults(
  current: LocationFilterValue,
  defaults: LocationFilterValue,
): LocationFilterValue {
  const hasAny = current.state || current.districtId || current.hospitalId || current.audiologistId;
  return hasAny ? current : defaults;
}
