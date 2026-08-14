import type { Child } from '../../types';
import { Button } from '../../components/ui/Button';
import { PatientSummaryCard } from '../../components/ui/PatientSummaryCard';
import { ChildOverviewCards } from '../../components/ui/ChildOverviewCards';
import { RiskFactorChecklist } from '../../components/forms/RiskFactorChecklist';
import { useQuery } from '@tanstack/react-query';
import { screeningsService, followUpsService } from '../../services/api';
import { X } from 'lucide-react';

interface ChildDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  child: Child | null;
}

export function ChildDetailsDialog({ isOpen, onClose, child }: ChildDetailsDialogProps) {
  const { data: pastScreenings } = useQuery({
    queryKey: ['screenings', 'history', child?.id],
    queryFn: () => screeningsService.getByChildId(child!.id),
    enabled: !!child?.id && isOpen,
  });

  const { data: followUps } = useQuery({
    queryKey: ['followUps', 'child', child?.id],
    queryFn: () => followUpsService.getByChildId(child!.id),
    enabled: !!child?.id && isOpen,
  });

  if (!isOpen || !child) return null;

  const hasRiskFactor =
    (child.riskFactorIds && child.riskFactorIds.length > 0) ||
    child.assessment?.familyHistoryHearingLoss ||
    (child.assessment?.consanguinityDegree !== undefined);

  const completedScreenings = pastScreenings
    ?.filter(s => s.status === 'completed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) ?? [];

  const latestFollowUp = followUps
    ?.slice()
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl rounded-xl border bg-slate-50 shadow-lg max-h-[95vh] overflow-y-auto relative flex flex-col">
        <div className="sticky top-0 z-10 flex justify-end p-2 bg-slate-50/80 backdrop-blur-sm border-b">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full bg-white shadow-sm border">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <PatientSummaryCard child={child} latestScreening={pastScreenings?.[0]} />
          <ChildOverviewCards child={child} />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm h-fit">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">High-Risk Register (HRR)</h2>
                {hasRiskFactor ? (
                  <span className="inline-flex items-center gap-1 font-semibold px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-sm">HRR Positive</span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm">No HRR Findings</span>
                )}
              </div>
              {hasRiskFactor && (
                <div className="pt-2 border-t">
                  <RiskFactorChecklist selectedIds={child?.riskFactorIds || []} readOnly>
                    {child?.assessment?.familyHistoryHearingLoss && (
                      <div className="flex items-start space-x-3 mt-2">
                        <input type="checkbox" checked readOnly className="mt-1 h-4 w-4 shrink-0 rounded border-input text-primary focus:ring-primary opacity-70" />
                        <label className="text-sm font-medium leading-none opacity-90">Family history of early/progressive/delayed hearing loss</label>
                      </div>
                    )}
                    {child?.assessment?.consanguinityDegree !== undefined && (
                      <div className="flex items-start space-x-3 mt-2">
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
              <h2 className="text-xl font-semibold mb-4">Screening History</h2>
              {completedScreenings.length > 0 ? (
                <div className="space-y-6">
                  {completedScreenings.map((s, idx) => (
                    <div key={s.id} className="pb-4 border-b last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="font-semibold text-base">
                            {s.type === 'initial' ? 'Initial Screening' : 'Re-Screening'}
                            <span className="ml-2 text-xs font-normal text-muted-foreground">#{idx + 1}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">{new Date(s.date).toLocaleDateString()}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 font-semibold px-3 py-1 rounded-full text-sm ${s.overallResult === 'pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 border' : 'bg-red-50 text-red-600 border-red-200 border'}`}>
                          {s.overallResult?.toUpperCase() || 'REFER'}
                        </span>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
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
                          <div className="flex justify-between py-1 border-b border-border/50">
                            <span className="text-muted-foreground">AABR — 1st Screen:</span>
                            <span className="font-medium space-x-2">
                              {s.aabr1Right && <span>R: <span className="uppercase">{s.aabr1Right}</span></span>}
                              {s.aabr1Left && <span>L: <span className="uppercase">{s.aabr1Left}</span></span>}
                            </span>
                          </div>
                        )}
                        {(s.aabr2Right || s.aabr2Left) && (
                          <div className="flex justify-between py-1 border-b border-border/50">
                            <span className="text-muted-foreground">AABR — Re-Screen:</span>
                            <span className="font-medium space-x-2">
                              {s.aabr2Right && <span>R: <span className="uppercase">{s.aabr2Right}</span></span>}
                              {s.aabr2Left && <span>L: <span className="uppercase">{s.aabr2Left}</span></span>}
                            </span>
                          </div>
                        )}
                        {s.remarks && (
                          <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">Remarks:</span>
                            <span className="font-medium text-right max-w-[60%]">{s.remarks}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No completed screenings found.</p>
              )}
            </div>
          </div>

          {latestFollowUp && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-6 space-y-4">
              <h2 className="text-xl font-semibold border-b border-amber-200 pb-2">Diagnostic Evaluation Details</h2>
              <div className="grid gap-4 md:grid-cols-2 text-sm">
                {latestFollowUp.provisionalDiagnosisRight && (
                  <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
                    <p className="text-muted-foreground text-xs font-medium mb-1 uppercase tracking-wide">Provisional Diagnosis — Right Ear</p>
                    <p className="font-semibold">{latestFollowUp.provisionalDiagnosisRight}</p>
                  </div>
                )}
                {latestFollowUp.provisionalDiagnosisLeft && (
                  <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
                    <p className="text-muted-foreground text-xs font-medium mb-1 uppercase tracking-wide">Provisional Diagnosis — Left Ear</p>
                    <p className="font-semibold">{latestFollowUp.provisionalDiagnosisLeft}</p>
                  </div>
                )}
                {latestFollowUp.notes && (
                  <div className="bg-white rounded-lg p-4 border border-border shadow-sm md:col-span-2">
                    <p className="text-muted-foreground text-xs font-medium mb-1 uppercase tracking-wide">Clinical Notes / Recommendations</p>
                    <p className="font-medium whitespace-pre-line">{latestFollowUp.notes}</p>
                  </div>
                )}
                <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
                  <p className="text-muted-foreground text-xs font-medium mb-1 uppercase tracking-wide">Follow-up Scheduled Date</p>
                  <p className="font-semibold">{new Date(latestFollowUp.scheduledDate).toLocaleDateString()}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
                  <p className="text-muted-foreground text-xs font-medium mb-1 uppercase tracking-wide">Follow-up Status</p>
                  <p className="font-semibold capitalize">{latestFollowUp.status.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
