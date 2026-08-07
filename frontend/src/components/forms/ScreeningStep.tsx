import { useEffect } from 'react';
import type { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { FormSection } from './FormSection';
import { EarResultSelector } from './EarResultSelector';
import { TestHeader } from './TestHeader';
import { Calendar, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

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
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ScreeningStep({
  register,
  watch,
  setValue,
  followUpDate,
  setFollowUpDate,
}: ScreeningStepProps) {
  const boa           = watch('boaResult')       as string | undefined;
  const oaeTestSelection = watch('oaeTestSelection') as string | undefined;
  const teoaeR        = watch('teoaeRight')      as string | undefined;
  const teoaeL        = watch('teoaeLeft')       as string | undefined;
  const dpoaeR        = watch('dpoaeRight')      as string | undefined;
  const dpoaeL        = watch('dpoaeLeft')       as string | undefined;
  const aabr1R        = watch('aabr1Right')      as string | undefined;
  const aabr1L        = watch('aabr1Left')       as string | undefined;

  // Cascade visibility rules
  const showTeoae     = oaeTestSelection === 'TEOAE';
  const showDpoae     = oaeTestSelection === 'DPOAE';
  
  const teoaePassed   = bothEarsPassed(teoaeR, teoaeL);
  const dpoaePassed   = bothEarsPassed(dpoaeR, dpoaeL);
  const oaePassed     = showTeoae ? teoaePassed : (showDpoae ? dpoaePassed : false);
  const oaeFailed     = showTeoae ? anyEarFailed(teoaeR, teoaeL) : (showDpoae ? anyEarFailed(dpoaeR, dpoaeL) : false);

  const showAabr1     = oaeFailed;
  const aabr1Passed   = bothEarsPassed(aabr1R, aabr1L);
  const allFailed     = showAabr1 && anyEarFailed(aabr1R, aabr1L);

  // Auto-set overallResult from the cascade
  useEffect(() => {
    if (oaePassed || aabr1Passed) {
      setValue('overallResult', 'pass');
    } else if (allFailed) {
      setValue('overallResult', 'refer');
    }
  }, [oaePassed, aabr1Passed, allFailed, setValue]);

  // Auto-schedule next-day rescreening when all tests fail
  useEffect(() => {
    if (allFailed && !followUpDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFollowUpDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [allFailed, followUpDate, setFollowUpDate]);

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

  // Progress bar badges
  const boaStatus   = !boa ? 'active' : boa === 'pass' ? 'pass' : 'fail';
  const oaeStatus   = !oaeTestSelection ? 'active' : oaePassed ? 'pass' : oaeFailed ? 'fail' : 'active';
  const aabr1Status = !showAabr1 ? 'skipped' : aabr1Passed ? 'pass' : (aabr1R || aabr1L) ? 'fail' : 'active';

  return (
    <div className="space-y-5">
      {/* ── Progress strip ── */}
      <div className="rounded-xl bg-muted/50 border border-border px-4 py-3">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Initial Screening Progress</p>
        <div className="flex flex-wrap gap-2">
          <StepBadge label="BOA" status={boaStatus as StepBadgeProps['status']} />
          <span className="text-muted-foreground/50 self-center">→</span>
          <StepBadge label="OAE" status={oaeStatus as StepBadgeProps['status']} />
          <span className="text-muted-foreground/50 self-center">→</span>
          <StepBadge label="AABR 1st" status={aabr1Status as StepBadgeProps['status']} />
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
            title="BOA — Behavioral Observation Audiometry (Optional)"
            status={!boa ? 'active' : boa === 'pass' ? 'pass' : 'fail'}
          />
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

      {/* ── STEP 2: OAE Selection ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border/50">
          <TestHeader
            step={2}
            title="Select OAE Test"
            status={oaeTestSelection ? 'pass' : 'active'}
          />
        </div>
        <div className="px-5 py-4">
          <label className="text-sm font-medium mb-3 block">Choose the OAE test to perform: <span className="text-muted-foreground text-xs font-normal">(Optional)</span></label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="TEOAE" {...register('oaeTestSelection')} className="w-4 h-4 text-indigo-600 border-border" />
              <span className="text-sm font-medium">TEOAE</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="DPOAE" {...register('oaeTestSelection')} className="w-4 h-4 text-indigo-600 border-border" />
              <span className="text-sm font-medium">DPOAE</span>
            </label>
          </div>
        </div>
      </div>

      {/* ── STEP 3: TEOAE (shown only when TEOAE is selected) ── */}
      {showTeoae && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-5 py-3.5 border-b border-border/50">
            <TestHeader
              step={3}
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



      {/* ── Overall result (auto-set, read-only display) — only shown when tests have been entered ── */}
      {/* Hidden field always registered so form state is always valid regardless of BOA selection */}
      <input type="hidden" {...register('overallResult')} />

      {boa && (
        <div className="rounded-xl border border-border bg-card shadow-sm px-5 py-4">
          <p className="text-sm font-semibold text-foreground mb-2">Overall Screening Result</p>
          {oaePassed || aabr1Passed ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">PASS</span>
            </div>
          ) : allFailed ? (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-200 dark:bg-red-900/30 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-bold text-red-700 dark:text-red-300">REFER — Re-Screening required</span>
              </div>
              {followUpDate && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-amber-50 border border-amber-200 text-sm text-amber-700 font-medium dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                  <Calendar className="h-4 w-4" />
                  Re-Screening: {new Date(followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border">
              <span className="text-sm text-muted-foreground">Awaiting test results…</span>
            </div>
          )}
        </div>
      )}

      {/* Informational note that all screening is optional */}
      <p className="text-xs text-muted-foreground text-center pt-1">
        All screening tests on this step are optional. You can register the child now and record screening results later.
      </p>
    </div>
  );
}
