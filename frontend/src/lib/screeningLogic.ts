/**
 * Pure, side-effect-free rules for the initial-screening cascade
 * (BOA → OAE (TEOAE | DPOAE) → AABR 1st).
 *
 * Everything that depends on these rules — what is visible, what the overall
 * result is, whether a re-screening is needed — must be derived from here so
 * the UI, the review page and the submitted payload can never disagree.
 */

export type ResultValue = string | null | undefined;

export interface ScreeningInputs {
  boaResult?: ResultValue;
  oaeTestSelection?: ResultValue;
  teoaeRight?: ResultValue;
  teoaeLeft?: ResultValue;
  dpoaeRight?: ResultValue;
  dpoaeLeft?: ResultValue;
  aabr1Right?: ResultValue;
  aabr1Left?: ResultValue;
}

export interface HrrInputs {
  riskFactorIds?: string[] | null;
  familyHistoryHearingLoss?: boolean | null;
  consanguinityDegree?: string | null;
  caregiverConcern?: boolean | null;
}

/** A result counts as "failed" when it is set and is anything other than pass / N/A. */
export function isFailed(val: ResultValue): boolean {
  return !!val && val !== 'pass' && val !== 'na';
}

export function isPassOrNa(val: ResultValue): boolean {
  return val === 'pass' || val === 'na';
}

export function bothEarsPassed(right: ResultValue, left: ResultValue): boolean {
  return isPassOrNa(right) && isPassOrNa(left);
}

export function anyEarFailed(right: ResultValue, left: ResultValue): boolean {
  return isFailed(right) || isFailed(left);
}

/** True when the High-Risk Register has at least one positive finding. */
export function hasHighRisk(hrr: HrrInputs): boolean {
  return (
    (hrr.riskFactorIds?.length ?? 0) > 0 ||
    !!hrr.familyHistoryHearingLoss ||
    (!!hrr.consanguinityDegree && hrr.consanguinityDegree !== 'none') ||
    !!hrr.caregiverConcern
  );
}

export interface ScreeningOutcome {
  showTeoae: boolean;
  showDpoae: boolean;
  showAabr1: boolean;
  oaeRight: ResultValue;
  oaeLeft: ResultValue;
  oaePassed: boolean;
  oaeFailed: boolean;
  aabr1Entered: boolean;
  aabr1Passed: boolean;
  aabr1Failed: boolean;
  /** 'pass' | 'refer' when determinable, otherwise '' (still awaiting results). */
  overallResult: 'pass' | 'refer' | '';
  hasCnt: boolean;
  /** AABR ear that should be N/A because that ear already passed OAE while the other failed. */
  aabrNaRight: boolean;
  aabrNaLeft: boolean;
}

export function computeScreeningOutcome(s: ScreeningInputs, highRisk: boolean): ScreeningOutcome {
  const showTeoae = s.oaeTestSelection === 'TEOAE';
  const showDpoae = s.oaeTestSelection === 'DPOAE';

  const oaeRight = showTeoae ? s.teoaeRight : showDpoae ? s.dpoaeRight : undefined;
  const oaeLeft = showTeoae ? s.teoaeLeft : showDpoae ? s.dpoaeLeft : undefined;

  const oaePassed = (showTeoae || showDpoae) && bothEarsPassed(oaeRight, oaeLeft);
  const oaeFailed = (showTeoae || showDpoae) && anyEarFailed(oaeRight, oaeLeft);

  // AABR is required for every high-risk baby, and for anyone who failed OAE.
  const showAabr1 = highRisk || oaeFailed;

  const aabr1R = showAabr1 ? s.aabr1Right : undefined;
  const aabr1L = showAabr1 ? s.aabr1Left : undefined;
  const aabr1Entered = !!aabr1R || !!aabr1L;
  const aabr1Passed = showAabr1 && bothEarsPassed(aabr1R, aabr1L);
  const aabr1Failed = showAabr1 && anyEarFailed(aabr1R, aabr1L);

  // Once AABR results are being entered they are the deciding test; otherwise a clean
  // OAE pass is sufficient. A failed OAE (with no AABR pass) is never a pass.
  let overallResult: ScreeningOutcome['overallResult'] = '';
  if (aabr1Failed) overallResult = 'refer';
  else if (aabr1Passed) overallResult = 'pass';
  else if (!aabr1Entered && oaePassed) overallResult = 'pass';

  const hasCnt = [
    s.boaResult,
    showTeoae ? s.teoaeRight : undefined,
    showTeoae ? s.teoaeLeft : undefined,
    showDpoae ? s.dpoaeRight : undefined,
    showDpoae ? s.dpoaeLeft : undefined,
    aabr1R,
    aabr1L,
  ].includes('cnt');

  return {
    showTeoae,
    showDpoae,
    showAabr1,
    oaeRight,
    oaeLeft,
    oaePassed,
    oaeFailed,
    aabr1Entered,
    aabr1Passed,
    aabr1Failed,
    overallResult,
    hasCnt,
    aabrNaRight: showAabr1 && oaeRight === 'pass' && isFailed(oaeLeft),
    aabrNaLeft: showAabr1 && oaeLeft === 'pass' && isFailed(oaeRight),
  };
}

/**
 * Returns the screening values with everything the cascade currently hides
 * removed, so stale answers from a previously visible section can never be
 * submitted or shown on the review page.
 */
export function sanitizeScreening<
  T extends ScreeningInputs & { cntReason?: ResultValue; overallResult?: ResultValue },
>(values: T, highRisk: boolean): T {
  const o = computeScreeningOutcome(values, highRisk);
  return {
    ...values,
    teoaeRight: o.showTeoae ? values.teoaeRight || '' : '',
    teoaeLeft: o.showTeoae ? values.teoaeLeft || '' : '',
    dpoaeRight: o.showDpoae ? values.dpoaeRight || '' : '',
    dpoaeLeft: o.showDpoae ? values.dpoaeLeft || '' : '',
    aabr1Right: o.showAabr1 ? values.aabr1Right || '' : '',
    aabr1Left: o.showAabr1 ? values.aabr1Left || '' : '',
    cntReason: o.hasCnt ? values.cntReason || '' : '',
    overallResult: o.overallResult,
  };
}

/** Today's date as YYYY-MM-DD in the user's local timezone. */
export function todayLocalISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Tomorrow's date as YYYY-MM-DD in the user's local timezone. */
export function tomorrowLocalISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
