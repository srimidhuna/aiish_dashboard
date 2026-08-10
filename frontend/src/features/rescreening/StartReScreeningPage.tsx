import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { screeningsService, childrenService, followUpsService, mastersService, staffService } from '../../services/api';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/Button';
import { TestHeader } from '../../components/forms/TestHeader';
import { RiskFactorChecklist } from '../../components/forms/RiskFactorChecklist';
import { EarResultSelector } from '../../components/forms/EarResultSelector';
import { ChildOverviewCards } from '../../components/ui/ChildOverviewCards';
import { PatientSummaryCard } from '../../components/ui/PatientSummaryCard';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/Skeleton';

interface ReScreeningFormData {
  aabr2Right: string;
  aabr2Left: string;
  scheduleFollowUp: boolean;
  followUpDate: string;
  followUpNotes: string;
  provisionalDiagnosisRight?: string;
  provisionalDiagnosisLeft?: string;
  recommendationTypeIds?: string[];
  recommendationOther?: string;
  testedBy?: string;
}

export default function StartReScreeningPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<ReScreeningFormData>({
    defaultValues: {
      aabr2Right: '',
      aabr2Left: '',
      scheduleFollowUp: true,
      followUpDate: '',
      followUpNotes: 'Re-Screening failed. Diagnostic Evaluation Required.',
    }
  });

  const { data: screening, isLoading: isScreeningLoading } = useQuery({
    queryKey: ['screenings', id],
    queryFn: () => screeningsService.getById(id!),
    enabled: !!id,
  });

  const { data: child, isLoading: isChildLoading } = useQuery({
    queryKey: ['children', screening?.childId],
    queryFn: () => childrenService.getById(screening!.childId),
    enabled: !!screening?.childId,
  });

  const { data: pastScreenings } = useQuery({
    queryKey: ['screenings', 'history', screening?.childId],
    queryFn: () => screeningsService.getByChildId(screening!.childId),
    enabled: !!screening?.childId,
  });

  const hasRiskFactor = child ? (
    (child.riskFactorIds && child.riskFactorIds.length > 0) ||
    child.assessment?.familyHistoryHearingLoss ||
    (child.assessment?.consanguinityDegree !== undefined)
  ) : false;

  const { data: recommendationTypes } = useQuery({
    queryKey: ['recommendationTypes'],
    queryFn: () => mastersService.listRecommendationTypes(),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffService.list(),
  });

  const mutation = useMutation({
    mutationFn: async (data: ReScreeningFormData) => {
      if (!screening) throw new Error('Screening not loaded');

      const isPass = data.aabr2Right === 'pass' && data.aabr2Left === 'pass';
      
      await screeningsService.update(screening.id, {
        status: 'completed',
        aabr2Right: data.aabr2Right as any,
        aabr2Left: data.aabr2Left as any,
        overallResult: isPass ? 'pass' : 'refer',
      });

      if (!isPass && data.scheduleFollowUp && data.followUpDate) {
        // Create Follow Up
        let finalNotes = data.followUpNotes || 'Re-Screening failed. Diagnostic Evaluation Required.';
        if (data.recommendationOther) {
          finalNotes += `\nOther Recommendations: ${data.recommendationOther}`;
        }
        if (data.testedBy) {
          finalNotes += `\nTested by: ${data.testedBy}`;
        }

        await followUpsService.create({
          childId: screening.childId,
          followUpType: 'regular',
          scheduledDate: new Date(data.followUpDate).toISOString(),
          notes: finalNotes,
          provisionalDiagnosisRight: data.provisionalDiagnosisRight,
          provisionalDiagnosisLeft: data.provisionalDiagnosisLeft,
          recommendationTypeIds: data.recommendationTypeIds,
        });

        // Update Baby Status
        await childrenService.update(screening.childId, {
          status: 'follow_up_required'
        } as any);
      } else if (!isPass) {
        // Just update status if they chose not to schedule follow up right now
        await childrenService.update(screening.childId, {
          status: 'follow_up_required'
        } as any);
      }

      return { isPass, childId: screening.childId };
    },
    onSuccess: ({ isPass, childId }) => {
      queryClient.invalidateQueries({ queryKey: ['screenings'] });
      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });

      if (isPass) {
        toast.success('Re-Screening completed successfully. Child Passed.');
      } else {
        toast.error('Re-Screening Failed. Child referred for Diagnostic Evaluation.');
      }

      navigate(`/children/${childId}`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit re-screening.';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  });

  const onSubmit = (data: ReScreeningFormData) => {
    if (!data.aabr2Right || !data.aabr2Left) {
      toast.error('Please enter results for both ears.');
      return;
    }
    const isPass = data.aabr2Right === 'pass' && data.aabr2Left === 'pass';
    if (!isPass && data.scheduleFollowUp && !data.followUpDate) {
      toast.error('Please select a follow-up date.');
      return;
    }
    mutation.mutate(data);
  };

  const aabr2R = watch('aabr2Right');
  const aabr2L = watch('aabr2Left');
  const scheduleFollowUp = watch('scheduleFollowUp');
  const isComplete = aabr2R && aabr2L;
  const isPass = aabr2R === 'pass' && aabr2L === 'pass';
  const isRefer = isComplete && !isPass;

  if (isScreeningLoading || isChildLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
        <h1 className="text-3xl font-bold tracking-tight">Perform Re-Screening</h1>
      </div>

      {child && (
        <div className="mb-6 space-y-6">
          <PatientSummaryCard child={child} latestScreening={screening} />
          <ChildOverviewCards child={child} />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">High-Risk Register (HRR)</h2>
                {hasRiskFactor ? (
                  <span className="inline-flex items-center gap-1 font-semibold px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-sm">
                    HRR Positive
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm">
                    No HRR Findings
                  </span>
                )}
              </div>
              
              {hasRiskFactor && (
                <div className="pt-2 border-t">
                  <RiskFactorChecklist selectedIds={child?.riskFactorIds || []} readOnly>
                    {child?.assessment?.familyHistoryHearingLoss && (
                      <div className="flex items-start space-x-3">
                        <input type="checkbox" checked readOnly className="mt-1 h-4 w-4 shrink-0 rounded border-input text-primary focus:ring-primary opacity-70" />
                        <label className="text-sm font-medium leading-none opacity-90">Family history of early/progressive/delayed hearing loss</label>
                      </div>
                    )}
                    {child?.assessment?.consanguinityDegree !== undefined && (
                      <div className="flex items-start space-x-3">
                        <input type="checkbox" checked readOnly className="mt-1 h-4 w-4 shrink-0 rounded border-input text-primary focus:ring-primary opacity-70" />
                        <label className="text-sm font-medium leading-none mt-1 opacity-90">
                          Consanguinity: {child.assessment.consanguinityDegree === 'first' ? '1st Degree' : child.assessment.consanguinityDegree === 'second' ? '2nd Degree' : '3rd Degree'}
                        </label>
                      </div>
                    )}
                  </RiskFactorChecklist>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Previous Screening Results</h2>
              {pastScreenings && pastScreenings.filter(s => s.id !== id && s.status === 'completed').length > 0 ? (
                <div className="space-y-6">
                  {pastScreenings
                    .filter(s => s.id !== id && s.status === 'completed')
                    .map(s => (
                      <div key={s.id} className="pb-4 border-b last:border-0 last:pb-0">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <p className="font-semibold text-lg capitalize">{s.type === 'initial' ? 'Initial Screening' : s.type}</p>
                            <p className="text-sm text-muted-foreground">{new Date(s.date).toLocaleDateString()}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 font-semibold px-3 py-1 rounded-full text-sm ${
                            s.overallResult === 'pass' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 border' 
                              : 'bg-red-50 text-red-600 border-red-200 border'
                          }`}>
                            {s.overallResult?.toUpperCase() || 'REFER'}
                          </span>
                        </div>
                        
                        <div className="bg-muted/30 rounded-lg p-4 space-y-3 text-sm">
                          {s.boaResult && (
                            <div className="flex justify-between py-1 border-b border-border/50">
                              <span className="text-muted-foreground">BOA Result:</span>
                              <span className="font-medium uppercase">{s.boaResult}</span>
                            </div>
                          )}
                          
                          {(s.teoaeRight || s.teoaeLeft) && (
                            <div className="flex justify-between py-1 border-b border-border/50">
                              <span className="text-muted-foreground">TEOAE:</span>
                              <span className="font-medium space-x-2">
                                {s.teoaeRight && <span>R: <span className="uppercase">{s.teoaeRight}</span></span>}
                                {s.teoaeLeft && <span>L: <span className="uppercase">{s.teoaeLeft}</span></span>}
                              </span>
                            </div>
                          )}
                          
                          {(s.dpoaeRight || s.dpoaeLeft) && (
                            <div className="flex justify-between py-1 border-b border-border/50">
                              <span className="text-muted-foreground">DPOAE:</span>
                              <span className="font-medium space-x-2">
                                {s.dpoaeRight && <span>R: <span className="uppercase">{s.dpoaeRight}</span></span>}
                                {s.dpoaeLeft && <span>L: <span className="uppercase">{s.dpoaeLeft}</span></span>}
                              </span>
                            </div>
                          )}
                          
                          {(s.aabr1Right || s.aabr1Left) && (
                            <div className="flex justify-between py-1">
                              <span className="text-muted-foreground">AABR - 1st Screening:</span>
                              <span className="font-medium space-x-2">
                                {s.aabr1Right && <span>R: <span className="uppercase">{s.aabr1Right}</span></span>}
                                {s.aabr1Left && <span>L: <span className="uppercase">{s.aabr1Left}</span></span>}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No previous completed screenings found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-orange-200/50 dark:border-orange-900/30 bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-orange-200/50 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-900/10">
            <TestHeader
              step={1}
              title="AABR — 2nd Screening (Final)"
              status={!isComplete ? 'active' : isPass ? 'pass' : 'fail'}
            />
            <p className="text-[11px] text-orange-600 mt-1">
              ⚠️ This is the final test in the cascade. If any ear fails, a follow-up visit must be scheduled.
            </p>
          </div>
          <div className="px-5 py-4 grid grid-cols-6 gap-4">
            <div className="col-span-3">
              <EarResultSelector
                register={register}
                name="aabr2Right"
                label="Right Ear"
                options={['pass', 'refer', 'cnt', 'not_done']}
              />
            </div>
            <div className="col-span-3">
              <EarResultSelector
                register={register}
                name="aabr2Left"
                label="Left Ear"
                options={['pass', 'refer', 'cnt', 'not_done']}
              />
            </div>
          </div>
        </div>

        {isRefer && (
          <div className="rounded-xl border border-red-200 bg-red-50/30 p-6 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between border-b border-red-200 pb-3">
              <h3 className="text-lg font-semibold text-red-800">Schedule Diagnostic Evaluation</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="scheduleFollowUp"
                  {...register('scheduleFollowUp')}
                  className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="scheduleFollowUp" className="text-sm font-medium text-red-900">
                  Schedule Now
                </label>
              </div>
            </div>

            {scheduleFollowUp && (
              <div className="grid gap-4 md:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-red-900">Follow-up Date</label>
                  <input
                    type="date"
                    {...register('followUpDate')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-red-900">Notes (Optional)</label>
                  <input
                    type="text"
                    {...register('followUpNotes')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            )}
          </div>
        )}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-2">
            <h3 className="text-lg font-semibold border-b pb-2">Provisional Diagnosis & Recommendations</h3>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Provisional Diagnosis : Right Ear</label>
                <input
                  type="text"
                  {...register('provisionalDiagnosisRight')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Provisional Diagnosis : Left Ear</label>
                <input
                  type="text"
                  {...register('provisionalDiagnosisLeft')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Recommendation</label>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {recommendationTypes?.map((rec) => (
                  <div key={rec.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`rec-${rec.id}`}
                      value={rec.id}
                      {...register('recommendationTypeIds')}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor={`rec-${rec.id}`} className="text-sm font-medium leading-none">
                      {rec.label}
                    </label>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <label className="text-sm font-medium">Others (Specify)</label>
                <input
                  type="text"
                  {...register('recommendationOther')}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Specify other recommendations"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 pt-4 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tested By</label>
                <select
                  {...register('testedBy')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">-- Select Staff --</option>
                  {staffList.filter((s) => s.status !== 'deleted').map((s) => (
                    <option key={s.id} value={s.fullName}>
                      {s.employeeId} — {s.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting || !isComplete} className="px-8">
            {isSubmitting ? 'Saving...' : 'Submit Re-Screening Results'}
          </Button>
        </div>
      </form>
    </div>
  );
}
