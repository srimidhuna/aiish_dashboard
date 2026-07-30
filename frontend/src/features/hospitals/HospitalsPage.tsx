import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { hospitalsService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  Building,
  Users,
  Activity,
  Clock,
  Users2,
  Search,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { LocationFilter, type LocationFilterValue } from '../../components/shared/LocationFilter';
import { HospitalFormDialog } from './HospitalFormDialog';
import { toast } from 'sonner';
import type { Hospital } from '../../types';

export default function HospitalsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | undefined>(undefined);

  const search = searchParams.get('search') ?? '';
  const location: LocationFilterValue = {
    state: searchParams.get('state') ?? undefined,
    districtId: searchParams.get('districtId') ?? undefined,
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

  const { data: hospitals, isLoading } = useQuery({
    queryKey: ['hospitals', 'list', search, location.state, location.districtId],
    queryFn: () =>
      hospitalsService.list({ search, state: location.state, districtId: location.districtId }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hospitalsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      toast.success('Hospital deleted.');
    },
  });

  const openCreate = () => {
    setEditingHospital(undefined);
    setDialogOpen(true);
  };
  const openEdit = (h: Hospital) => {
    setEditingHospital(h);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Hospitals Directory</h1>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Hospital
          </Button>
        )}
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search hospitals..."
            className="pl-9"
            value={search}
            onChange={(e) => updateParams({ search: e.target.value || undefined })}
          />
        </div>
        <LocationFilter
          value={location}
          onChange={(v) => updateParams({ state: v.state, districtId: v.districtId })}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      ) : hospitals && hospitals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hospitals.map((h) => (
            <Card
              key={h.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/hospitals/${h.id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-base font-bold">{h.name}</CardTitle>
                <div className="flex items-center gap-1">
                  {isAdmin && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(h);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete ${h.name}? This cannot be undone.`)) {
                            deleteMutation.mutate(h.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Building className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  {h.district}, {h.state} &bull; {h.status}
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="block text-muted-foreground text-xs">Children</span>
                      <span className="font-bold">{h.stats?.totalChildren ?? 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="block text-muted-foreground text-xs">Screenings</span>
                      <span className="font-bold">{h.stats?.totalScreenings ?? 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                     <Users2 className="w-4 h-4 text-muted-foreground" />
                     <div>
                       <span className="block text-muted-foreground text-xs">Referrals</span>
                       <span className="font-bold">{h.stats?.referralCount ?? 0}</span>
                     </div>
                   </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="block text-muted-foreground text-xs">
                        Pending Follow-ups
                      </span>
                      <span className="font-bold">{h.stats?.pendingFollowUps ?? 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-md bg-card">
          <EmptyState title="No hospitals found" description="Try adjusting your filters." />
        </div>
      )}

      <HospitalFormDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        hospital={editingHospital}
      />
    </div>
  );
}
