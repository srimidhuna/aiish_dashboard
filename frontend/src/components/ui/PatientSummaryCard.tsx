import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from './Card';
import { StatusBadge } from '../shared/StatusBadge';
import { Child, Screening } from '../../types';
import { formatAge } from '../../lib/utils';
import { hospitalsService, audiologistsService } from '../../services/api';

interface PatientSummaryCardProps {
  child: Child;
  latestScreening?: Screening;
}

export function PatientSummaryCard({ child, latestScreening }: PatientSummaryCardProps) {
  const { data: hospital } = useQuery({
    queryKey: ['hospital', child.hospitalOfBirthId],
    queryFn: () => hospitalsService.getById(child.hospitalOfBirthId),
  });

  const { data: audiologists } = useQuery({
    queryKey: ['audiologists', child.hospitalOfBirthId],
    queryFn: () => audiologistsService.list(child.hospitalOfBirthId),
    enabled: !!latestScreening?.assignedAudiologistId,
  });
  const audiologist = audiologists?.find((a) => a.id === latestScreening?.assignedAudiologistId);

  const status =
    latestScreening?.status === 'completed'
      ? (latestScreening.overallResult ?? 'pending')
      : (latestScreening?.status ?? 'pending');

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {child.firstName} {child.lastName}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Hosp No: {child.hospitalNumber} &bull; {child.gender} &bull;{' '}
            {formatAge(child.dateOfBirth)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {child.district || '—'}, {child.state || '—'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">Hospital</p>
            <p className="text-sm text-muted-foreground">{hospital?.name || 'Unknown'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Audiologist</p>
            <p className="text-sm text-muted-foreground">{audiologist?.name || 'Unassigned'}</p>
          </div>
          <StatusBadge kind="screeningResult" value={status} />
        </div>
      </CardContent>
    </Card>
  );
}
