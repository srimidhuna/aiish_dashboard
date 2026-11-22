import { useEffect, useRef } from 'react';
import type { FieldValues, UseFormGetValues, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import {
  computeScreeningOutcome,
  hasHighRisk,
  tomorrowLocalISO,
  type ScreeningOutcome,
} from '../lib/screeningLogic';

/** Form fields whose change can alter the screening cascade. */
const CASCADE_FIELDS = new Set([
  // High-Risk Register
  'riskFactorIds',
  'familyHistoryHearingLoss',
  'consanguinityDegree',
  'caregiverConcern',
  'hrrRemarks',
  'craniofacialRemarks',
  // Screening
  'boaResult',
  'oaeTestSelection',
  'teoaeRight',
  'teoaeLeft',
  'dpoaeRight',
  'dpoaeLeft',
  'aabr1Right',
  'aabr1Left',
]);

interface Options<T extends FieldValues> {
  watch: UseFormWatch<T>;
  getValues: UseFormGetValues<T>;
  setValue: UseFormSetValue<T>;
  setFollowUpDate: (updater: (prev: string) => string) => void;
}

/**
 * Keeps every screening-derived value (hidden sections, AABR N/A, overall result,
 * CNT reason, re-screening date) consistent with the rest of the form.
 *
 * Must be called from the component that owns the form and stays mounted for the
 * whole wizard — NOT from the screening step — so that changes made on other steps
 * (e.g. the High-Risk Register) are applied even while the screening step is not
 * on screen.
 *
 * It reacts only to user/setValue changes. A `reset()` (loading an existing record or
 * restoring a draft) is adopted as-is, so stored data is never silently rewritten
 * just by opening the form.
 */
export function useScreeningCascade<T extends FieldValues>({
  watch,
  getValues,
  setValue,
  setFollowUpDate,
}: Options<T>) {
  // Keep the latest setter without re-subscribing on every render.
  const followUpRef = useRef(setFollowUpDate);
  followUpRef.current = setFollowUpDate;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const read = () => getValues() as any;
    const outcomeOf = (v: ReturnType<typeof read>): ScreeningOutcome =>
      computeScreeningOutcome(v, hasHighRisk(v));

    let busy = false;

    const subscription = watch((_values, { name }) => {
      if (busy) return;

      // reset()/draft restore: accept the loaded state as the new baseline without cascades
      if (!name) return;
      const root = String(name).split('.')[0];
      if (!CASCADE_FIELDS.has(root)) return;

      busy = true;
      try {
        const values = read();
        const next = outcomeOf(values);
        const set = (field: string, val: string) => {
          if ((values[field] ?? '') !== val) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue(field as any, val as any, { shouldDirty: true });
            values[field] = val;
          }
        };

        // 1. A section that is not shown must not keep stale answers.
        if (!next.showTeoae && (values.teoaeRight || values.teoaeLeft)) {
          set('teoaeRight', '');
          set('teoaeLeft', '');
        }
        if (!next.showDpoae && (values.dpoaeRight || values.dpoaeLeft)) {
          set('dpoaeRight', '');
          set('dpoaeLeft', '');
        }
        if (!next.showAabr1 && (values.aabr1Right || values.aabr1Left)) {
          set('aabr1Right', '');
          set('aabr1Left', '');
        }

        // 2. Clear HRR remarks if baby has no high-risk register indicators
        const isHighRiskNow = hasHighRisk(values);
        if (!isHighRiskNow && values.hrrRemarks) {
          set('hrrRemarks', '');
        }

        // 3. AABR is N/A for an ear that already passed OAE while the other ear failed.
        if (next.showAabr1) {
          if (next.aabrNaRight && values.aabr1Right !== 'na') set('aabr1Right', 'na');
          if (!next.aabrNaRight && values.aabr1Right === 'na') set('aabr1Right', '');
          if (next.aabrNaLeft && values.aabr1Left !== 'na') set('aabr1Left', 'na');
          if (!next.aabrNaLeft && values.aabr1Left === 'na') set('aabr1Left', '');
        }

        // 4. Derived values, recomputed from the now-consistent inputs.
        const final = outcomeOf(values);
        set('overallResult', final.overallResult);
        if (!final.hasCnt && values.cntReason) set('cntReason', '');

        // 5. A re-screening is scheduled exactly when (and only while) the result is REFER.
        followUpRef.current((current) =>
          final.overallResult === 'refer' ? current || tomorrowLocalISO() : '',
        );
      } finally {
        busy = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, getValues, setValue]);
}
