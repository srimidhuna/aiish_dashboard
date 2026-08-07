/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { screeningsService, childrenService } from '../../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { toast } from 'sonner';
import { PatientSummaryCard } from '../../components/ui/PatientSummaryCard';
import { EarResultSelector } from '../../components/forms/EarResultSelector';
import { FormSection } from '../../components/forms/FormSection';
import { Skeleton } from '../../components/ui/Skeleton';

const testResult = z.enum(['pass', 'refer', 'noisy', 'cnt', 'not_done']);
const passReferOnly = z.enum(['pass', 'refer', 'cnt', 'not_done']);

const schema = z.object({
  entFindings: z.string().optional(),
  boaResult: passReferOnly.optional(),
  teoaeRight: testResult.optional(),
  teoaeLeft: testResult.optional(),
  dpoaeRight: testResult.optional(),
  dpoaeLeft: testResult.optional(),
  aabr1Right: passReferOnly.optional(),
  aabr1Left: passReferOnly.optional(),
  aabr2Right: passReferOnly.optional(),
  aabr2Left: passReferOnly.optional(),
  overallResult: z.enum(['pass', 'refer']).optional(),
  remarks: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ScreeningFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const draftId = searchParams.get('draftId');
  const queryClient = useQueryClient();

  const { data: child, isLoading } = useQuery({
    queryKey: ['child', childId],
    queryFn: () => childrenService.getById(childId!),
    enabled: !!childId,
  });

  const { data: draft, isLoading: draftLoading } = useQuery({
    queryKey: ['screening', draftId],
    queryFn: () => screeningsService.getById(draftId!),
    enabled: !!draftId,
  });

  const { register, handleSubmit, reset, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (draft) {
      reset({
        entFindings: draft.entFindings,
        boaResult: draft.boaResult as any,
        teoaeRight: draft.teoaeRight,
        teoaeLeft: draft.teoaeLeft,
        dpoaeRight: draft.dpoaeRight,
        dpoaeLeft: draft.dpoaeLeft,
        aabr1Right: draft.aabr1Right as any,
        aabr1Left: draft.aabr1Left as any,
        aabr2Right: draft.aabr2Right as any,
        aabr2Left: draft.aabr2Left as any,
        overallResult: draft.overallResult,
        remarks: draft.remarks,
      });
    }
  }, [draft, reset]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['screenings'] });
    queryClient.invalidateQueries({ queryKey: ['timeline', childId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-notifications'] });
    queryClient.invalidateQueries({ queryKey: ['followUps', childId] });
  };

  const submitMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = { ...data, status: 'completed' as const, childId: childId! };
      return draftId
        ? screeningsService.update(draftId, payload)
        : screeningsService.create(payload);
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Screening submitted successfully!');
      navigate(`/children/${childId}?tab=Screening+History`);
    },
  });

  const draftMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = { ...data, status: 'draft' as const, childId: childId! };
      return draftId
        ? screeningsService.update(draftId, payload)
        : screeningsService.create(payload);
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Draft saved. You can continue it later from the Screening Queue.');
      navigate('/screenings');
    },
  });

  if (!childId)
    return <div className="p-8 text-center text-muted-foreground">No child specified</div>;
  if (isLoading || draftLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
        <h1 className="text-3xl font-bold">New Screening</h1>
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }
  if (!child) return <div className="p-8 text-center text-destructive">Error loading child</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{draftId ? 'Continue Screening' : 'New Screening'}</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>

      <PatientSummaryCard child={child} />

      <form onSubmit={handleSubmit((d) => submitMutation.mutate(d))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Clinical Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">


            <FormSection title="ENT Findings">
              <div className="col-span-6">
                <textarea
                  {...register('entFindings')}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1"
                  placeholder="Enter ENT examination findings..."
                />
              </div>
            </FormSection>

            <FormSection title="BOA (Behavioral Observation Audiometry)">
              <div className="col-span-6">
                <EarResultSelector
                  register={register}
                  name="boaResult"
                  label="BOA Result"
                  options={['pass', 'refer', 'cnt', 'not_done']}
                />
              </div>
            </FormSection>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>TEOAE / DPOAE Screening (1st Screening)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormSection title="TEOAE">
              <div className="col-span-3">
                <EarResultSelector register={register} name="teoaeRight" label="Right Ear" />
              </div>
              <div className="col-span-3">
                <EarResultSelector register={register} name="teoaeLeft" label="Left Ear" />
              </div>
            </FormSection>
            <FormSection title="DPOAE">
              <div className="col-span-3">
                <EarResultSelector register={register} name="dpoaeRight" label="Right Ear" />
              </div>
              <div className="col-span-3">
                <EarResultSelector register={register} name="dpoaeLeft" label="Left Ear" />
              </div>
            </FormSection>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AABR Screening</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormSection title="AABR — 1st Screening">
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
            </FormSection>
            <FormSection title="AABR — 2nd Screening">
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
            </FormSection>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overall Result & Remarks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="w-1/2">
              <label className="text-sm font-medium">Overall Screening Result</label>
              <select
                {...register('overallResult')}
                className="flex h-10 w-full rounded-md border-2 border-input bg-transparent px-3 py-1 mt-1"
              >
                <option value="">-- Select --</option>
                <option value="pass">Pass</option>
                <option value="refer">Refer</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">General Remarks</label>
              <textarea
                {...register('remarks')}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1"
                placeholder="Enter clinical remarks or notes..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="secondary"
            disabled={draftMutation.isPending}
            onClick={() => draftMutation.mutate(getValues())}
          >
            {draftMutation.isPending ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button type="submit" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? 'Submitting...' : 'Submit Screening'}
          </Button>
        </div>
      </form>
    </div>
  );
}
