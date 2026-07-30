import { useEffect } from 'react';
import type { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { FormSection } from './FormSection';
import { EarResultSelector } from './EarResultSelector';
import { Calendar, AlertCircle, CheckCircle2, ChevronRight, Clock } from 'lucide-react';

// ─── Helper ──────────────────────────────────────────────────────────────────
/** Returns true when a result value is anything other than 'pass' AND is actually set */
function isFailed(val: string | undefined): boolean {
  return !!val && val !== 'pass';
}

/** Returns true when AT LEAST ONE ear of a two-ear test has failed */
function anyEarFailed(right: string | undefined, left: string | undefined): boolean {
  return isFailed(right) || isFailed(left);
}

/** Returns true when BOTH ears of a two-ear test have passed */
function bothEarsPassed(right: string | undefined, left: string | undefined): boolean {
  return right === 'pass' && left === 'pass';
}

// ─── Progress indicator ───────────────────────────────────────────────────────
interface StepBadgeProps {
  label: string;
  status: 'pending' | 'active' | 'pass' | 'fail' | 'skipped';
}
function StepBadge({ label, status }: StepBadgeProps) {
  const styles: Record<string, string> = {
    pending: 'bg-muted text-muted-foreground border-border',
    active: 'bg-indigo-50 text-indigo-700 border-indigo-300 font-semibold dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
    pass: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    fail: 'bg-red-50 text-red-600 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    skipped: 'bg-muted/50 text-muted-foreground/50 border-dashed border-border',
  };
  const icons: Record<string, React.ReactNode> = {
    pass: <CheckCircle2 className="h-3 w-3" />,
    fail: <AlertCircle className="h-3 w-3" />,
    active: <ChevronRight className="h-3 w-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border ${styles[status]}`}>
      {icons[status]}
      {label}
    </span>
  );
}

// ─── Schedule Modal ───────────────────────────────────────────────────────────
interface ScheduleModalProps {
  open: boolean;
  onClose: () => void;
  date: string;
  onDateChange: (d: string) => void;
  onConfirm: () => void;
}
function ScheduleModal({ open, onClose, date, onDateChange, onConfirm }: ScheduleModalProps) {
  if (!open) return null;

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-tight">All Tests Refer / Not Passed</h3>
              <p className="text-amber-100 text-xs mt-0.5">A follow-up visit needs to be scheduled</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            <p className="font-medium mb-1">Screening Result: Refer on all tests</p>
            <p className="text-xs text-amber-700">
              The child did not pass any screening test in this session (BOA → TEOAE → DPOAE → AABR 1st → AABR 2nd).
              Please schedule a repeat screening visit.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              <Clock className="inline h-4 w-4 mr-1 text-indigo-500" />
              Select Follow-up Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              min={minDateStr}
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="flex h-10 w-full rounded-lg border-2 border-indigo-200 dark:border-indigo-800 bg-background px-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {!date && (
              <p className="text-xs text-red-500">Please choose a date to proceed</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!date}
            onClick={onConfirm}
            className="flex-1 h-10 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
          >
            <Calendar className="inline h-4 w-4 mr-1.5" />
            Schedule Visit
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section header with status badge ────────────────────────────────────────
function TestHeader({
  step, title, status,
}: { step: number; title: string; status: 'active' | 'pass' | 'fail' }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {step}
        </span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      {status === 'pass' && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="h-3 w-3" /> PASS — No further tests needed
        </span>
      )}
      {status === 'fail' && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
          <AlertCircle className="h-3 w-3" /> Refer — Next test required
        </span>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ScreeningStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: UseFormWatch<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>;
  followUpDate: string;
  setFollowUpDate: (d: string) => void;
  showScheduleModal: boolean;
  setShowScheduleModal: (v: boolean) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ScreeningStep({
  register,
  watch,
  setValue,
  followUpDate,
  setFollowUpDate,
  showScheduleModal,
  setShowScheduleModal,
}: ScreeningStepProps) {
  const boa       = watch('boaResult')   as string | undefined;
  const teoaeR    = watch('teoaeRight')  as string | undefined;
  const teoaeL    = watch('teoaeLeft')   as string | undefined;
  const dpoaeR    = watch('dpoaeRight')  as string | undefined;
  const dpoaeL    = watch('dpoaeLeft')   as string | undefined;
  const aabr1R    = watch('aabr1Right')  as string | undefined;
  const aabr1L    = watch('aabr1Left')   as string | undefined;
  const aabr2R    = watch('aabr2Right')  as string | undefined;
  const aabr2L    = watch('aabr2Left')   as string | undefined;

  // Cascade visibility rules
  const boaPassed     = boa === 'pass';
  const showTeoae     = isFailed(boa);
  const teoaePassed   = bothEarsPassed(teoaeR, teoaeL);
  const showDpoae     = showTeoae && anyEarFailed(teoaeR, teoaeL);
  const dpoaePassed   = bothEarsPassed(dpoaeR, dpoaeL);
  const showAabr1     = showDpoae && anyEarFailed(dpoaeR, dpoaeL);
  const aabr1Passed   = bothEarsPassed(aabr1R, aabr1L);
  const showAabr2     = showAabr1 && anyEarFailed(aabr1R, aabr1L);
  const allFailed     = showAabr2 && anyEarFailed(aabr2R, aabr2L);

  // Auto-set overallResult from the cascade
  useEffect(() => {
    if (boaPassed || teoaePassed || dpoaePassed || aabr1Passed || bothEarsPassed(aabr2R, aabr2L)) {
      setValue('overallResult', 'pass');
    } else if (allFailed) {
      setValue('overallResult', 'refer');
    }
  }, [boaPassed, teoaePassed, dpoaePassed, aabr1Passed, aabr2R, aabr2L, allFailed, setValue]);

  // Show schedule modal automatically when all tests fail
  useEffect(() => {
    if (allFailed) setShowScheduleModal(true);
  }, [allFailed, setShowScheduleModal]);

  // Clear downstream fields when a higher test passes (prevents stale data)
  useEffect(() => {
    if (!showTeoae) { setValue('teoaeRight', undefined); setValue('teoaeLeft', undefined); }
  }, [showTeoae, setValue]);
  useEffect(() => {
    if (!showDpoae) { setValue('dpoaeRight', undefined); setValue('dpoaeLeft', undefined); }
  }, [showDpoae, setValue]);
  useEffect(() => {
    if (!showAabr1) { setValue('aabr1Right', undefined); setValue('aabr1Left', undefined); }
  }, [showAabr1, setValue]);
  useEffect(() => {
    if (!showAabr2) { setValue('aabr2Right', undefined); setValue('aabr2Left', undefined); }
  }, [showAabr2, setValue]);

  // Progress bar badges
  const boaStatus   = !boa ? 'active' : boa === 'pass' ? 'pass' : 'fail';
  const teoaeStatus = !showTeoae ? 'skipped' : teoaePassed ? 'pass' : (teoaeR || teoaeL) ? 'fail' : 'active';
  const dpoaeStatus = !showDpoae ? 'skipped' : dpoaePassed ? 'pass' : (dpoaeR || dpoaeL) ? 'fail' : 'active';
  const aabr1Status = !showAabr1 ? 'skipped' : aabr1Passed ? 'pass' : (aabr1R || aabr1L) ? 'fail' : 'active';
  const aabr2Status = !showAabr2 ? 'skipped' : bothEarsPassed(aabr2R, aabr2L) ? 'pass' : (aabr2R || aabr2L) ? 'fail' : 'active';

  return (
    <div className="space-y-5">
      {/* ── Schedule modal (shown when all tests fail) ── */}
      <ScheduleModal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        date={followUpDate}
        onDateChange={setFollowUpDate}
        onConfirm={() => setShowScheduleModal(false)}
      />

      {/* ── Progress strip ── */}
      <div className="rounded-xl bg-muted/50 border border-border px-4 py-3">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Test Cascade Progress</p>
        <div className="flex flex-wrap gap-2">
          <StepBadge label="BOA" status={boaStatus as StepBadgeProps['status']} />
          <span className="text-muted-foreground/50 self-center">→</span>
          <StepBadge label="TEOAE" status={teoaeStatus as StepBadgeProps['status']} />
          <span className="text-muted-foreground/50 self-center">→</span>
          <StepBadge label="DPOAE" status={dpoaeStatus as StepBadgeProps['status']} />
          <span className="text-muted-foreground/50 self-center">→</span>
          <StepBadge label="AABR 1st" status={aabr1Status as StepBadgeProps['status']} />
          <span className="text-muted-foreground/50 self-center">→</span>
          <StepBadge label="AABR 2nd" status={aabr2Status as StepBadgeProps['status']} />
        </div>
      </div>

      {/* ── ENT Findings (always shown) ── */}
      <FormSection title="ENT Findings">
        <div className="col-span-6">
          <textarea
            {...register('entFindings')}
            className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1"
            placeholder="Enter ENT examination findings..."
          />
        </div>
      </FormSection>

      {/* ── STEP 1: BOA ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border/50">
          <TestHeader
            step={1}
            title="BOA — Behavioral Observation Audiometry"
            status={!boa ? 'active' : boa === 'pass' ? 'pass' : 'fail'}
          />
          {boaPassed && (
            <p className="text-xs text-emerald-600 mt-1">
              ✅ BOA passed — no further screening tests are required for this visit.
            </p>
          )}
        </div>
        <div className="px-5 py-4">
          <EarResultSelector
            register={register}
            name="boaResult"
            label="BOA Result"
            options={['pass', 'refer', 'cnt', 'not_done']}
          />
        </div>
      </div>

      {/* ── STEP 2: TEOAE (shown only when BOA fails) ── */}
      {showTeoae && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-5 py-3.5 border-b border-border/50">
            <TestHeader
              step={2}
              title="TEOAE — Transient Evoked Otoacoustic Emissions"
              status={!teoaeR && !teoaeL ? 'active' : teoaePassed ? 'pass' : 'fail'}
            />
          </div>
          <div className="px-5 py-4 grid grid-cols-6 gap-4">
            <div className="col-span-3">
              <EarResultSelector register={register} name="teoaeRight" label="Right Ear" />
            </div>
            <div className="col-span-3">
              <EarResultSelector register={register} name="teoaeLeft" label="Left Ear" />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: DPOAE (shown only when both TEOAE ears fail) ── */}
      {showDpoae && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-5 py-3.5 border-b border-border/50">
            <TestHeader
              step={3}
              title="DPOAE — Distortion Product Otoacoustic Emissions"
              status={!dpoaeR && !dpoaeL ? 'active' : dpoaePassed ? 'pass' : 'fail'}
            />
          </div>
          <div className="px-5 py-4 grid grid-cols-6 gap-4">
            <div className="col-span-3">
              <EarResultSelector register={register} name="dpoaeRight" label="Right Ear" />
            </div>
            <div className="col-span-3">
              <EarResultSelector register={register} name="dpoaeLeft" label="Left Ear" />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4: AABR 1st (shown only when both DPOAE ears fail) ── */}
      {showAabr1 && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-5 py-3.5 border-b border-border/50">
            <TestHeader
              step={4}
              title="AABR — 1st Screening"
              status={!aabr1R && !aabr1L ? 'active' : aabr1Passed ? 'pass' : 'fail'}
            />
          </div>
          <div className="px-5 py-4 grid grid-cols-6 gap-4">
            <div className="col-span-3">
              <EarResultSelector
                register={register}
                name="aabr1Right"
                label="Right Ear"
                options={['pass', 'refer', 'cnt', 'not_done']}
              />
            </div>
            <div className="col-span-3">
              <EarResultSelector
                register={register}
                name="aabr1Left"
                label="Left Ear"
                options={['pass', 'refer', 'cnt', 'not_done']}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 5: AABR 2nd (shown only when both AABR 1st ears fail) ── */}
      {showAabr2 && (
        <div className="rounded-xl border border-orange-200/50 dark:border-orange-900/30 bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-5 py-3.5 border-b border-orange-200/50 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-900/10">
            <TestHeader
              step={5}
              title="AABR — 2nd Screening (Final)"
              status={!aabr2R && !aabr2L ? 'active' : bothEarsPassed(aabr2R, aabr2L) ? 'pass' : 'fail'}
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
      )}

      {/* ── Overall result (auto-set, read-only display) ── */}
      {boa && (
        <div className="rounded-xl border border-border bg-card shadow-sm px-5 py-4">
          <p className="text-sm font-semibold text-foreground mb-2">Overall Screening Result</p>
          {boaPassed || teoaePassed || dpoaePassed || aabr1Passed || bothEarsPassed(aabr2R, aabr2L) ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">PASS</span>
            </div>
          ) : allFailed ? (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-200 dark:bg-red-900/30 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-bold text-red-700 dark:text-red-300">REFER — Follow-up required</span>
              </div>
              {followUpDate ? (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-amber-50 border border-amber-200 text-sm text-amber-700 font-medium dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                  <Calendar className="h-4 w-4" />
                  Follow-up: {new Date(followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(true)}
                    className="ml-1 text-xs underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Schedule Follow-up Visit
                </button>
              )}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border">
              <span className="text-sm text-muted-foreground">Awaiting test results…</span>
            </div>
          )}
          {/* Hidden field to carry the value into the form */}
          <input type="hidden" {...register('overallResult')} />
        </div>
      )}
    </div>
  );
}
