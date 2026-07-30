import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  screeningsService,
  childrenService,
  hospitalsService,
  audiologistsService,
} from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/shared/StatCard';
import { DataTable, type DataTableColumn } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { LocationFilter, type LocationFilterValue } from '../../components/shared/LocationFilter';
import { EmptyState } from '../../components/shared/EmptyState';
import { formatAge } from '../../lib/utils';
import { getScreeningTypeLabel } from '../../lib/screening';
import { CalendarClock, CheckCircle2, FileEdit, ListChecks, Plus, Users } from 'lucide-react';
import type { Child, Screening, ScreeningStatus } from '../../types';

interface QueueRow {
  screening: Screening;
  child: Child;
}

export default function ScreeningQueuePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const status = (searchParams.get('status') as ScreeningStatus | null) ?? undefined;
  const location: LocationFilterValue = {
    state: searchParams.get('state') ?? undefined,
    districtId: searchParams.get('districtId') ?? undefined,
    hospitalId: searchParams.get('hospitalId') ?? undefined,
    audiologistId: searchParams.get('audiologistId') ?? undefined,
  };

  const updateParams = (patch: Record<string, string | undefined>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      return next;
    });
  };

  const { data: allScreenings, isLoading: sLoading } = useQuery({
    queryKey: ['screenings', 'queue', status, location],
    queryFn: () =>
      screeningsService.list({
        status,
        state: location.state,
        districtId: location.districtId,
        hospitalId: location.hospitalId,
        audiologistId: location.audiologistId,
      }),
  });

  const { data: children, isLoading: cLoading } = useQuery({
    queryKey: ['children', 'all'],
    queryFn: () => childrenService.list(),
  });

  const { data: hospitals } = useQuery({
    queryKey: ['hospitals', 'all'],
    queryFn: () => hospitalsService.list(),
  });

  const { data: audiologists } = useQuery({
    queryKey: ['audiologists', 'all'],
    queryFn: () => audiologistsService.list(),
  });

  const isLoading = sLoading || cLoading;

  const childMap = useMemo(() => {
    const map = new Map<string, Child>();
    children?.forEach((c) => map.set(c.id, c));
    return map;
  }, [children]);

  const hospitalMap = useMemo(() => {
    const map = new Map<string, { name: string }>();
    hospitals?.forEach((h) => map.set(h.id, h));
    return map;
  }, [hospitals]);

  const audiologistMap = useMemo(() => {
    const map = new Map<string, { name: string }>();
    audiologists?.forEach((a) => map.set(a.id, a));
    return map;
  }, [audiologists]);

  const rows: QueueRow[] = useMemo(() => {
    if (!allScreenings) return [];
    return allScreenings
      .map((screening) => {
        const child = childMap.get(screening.childId);
        return child ? { screening, child } : null;
      })
      .filter((r): r is QueueRow => r !== null);
  }, [allScreenings, childMap]);

  const todayStr = new Date().toISOString().split('T')[0];
  const completedToday = rows.filter(
    (r) => r.screening.status === 'completed' && r.screening.date.startsWith(todayStr),
  ).length;
  const pending = rows.filter((r) => r.screening.status === 'scheduled').length;
  const drafts = rows.filter((r) => r.screening.status === 'draft').length;
  const passed = rows.filter(
    (r) => r.screening.status === 'completed' && r.screening.overallResult === 'pass',
  ).length;
  const referred = rows.filter(
    (r) => r.screening.status === 'completed' && r.screening.overallResult === 'refer',
  ).length;

  const draftRows = rows.filter((r) => r.screening.status === 'draft');
  const recentRows = rows
    .filter((r) => r.screening.status === 'completed')
    .sort((a, b) => new Date(b.screening.date).getTime() - new Date(a.screening.date).getTime())
    .slice(0, 5);
  const todayScheduled = rows.filter(
    (r) => r.screening.status === 'scheduled' && (r.screening.dueDate || '').startsWith(todayStr),
  );

  const columns: DataTableColumn<QueueRow>[] = [
    { key: 'hospitalNumber', header: 'Hospital Number', render: (r) => r.child.hospitalNumber },
    {
      key: 'name',
      header: 'Child Name',
      render: (r) => `${r.child.firstName} ${r.child.lastName}`,
    },
    { key: 'age', header: 'Age', render: (r) => formatAge(r.child.dateOfBirth) },
    { key: 'gender', header: 'Gender', render: (r) => r.child.gender },
    { key: 'state', header: 'State', render: (r) => r.child.state || '—' },
    { key: 'district', header: 'District', render: (r) => r.child.district || '—' },
    {
      key: 'hospital',
      header: 'Hospital',
      render: (r) => hospitalMap.get(r.child.hospitalOfBirthId)?.name || '—',
    },
    {
      key: 'dueDate',
      header: 'Screening Due Date',
      render: (r) => new Date(r.screening.dueDate || r.screening.date).toLocaleDateString(),
    },
    {
      key: 'audiologist',
      header: 'Assigned Audiologist',
      render: (r) =>
        (r.screening.assignedAudiologistId &&
          audiologistMap.get(r.screening.assignedAudiologistId)?.name) ||
        '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge kind="screeningStatus" value={r.screening.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-2">
          {r.screening.status === 'draft' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                navigate(`/screenings/new?childId=${r.child.id}&draftId=${r.screening.id}`)
              }
            >
              Continue Draft
            </Button>
          )}
          {r.screening.status === 'scheduled' && (
            <Button
              size="sm"
              onClick={() =>
                navigate(`/screenings/new?childId=${r.child.id}&draftId=${r.screening.id}`)
              }
            >
              Start Screening
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => navigate(`/children/${r.child.id}`)}>
            View Child
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Screening Queue</h1>
        <Button onClick={() => navigate('/children')}>
          <Plus className="mr-2 h-4 w-4" /> New Screening
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Completed Today"
          value={completedToday}
          icon={CheckCircle2}
          loading={isLoading}
        />
        <StatCard label="Pending" value={pending} icon={CalendarClock} loading={isLoading} />
        <StatCard label="Draft" value={drafts} icon={FileEdit} loading={isLoading} />
        <StatCard label="Passed" value={passed} icon={ListChecks} loading={isLoading} />
        <StatCard
          label="Referred"
          value={referred}
          icon={Users}
          tone="danger"
          loading={isLoading}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <LocationFilter
          value={location}
          onChange={(v) =>
            updateParams({
              state: v.state,
              districtId: v.districtId,
              hospitalId: v.hospitalId,
              audiologistId: v.audiologistId,
            })
          }
          includeAudiologist
        />
        <select
          className="h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          value={status ?? ''}
          onChange={(e) => updateParams({ status: e.target.value || undefined })}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Screenings</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.screening.id}
            loading={isLoading}
            emptyTitle="No screenings match these filters"
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Draft Screenings</CardTitle>
          </CardHeader>
          <CardContent>
            {draftRows.length === 0 ? (
              <EmptyState icon={FileEdit} title="No drafts in progress" />
            ) : (
              <div className="space-y-3">
                {draftRows.map((r) => (
                  <div
                    key={r.screening.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
                    onClick={() =>
                      navigate(`/screenings/new?childId=${r.child.id}&draftId=${r.screening.id}`)
                    }
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {r.child.firstName} {r.child.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{r.child.hospitalNumber}</p>
                    </div>
                    <Button size="sm" variant="secondary">
                      Continue
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Screenings</CardTitle>
          </CardHeader>
          <CardContent>
            {recentRows.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No completed screenings yet" />
            ) : (
              <div className="space-y-3">
                {recentRows.map((r) => (
                  <div
                    key={r.screening.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/children/${r.child.id}?tab=Screening+History`)}
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {r.child.firstName} {r.child.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.screening.date).toLocaleDateString()} &bull;{' '}
                        {getScreeningTypeLabel(r.screening)}
                      </p>
                    </div>
                    <StatusBadge
                      kind="screeningResult"
                      value={r.screening.overallResult ?? 'pending'}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" /> Today&apos;s Scheduled Screenings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayScheduled.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Nothing scheduled for today" />
          ) : (
            <div className="space-y-3">
              {todayScheduled.map((r) => (
                <div
                  key={r.screening.id}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() =>
                    navigate(`/screenings/new?childId=${r.child.id}&draftId=${r.screening.id}`)
                  }
                >
                  <div>
                    <p className="font-medium text-sm">
                      {r.child.firstName} {r.child.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {hospitalMap.get(r.child.hospitalOfBirthId)?.name}
                    </p>
                  </div>
                  <Button size="sm">Start</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
