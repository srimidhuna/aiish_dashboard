/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  childrenService,
  screeningsService,
  followUpsService,
  hospitalsService,
} from '../../services/api';

import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { toast } from 'sonner';
import { PatientSummaryCard } from '../../components/ui/PatientSummaryCard';
import { TimelineCard } from '../../components/ui/TimelineCard';
import { RiskFactorChecklist } from '../../components/forms/RiskFactorChecklist';
import { FollowUpDialog } from '../follow-ups/FollowUpDialog';
import { Skeleton } from '../../components/ui/Skeleton';
import { Inbox, FileText } from 'lucide-react';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { getScreeningTypeLabel } from '../../lib/screening';

export default function ChildDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Default to Screening History if coming back from screening form, else Overview
  const initialTab = new URLSearchParams(location.search).get('tab') || 'Overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);

  const { data: child, isLoading } = useQuery({
    queryKey: ['child', id],
    queryFn: () => childrenService.getById(id!),
  });

  const { data: screenings } = useQuery({
    queryKey: ['screenings', id],
    queryFn: () => screeningsService.getByChildId(id!),
  });

  const { data: followUps } = useQuery({
    queryKey: ['followUps', id],
    queryFn: () => followUpsService.getByChildId(id!),
  });

  const { data: timeline } = useQuery({
    queryKey: ['timeline', id],
    queryFn: () => childrenService.getTimeline(id!),
  });

  const deleteFollowUp = useMutation({
    mutationFn: (fId: string) => followUpsService.delete(fId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      toast.success('Follow-up deleted.');
    },
  });

  const { data: hospital } = useQuery({
    queryKey: ['hospital', child?.hospitalOfBirthId],
    queryFn: () => hospitalsService.getById(child!.hospitalOfBirthId),
    enabled: !!child,
  });





  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 pb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Child Records</h1>
        </div>
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }
  if (!child) return <div className="p-8 text-center text-destructive">Error loading child.</div>;

  const sortedScreenings = screenings
    ?.slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestScreening = sortedScreenings?.[0];
  const completedScreenings = sortedScreenings?.filter((s) => s.status === 'completed') ?? [];


  const TABS = [
    'Overview',
    'Screening History',
    'Follow-ups',
    'Timeline',
    'Documents',
    'Risk Factors',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Child Records</h1>
        <div className="space-x-2 print:hidden">
          <Button variant="outline" onClick={() => window.print()}>
            Print Summary
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/children/${id}/edit`)}>
            Edit Child
          </Button>
          <Button variant="destructive" onClick={() => toast.info('Delete not implemented yet.')}>
            Delete Child
          </Button>
          <Button onClick={() => navigate(`/screenings/new?childId=${id}`)}>New Screening</Button>
        </div>
      </div>

      <PatientSummaryCard child={child} latestScreening={latestScreening} />

      <div className="border-b">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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

      <div className="mt-6">
        {activeTab === 'Overview' && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Parent Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Mother&apos;s Name:</span>{' '}
                  <span>{child.motherName}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Father&apos;s Name:</span>{' '}
                  <span>{child.fatherName || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Contact:</span>{' '}
                  <span>{child.contactNumber || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Alternate Phone:</span>{' '}
                  <span>{child.phone2 || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Email:</span>{' '}
                  <span>{child.email || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Address:</span>{' '}
                  <span className="text-right w-1/2 break-words">{child.address || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Taluk:</span>{' '}
                  <span>{child.taluk || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">PIN Code:</span>{' '}
                  <span>{child.pinCode || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Parent District:</span>{' '}
                  <span>{child.parentDistrict || '—'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Parent State:</span>{' '}
                  <span>{child.parentState || '—'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Birth Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Date of Birth:</span>{' '}
                  <span>{child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Time of Birth:</span>{' '}
                  <span>{child.timeOfBirth || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Gender:</span>{' '}
                  <span className="capitalize">{child.gender}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Birth Weight:</span>{' '}
                  <span>{child.birthWeightGrams != null ? `${child.birthWeightGrams} g` : '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Gestational Age:</span>{' '}
                  <span>{child.gestationalAgeWeeks != null ? `${child.gestationalAgeWeeks} weeks` : '—'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Place of Birth:</span>{' '}
                  <span>{child.placeOfBirth || '—'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hospital & Care Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Hospital:</span>{' '}
                  <span>{hospital?.name || child.district || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">State:</span>{' '}
                  <span>{child.state || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">District:</span>{' '}
                  <span>{child.district || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Assessing Staff ID:</span>{' '}
                  <span className="font-mono">{child.assessingStaffEmployeeId || '—'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Assessing Staff Name:</span>{' '}
                  <span>{child.assessingStaffName || '—'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Socio-Demographics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Referred By:</span>{' '}
                  <span className="capitalize">{child.referredBy?.replace(/_/g, ' ') || '—'}</span>
                </div>
                {child.referredBy === 'others' && (
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Referred By (specify):</span>{' '}
                    <span>{child.referredByOther || '—'}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">NBS Centre:</span>{' '}
                  <span>{child.nbsCentre || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Region:</span>{' '}
                  <span className="capitalize">{child.region || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Socio-Economic Status:</span>{' '}
                  <span className="uppercase">{child.socioEconomicStatus || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Education Level:</span>{' '}
                  <span className="capitalize">{child.educationLevel?.replace(/_/g, ' ') || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Religion:</span>{' '}
                  <span className="capitalize">{child.religion || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Delivery Type:</span>{' '}
                  <span className="capitalize">{child.deliveryType || '—'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">No. of Siblings:</span>{' '}
                  <span>{child.noOfSiblings != null ? child.noOfSiblings : '—'}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Registration Info</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">MR / Hospital No.</p>
                  <p className="font-medium">{child.hospitalNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">POCD Number</p>
                  <p className="font-medium">{child.pocdNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Unique Mother ID</p>
                  <p className="font-medium font-mono">{child.uniqueMotherId || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Registered On</p>
                  <p className="font-medium">{child.createdAt ? new Date(child.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'Screening History' && (
          <Card>
            <CardHeader>
              <CardTitle>Screenings</CardTitle>
            </CardHeader>
            <CardContent>
              {completedScreenings.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <Inbox className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No screenings recorded yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedScreenings.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-col md:flex-row justify-between p-4 border rounded-md bg-muted/20"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-lg">{getScreeningTypeLabel(s)}</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(s.date).toLocaleString([], {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {s.remarks || 'No remarks'}
                        </p>
                      </div>
                      <div className="mt-2 md:mt-0 flex items-center">
                        <StatusBadge kind="screeningResult" value={s.overallResult ?? 'pending'} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'Follow-ups' && (
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Follow-ups</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setIsFollowUpDialogOpen(true)}>
                Schedule Manual Follow-up
              </Button>
            </CardHeader>
            <CardContent>
              {followUps?.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <Inbox className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No follow-ups recorded
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {followUps?.map((f) => (
                    <div
                      key={f.id}
                      className="flex justify-between items-center p-4 border rounded-md"
                    >
                      <div>
                        <div className="font-medium text-lg">
                          {new Date(f.scheduledDate).toLocaleDateString()}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {f.notes || 'No additional notes'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <StatusBadge kind="followUpStatus" value={f.status} />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => window.confirm('Delete?') && deleteFollowUp.mutate(f.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'Timeline' && (
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="pt-2">
                {timeline?.map((t) => (
                  <TimelineCard key={t.id} event={t} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'Documents' && (
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-md bg-muted/10">
                <FileText className="h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium">No documents uploaded yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload reports, consent forms, or other files here.
                </p>
                <Button variant="outline" className="mt-4">
                  Upload Document
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'Risk Factors' && (
          <Card>
            <CardHeader>
              <CardTitle>Risk Factors</CardTitle>
            </CardHeader>
            <CardContent>
              <RiskFactorChecklist selectedIds={child.riskFactorIds} readOnly />
            </CardContent>
          </Card>
        )}
      </div>

      <FollowUpDialog
        isOpen={isFollowUpDialogOpen}
        onClose={() => setIsFollowUpDialogOpen(false)}
        defaultChildId={id}
      />
    </div>
  );
}
