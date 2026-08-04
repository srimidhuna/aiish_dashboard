import { useQuery } from '@tanstack/react-query';
import { screeningsService, childrenService, hospitalsService } from '../../services/api';
import type { Screening } from '../../types';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { EmptyState } from '../../components/shared/EmptyState';
import { useNavigate } from 'react-router-dom';

export default function ReScreeningPage() {
  const navigate = useNavigate();

  const { data: screenings, isLoading: isLoadingScreenings } = useQuery({
    queryKey: ['screenings', 'rescreening'],
    queryFn: () => screeningsService.list({ type: 'rescreening', status: 'scheduled' }),
  });

  const { data: children, isLoading: isLoadingChildren } = useQuery({
    queryKey: ['children'],
    queryFn: () => childrenService.list(),
  });

  const { data: hospitals, isLoading: isLoadingHospitals } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => hospitalsService.list(),
  });

  const isLoading = isLoadingScreenings || isLoadingChildren || isLoadingHospitals;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <h1 className="text-3xl font-bold tracking-tight">Re-Screening Queue</h1>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  const getChild = (childId: string) => children?.find((c) => c.id === childId);
  const getHospital = (hospitalId?: string) => hospitals?.find((h) => h.id === hospitalId);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Re-Screening Queue</h1>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {(!screenings || screenings.length === 0) ? (
          <EmptyState title="No pending re-screenings" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-4 font-semibold whitespace-nowrap">Hospital Number</th>
                  <th className="px-5 py-4 font-semibold whitespace-nowrap">Child Name</th>
                  <th className="px-5 py-4 font-semibold whitespace-nowrap">Gender</th>
                  <th className="px-5 py-4 font-semibold whitespace-nowrap">State / District</th>
                  <th className="px-5 py-4 font-semibold whitespace-nowrap">Hospital</th>
                  <th className="px-5 py-4 font-semibold whitespace-nowrap">Scheduled Date</th>
                  <th className="px-5 py-4 font-semibold whitespace-nowrap">Audiologist</th>
                  <th className="px-5 py-4 font-semibold whitespace-nowrap">Status</th>
                  <th className="px-5 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {screenings.map((s: Screening) => {
                  const child = getChild(s.childId);
                  const hospital = getHospital(child?.hospitalOfBirthId);
                  return (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4 font-medium">{child?.hospitalNumber || '-'}</td>
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {child?.firstName} {child?.lastName}
                      </td>
                      <td className="px-5 py-4 capitalize">{child?.gender || '-'}</td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {child?.state || '-'} / {child?.district || '-'}
                      </td>
                      <td className="px-5 py-4">
                        {hospital?.name || '-'}
                      </td>
                      <td className="px-5 py-4 font-medium text-foreground">
                        {s.dueDate ? new Date(s.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-5 py-4">
                        {s.assignedAudiologist?.fullName || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <StatusBadge kind="screeningStatus" value={s.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/rescreening/start/${s.id}`)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          Start Re-Screening
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
