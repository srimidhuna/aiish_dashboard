/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { followUpsService, childrenService } from '../../services/api';
import type { FollowUp } from '../../types';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

import { FollowUpDialog } from './FollowUpDialog';
import { ChildDetailsDialog } from './ChildDetailsDialog';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { EmptyState } from '../../components/shared/EmptyState';

export default function FollowUpsPage() {
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Completed' | 'Missed' | 'Message' | 'Call'>(
    'Upcoming',
  );
  
  const [filterRange, setFilterRange] = useState<'all' | 'today' | 'this_week' | 'next_week' | 'this_month' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>('');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<any>(null);

  const [childDetailsOpen, setChildDetailsOpen] = useState(false);
  const [selectedChildForDetails, setSelectedChildForDetails] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data: followUps, isLoading } = useQuery({
    queryKey: ['followUps', 'all'],
    queryFn: () => followUpsService.list(),
  });

  const { data: children } = useQuery({
    queryKey: ['children'],
    queryFn: () => childrenService.list(),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FollowUp['status'] }) =>
      followUpsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      toast.success('Status updated.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => followUpsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      toast.success('Follow-up deleted.');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <h1 className="text-3xl font-bold tracking-tight">Follow-ups Management</h1>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  const getChild = (childId: string) => children?.find((c) => c.id === childId);

  const filteredFollowUps = followUps
    ?.filter((f: FollowUp) => {
      const fDate = new Date(f.scheduledDate);
      fDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPast = fDate.getTime() < today.getTime();

      if (activeTab === 'Upcoming') {
        return (f.status === 'scheduled' || f.status === 'rescheduled') && !isPast;
      }
      if (activeTab === 'Completed') return f.status === 'completed';
      if (activeTab === 'Missed') {
        return f.status === 'missed' || f.status === 'lost_to_followup' || ((f.status === 'scheduled' || f.status === 'rescheduled') && isPast);
      }
      
      const child = getChild(f.childId);
      if (activeTab === 'Message') return !!child?.whatsappNumber;
      if (activeTab === 'Call') return !child?.whatsappNumber;

      return true;
    })
    .filter((f: FollowUp) => {
      if (filterRange === 'all') return true;

      const fDate = new Date(f.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      
      const fDateStart = new Date(fDate);
      fDateStart.setHours(0, 0, 0, 0);

      if (filterRange === 'custom') {
        if (!customDate) return true;
        const cDate = new Date(customDate);
        return (
          fDate.getFullYear() === cDate.getFullYear() &&
          fDate.getMonth() === cDate.getMonth() &&
          fDate.getDate() === cDate.getDate()
        );
      }
      
      if (filterRange === 'today') {
        return fDateStart.getTime() === today.getTime();
      }

      if (filterRange === 'this_month') {
        return (
          fDate.getFullYear() === today.getFullYear() &&
          fDate.getMonth() === today.getMonth()
        );
      }

      const currentDay = today.getDay();
      const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
      
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - distanceToMonday);
      
      const thisWeekEnd = new Date(thisWeekStart);
      thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
      
      const nextWeekStart = new Date(thisWeekEnd);
      nextWeekStart.setDate(thisWeekEnd.getDate() + 1);
      
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

      if (filterRange === 'this_week') {
        return fDateStart >= thisWeekStart && fDateStart <= thisWeekEnd;
      }

      if (filterRange === 'next_week') {
        return fDateStart >= nextWeekStart && fDateStart <= nextWeekEnd;
      }

      return true;
    })
    .sort(
      (a: FollowUp, b: FollowUp) =>
        new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime(),
    );

  const openEditDialog = (f: any) => {
    setSelectedFollowUp(f);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedFollowUp(null);
    setDialogOpen(true);
  };

  const downloadCSV = () => {
    if (!filteredFollowUps || filteredFollowUps.length === 0) {
      toast.error('No data to download.');
      return;
    }

    const headers = [
      'Scheduled Date',
      'Patient',
      'Mother\'s Name',
      'Phone Number',
      'WhatsApp',
      'Email',
      'Registration Date',
      'Remarks',
      'Status'
    ];

    const csvRows = [headers.join(',')];

    for (const f of filteredFollowUps) {
      const child = getChild(f.childId);
      const row = [
        new Date(f.scheduledDate).toLocaleDateString(),
        child ? `"${child.firstName} ${child.lastName}"` : 'Unknown Child',
        `"${child?.motherName || '-'}"`,
        `"\t${child?.contactNumber || child?.phone2 || '-'}"`,
        `"\t${child?.whatsappNumber || '-'}"`,
        `"${child?.email || '-'}"`,
        child?.createdAt ? new Date(child.createdAt).toLocaleDateString() : '-',
        `"${(f.notes || '-').replace(/"/g, '""')}"`,
        f.status
      ];
      csvRows.push(row.join(','));
    }

    const blob = new Blob(['\uFEFF', csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `follow_ups_${activeTab.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Follow-ups Management</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={downloadCSV}>Download CSV</Button>
          <Button onClick={openCreateDialog}>Schedule Follow-up</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 items-end sm:items-center">
        <div className="border-b flex-grow w-full">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {['Upcoming', 'Completed', 'Missed', 'Message', 'Call'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`
                  whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center space-x-2 pb-2 w-full sm:w-auto">
          <label htmlFor="dateRangeFilter" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Filter by Date:
          </label>
          <select
            id="dateRangeFilter"
            value={filterRange}
            onChange={(e) => setFilterRange(e.target.value as any)}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="next_week">Next Week</option>
            <option value="this_month">This Month</option>
            <option value="custom">Custom Date</option>
          </select>
          
          {filterRange === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="flex h-9 w-full sm:w-auto rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          )}
        </div>
      </div>

      <div className="bg-card rounded-md border">
        {filteredFollowUps?.length === 0 ? (
          <EmptyState title={`No ${activeTab.toLowerCase()} follow-ups${filterRange !== 'all' ? ' for this period' : ''}`} />
        ) : (
          <div className="w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium">Scheduled Date</th>
                  <th className="px-6 py-3 font-medium">Patient</th>
                  <th className="px-6 py-3 font-medium">Mother's Name</th>
                  <th className="px-6 py-3 font-medium">Phone Number</th>
                  <th className="px-6 py-3 font-medium">WhatsApp</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Registration Date</th>
                  <th className="px-6 py-3 font-medium">Remarks</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFollowUps?.map((f) => {
                  const child = getChild(f.childId);
                  return (
                    <tr key={f.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-4 font-medium whitespace-nowrap">
                        {new Date(f.scheduledDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            if (child) {
                              setSelectedChildForDetails(child);
                              setChildDetailsOpen(true);
                            }
                          }}
                          className="text-primary hover:underline font-medium text-left"
                        >
                          {child ? `${child.firstName} ${child.lastName}` : 'Unknown Child'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {child?.motherName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {child?.contactNumber || child?.phone2 || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {child?.whatsappNumber || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {child?.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {child?.createdAt ? new Date(child.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={f.notes}>
                        {f.notes || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge kind="followUpStatus" value={f.status} />
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        {(f.status === 'scheduled' || f.status === 'rescheduled') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus.mutate({ id: f.id, status: 'completed' })}
                          >
                            Complete
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openEditDialog(f)}
                          disabled={followUps?.some(x => x.childId === f.childId && x.status === 'rescheduled')}
                          title={followUps?.some(x => x.childId === f.childId && x.status === 'rescheduled') ? 'Already rescheduled once' : ''}
                        >
                          Reschedule Visit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            window.confirm('Delete this follow-up?') && deleteMutation.mutate(f.id)
                          }
                        >
                          Delete
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

      <FollowUpDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initialData={selectedFollowUp}
      />

      <ChildDetailsDialog
        isOpen={childDetailsOpen}
        onClose={() => setChildDetailsOpen(false)}
        child={selectedChildForDetails}
      />
    </div>
  );
}
