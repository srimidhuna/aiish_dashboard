import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  hospitalsService,
  childrenService,
  screeningsService,
  followUpsService,
  audiologistsService,
} from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatCard } from '../../components/shared/StatCard';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { EmptyState } from '../../components/shared/EmptyState';
import { DonutChart } from '../../components/shared/charts/DonutChart';
import { RESULT_COLORS, GENDER_COLORS } from '../../lib/chartColors';
import { Users, Activity, Percent, Clock, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { HospitalFormDialog } from './HospitalFormDialog';
import type { Child, FollowUp, Screening } from '../../types';

const TABS = ['Overview', 'Children', 'Screenings', 'Follow-ups', 'Analytics'] as const;
type Tab = (typeof TABS)[number];

export default function HospitalDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editOpen, setEditOpen] = useState(false);
  const activeTab = (searchParams.get('tab') as Tab) || 'Overview';
  const setActiveTab = (tab: Tab) => setSearchParams({ tab });

  const { data: hospital, isLoading: hLoading } = useQuery({
    queryKey: ['hospital', id],
    queryFn: () => hospitalsService.getById(id!),
  });
  const { data: allChildren, isLoading: cLoading } = useQuery({
    queryKey: ['children', 'all'],
    queryFn: () => childrenService.list(),
  });
  const { data: allScreenings, isLoading: sLoading } = useQuery({
    queryKey: ['screenings', 'all'],
    queryFn: () => screeningsService.list(),
  });
  const { data: allFollowUps, isLoading: fLoading } = useQuery({
    queryKey: ['followUps', 'all'],
    queryFn: () => followUpsService.list(),
  });
  const { data: audiologists } = useQuery({
    queryKey: ['audiologists', id],
    queryFn: () => audiologistsService.list(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => hospitalsService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      toast.success('Hospital deleted.');
      navigate('/hospitals');
    },
  });

  if (hLoading || cLoading || sLoading || fLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <Skeleton className="h-20 w-[300px]" />
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Skeleton className="h-[100px] w-full" />
          <Skeleton className="h-[100px] w-full" />
          <Skeleton className="h-[100px] w-full" />
          <Skeleton className="h-[100px] w-full" />
        </div>
      </div>
    );
  }
  if (!hospital)
    return <div className="p-8 text-center text-muted-foreground">Hospital not found</div>;

  const children: Child[] = allChildren?.filter((c) => c.hospitalOfBirthId === hospital.id) || [];
  const childIds = new Set(children.map((c) => c.id));
  const screenings: Screening[] =
    allScreenings?.filter((s) => childIds.has(s.childId) && s.status === 'completed') || [];
  const pendingFollowUps: FollowUp[] =
    allFollowUps?.filter(
      (f) => childIds.has(f.childId) && (f.status === 'scheduled' || f.status === 'rescheduled'),
    ) || [];
  const completedFollowUps: FollowUp[] =
    allFollowUps?.filter((f) => childIds.has(f.childId) && f.status === 'completed') || [];

  const referCount = screenings.filter((s) => s.overallResult === 'refer').length;
  const referralCount = referCount;

  const passVsRefer = [
    { name: 'PASS', value: screenings.filter((s) => s.overallResult === 'pass').length },
    { name: 'REFER', value: referCount },
  ];
  const genderDist = [
    { name: 'Male', value: children.filter((c) => c.gender === 'male').length },
    { name: 'Female', value: children.filter((c) => c.gender === 'female').length },
    {
      name: 'Other',
      value: children.filter((c) => c.gender !== 'male' && c.gender !== 'female').length,
    },
  ].filter((g) => g.value > 0);

  const getChildName = (childId: string) => {
    const child = children.find((c) => c.id === childId);
    return child ? `${child.firstName} ${child.lastName}` : 'Unknown';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{hospital.name}</h1>
          <p className="text-muted-foreground mt-2">
            {hospital.district}, {hospital.state} • {hospital.contactPerson}
            {hospital.contactPhone ? ` (${hospital.contactPhone})` : ''}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (window.confirm(`Delete ${hospital.name}? This cannot be undone.`)) {
                  deleteMutation.mutate();
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Children" value={children.length} icon={Users} />
        <StatCard label="Screenings Done" value={screenings.length} icon={Activity} />
        <StatCard label="Referrals" value={referralCount} icon={Percent} />
        <StatCard label="Pending Follow-ups" value={pendingFollowUps.length} icon={Clock} />
      </div>

      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'Overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Hospital Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{hospital.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">State</span>
                <span className="font-medium">{hospital.state}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">District</span>
                <span className="font-medium">{hospital.district}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Address</span>
                <span className="font-medium text-right">{hospital.address || '—'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Contact Person</span>
                <span className="font-medium">
                  {hospital.contactPerson || '—'}
                  {hospital.contactPhone ? ` (${hospital.contactPhone})` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge kind="screeningStatus" value={hospital.status} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audiologists</CardTitle>
            </CardHeader>
            <CardContent>
              {!audiologists || audiologists.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="No audiologists assigned" />
              ) : (
                <div className="space-y-2">
                  {audiologists.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <span className="font-medium text-sm">{a.name}</span>
                      <span className="text-xs text-muted-foreground">{a.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'Children' && (
        <div className="bg-card rounded-md border">
          {children.length === 0 ? (
            <EmptyState title="No children found" />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-2 whitespace-nowrap">Hosp. No</th>
                    <th className="px-4 py-2 whitespace-nowrap">Name</th>
                    <th className="px-4 py-2 whitespace-nowrap">DOB</th>
                  </tr>
                </thead>
                <tbody>
                  {children.map((c) => (
                    <tr key={c.id} className="border-b">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link to={`/children/${c.id}`} className="text-primary hover:underline">
                          {c.hospitalNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {c.firstName} {c.lastName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(c.dateOfBirth).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Screenings' && (
        <div className="bg-card rounded-md border">
          {screenings.length === 0 ? (
            <EmptyState title="No screenings found" />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-2 whitespace-nowrap">Date</th>
                    <th className="px-4 py-2 whitespace-nowrap">Patient</th>
                    <th className="px-4 py-2 whitespace-nowrap">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {screenings.map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(s.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          to={`/children/${s.childId}`}
                          className="text-primary hover:underline"
                        >
                          {getChildName(s.childId)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge kind="screeningResult" value={s.overallResult ?? 'pending'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Follow-ups' && (
        <div className="bg-card rounded-md border">
          {pendingFollowUps.length === 0 && completedFollowUps.length === 0 ? (
            <EmptyState title="No follow-ups found" />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-2 whitespace-nowrap">Scheduled Date</th>
                    <th className="px-4 py-2 whitespace-nowrap">Patient</th>
                    <th className="px-4 py-2 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...pendingFollowUps, ...completedFollowUps].map((f) => (
                    <tr key={f.id} className="border-b">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(f.scheduledDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          to={`/children/${f.childId}`}
                          className="text-primary hover:underline"
                        >
                          {getChildName(f.childId)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge kind="followUpStatus" value={f.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Analytics' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pass vs Refer</CardTitle>
            </CardHeader>
            <CardContent>
              {screenings.length > 0 ? (
                <DonutChart data={passVsRefer} colors={RESULT_COLORS} />
              ) : (
                <EmptyState title="No completed screenings yet" />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Gender Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {genderDist.length > 0 ? (
                <DonutChart data={genderDist} colors={GENDER_COLORS} />
              ) : (
                <EmptyState title="No children registered yet" />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <HospitalFormDialog
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        hospital={hospital}
      />
    </div>
  );
}
