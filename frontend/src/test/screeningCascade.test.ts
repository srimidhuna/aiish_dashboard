import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { computeScreeningOutcome, hasHighRisk, sanitizeScreening } from '../lib/screeningLogic';
import { useScreeningCascade } from '../hooks/useScreeningCascade';

describe('screeningLogic', () => {
  it('detects high risk from any HRR input', () => {
    expect(hasHighRisk({})).toBe(false);
    expect(hasHighRisk({ riskFactorIds: ['x'] })).toBe(true);
    expect(hasHighRisk({ familyHistoryHearingLoss: true })).toBe(true);
    expect(hasHighRisk({ consanguinityDegree: 'first' })).toBe(true);
    expect(hasHighRisk({ consanguinityDegree: '' })).toBe(false);
    expect(hasHighRisk({ caregiverConcern: true })).toBe(true);
  });

  it('OAE pass without HRR → PASS, AABR hidden', () => {
    const o = computeScreeningOutcome({ oaeTestSelection: 'TEOAE', teoaeRight: 'pass', teoaeLeft: 'pass' }, false);
    expect(o.showAabr1).toBe(false);
    expect(o.overallResult).toBe('pass');
  });

  it('HRR shows AABR; an AABR refer overrides an OAE pass (no PASS + re-screening contradiction)', () => {
    const o = computeScreeningOutcome(
      { oaeTestSelection: 'TEOAE', teoaeRight: 'pass', teoaeLeft: 'pass', aabr1Right: 'refer', aabr1Left: 'pass' },
      true,
    );
    expect(o.showAabr1).toBe(true);
    expect(o.overallResult).toBe('refer');
  });

  it('OAE fail waits for AABR, then follows it', () => {
    const base = { oaeTestSelection: 'DPOAE', dpoaeRight: 'refer', dpoaeLeft: 'refer' };
    expect(computeScreeningOutcome(base, false).overallResult).toBe('');
    expect(computeScreeningOutcome({ ...base, aabr1Right: 'pass', aabr1Left: 'pass' }, false).overallResult).toBe('pass');
    expect(computeScreeningOutcome({ ...base, aabr1Right: 'refer' }, false).overallResult).toBe('refer');
  });

  it('ignores results from hidden sections', () => {
    const o = computeScreeningOutcome(
      { oaeTestSelection: 'TEOAE', teoaeRight: 'pass', teoaeLeft: 'pass', aabr1Right: 'refer', aabr1Left: 'refer', dpoaeRight: 'cnt' },
      false,
    );
    expect(o.overallResult).toBe('pass');
    expect(o.hasCnt).toBe(false);
  });

  it('sanitizeScreening strips hidden answers and CNT reason', () => {
    const v = sanitizeScreening(
      {
        oaeTestSelection: 'TEOAE',
        teoaeRight: 'pass',
        teoaeLeft: 'pass',
        dpoaeRight: 'refer',
        aabr1Right: 'cnt',
        aabr1Left: 'refer',
        cntReason: 'Crying',
        overallResult: 'refer',
      },
      false,
    );
    expect(v).toMatchObject({ dpoaeRight: '', aabr1Right: '', aabr1Left: '', cntReason: '', overallResult: 'pass' });
  });
});

type V = Record<string, unknown>;

function setup(defaultValues: V = {}) {
  return renderHook(() => {
    const form = useForm<V>({ defaultValues: { riskFactorIds: [], ...defaultValues } });
    const [followUpDate, setFollowUpDate] = useState('');
    useScreeningCascade({ watch: form.watch, getValues: form.getValues, setValue: form.setValue, setFollowUpDate });
    return { form, followUpDate };
  });
}

describe('useScreeningCascade (always-mounted reconciler)', () => {
  it('REGRESSION: HRR set → AABR refer → back to HRR and clear it → AABR, result and re-screening all reset', () => {
    const { result } = setup();
    const set = (k: string, v: unknown) => act(() => result.current.form.setValue(k, v));

    // Step 4: HRR selected
    set('riskFactorIds', ['nicu']);
    // Step 6: OAE pass both ears, AABR refer (AABR shown because of HRR)
    set('oaeTestSelection', 'TEOAE');
    set('teoaeRight', 'pass');
    set('teoaeLeft', 'pass');
    set('aabr1Right', 'refer');
    set('aabr1Left', 'refer');
    expect(result.current.form.getValues('overallResult')).toBe('refer');
    expect(result.current.followUpDate).not.toBe('');

    // Back to step 4: remove the HRR (screening step is NOT mounted at this point)
    set('riskFactorIds', []);

    const v = result.current.form.getValues();
    expect(v.aabr1Right).toBe('');
    expect(v.aabr1Left).toBe('');
    expect(v.overallResult).toBe('pass');
    expect(result.current.followUpDate).toBe('');
  });

  it('adding HRR after an OAE pass keeps PASS until AABR is entered', () => {
    const { result } = setup();
    const set = (k: string, v: unknown) => act(() => result.current.form.setValue(k, v));
    set('oaeTestSelection', 'TEOAE');
    set('teoaeRight', 'pass');
    set('teoaeLeft', 'pass');
    expect(result.current.form.getValues('overallResult')).toBe('pass');
    set('familyHistoryHearingLoss', true);
    expect(result.current.form.getValues('overallResult')).toBe('pass');
    set('aabr1Right', 'refer');
    expect(result.current.form.getValues('overallResult')).toBe('refer');
    expect(result.current.followUpDate).not.toBe('');
  });

  it('switching TEOAE → DPOAE clears TEOAE answers and the stale result', () => {
    const { result } = setup();
    const set = (k: string, v: unknown) => act(() => result.current.form.setValue(k, v));
    set('oaeTestSelection', 'TEOAE');
    set('teoaeRight', 'pass');
    set('teoaeLeft', 'pass');
    expect(result.current.form.getValues('overallResult')).toBe('pass');
    set('oaeTestSelection', 'DPOAE');
    const v = result.current.form.getValues();
    expect(v.teoaeRight).toBe('');
    expect(v.teoaeLeft).toBe('');
    expect(v.overallResult).toBe('');
  });

  it('auto N/A for the AABR ear that passed OAE, and removes it when no longer applicable', () => {
    const { result } = setup();
    const set = (k: string, v: unknown) => act(() => result.current.form.setValue(k, v));
    set('oaeTestSelection', 'TEOAE');
    set('teoaeRight', 'pass');
    set('teoaeLeft', 'refer');
    expect(result.current.form.getValues('aabr1Right')).toBe('na');
    set('teoaeRight', 'refer');
    expect(result.current.form.getValues('aabr1Right')).toBe('');
  });

  it('clears the CNT reason once no test is CNT any more', () => {
    const { result } = setup();
    const set = (k: string, v: unknown) => act(() => result.current.form.setValue(k, v));
    set('boaResult', 'cnt');
    set('cntReason', 'Crying');
    set('boaResult', 'pass');
    expect(result.current.form.getValues('cntReason')).toBe('');
  });

  it('reset() (edit load / draft restore) is adopted without rewriting stored data', () => {
    const { result } = setup();
    act(() =>
      result.current.form.reset({
        riskFactorIds: [],
        oaeTestSelection: 'TEOAE',
        teoaeRight: 'pass',
        teoaeLeft: 'pass',
        aabr1Right: 'pass', // legacy value in a now-hidden section
        aabr1Left: 'pass',
        overallResult: 'pass',
      }),
    );
    expect(result.current.form.getValues('aabr1Right')).toBe('pass');
  });
});
