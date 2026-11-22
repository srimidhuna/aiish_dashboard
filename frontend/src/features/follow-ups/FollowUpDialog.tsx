/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { followUpsService, childrenService, mastersService, staffService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';

const schema = z.object({
  childId: z.string().min(1, 'Patient is required'),
  followUpType: z.enum(['phone', 'regular', 'not_applicable']),
  scheduledDate: z.string().min(1, 'Date is required'),
  status: z.enum(['scheduled', 'completed', 'missed', 'rescheduled', 'lost_to_followup']).optional(),
  provisionalDiagnosisRight: z.string().optional(),
  provisionalDiagnosisLeft: z.string().optional(),
  recommendationOther: z.string().optional(),
  testedBy: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface FollowUpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  // If provided, we are editing / conducting / rescheduling
  initialData?: any;
  // If provided, we are adding for a specific child
  defaultChildId?: string;
  isCompleteMode?: boolean;
}

export function FollowUpDialog({
  isOpen,
  onClose,
  initialData,
  defaultChildId,
  isCompleteMode = false,
}: FollowUpDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [recommendationTypeIds, setRecommendationTypeIds] = useState<string[]>([]);

  const { data: children } = useQuery({
    queryKey: ['children'],
    queryFn: () => childrenService.list(),
  });

  const { data: recommendationTypes } = useQuery({
    queryKey: ['recommendationTypes'],
    queryFn: () => mastersService.listRecommendationTypes(),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffService.list(),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      childId: defaultChildId || '',
      followUpType: 'regular',
      scheduledDate: '',
      status: 'scheduled',
      provisionalDiagnosisRight: '',
      provisionalDiagnosisLeft: '',
      recommendationOther: '',
      testedBy: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          childId: initialData.childId || initialData.babyId,
          followUpType: initialData.followUpType || 'regular',
          scheduledDate: initialData.scheduledDate
            ? initialData.scheduledDate.substring(0, 10)
            : '',
          status: isCompleteMode ? 'completed' : (initialData.status || 'scheduled'),
          provisionalDiagnosisRight: initialData.provisionalDiagnosisRight || '',
          provisionalDiagnosisLeft: initialData.provisionalDiagnosisLeft || '',
          recommendationOther: '',
          testedBy: '',
          notes: initialData.notes || '',
        });

        const existingRecIds = (initialData.recommendations || []).map(
          (r: any) => r.recommendationTypeId || r.id,
        );
        setRecommendationTypeIds(existingRecIds);

        // Auto select tested by if currently logged in staff
        if (user && staffList.length > 0) {
          const staffRec = staffList.find((s) => s.email === user.email);
          if (staffRec) {
            setValue('testedBy', staffRec.fullName);
          }
        }
      } else {
        reset({
          childId: defaultChildId || '',
          followUpType: 'regular',
          scheduledDate: '',
          status: 'scheduled',
          provisionalDiagnosisRight: '',
          provisionalDiagnosisLeft: '',
          recommendationOther: '',
          testedBy: '',
          notes: '',
        });
        setRecommendationTypeIds([]);

        if (user && staffList.length > 0) {
          const staffRec = staffList.find((s) => s.email === user.email);
          if (staffRec) {
            setValue('testedBy', staffRec.fullName);
          }
        }
      }
    }
  }, [isOpen, initialData, defaultChildId, isCompleteMode, reset, setValue, user, staffList]);

  const toggleRecommendation = (id: string) => {
    setRecommendationTypeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      let finalNotes = data.notes || '';
      if (data.recommendationOther?.trim()) {
        finalNotes = finalNotes
          ? `${finalNotes}\nOther Recommendations: ${data.recommendationOther.trim()}`
          : `Other Recommendations: ${data.recommendationOther.trim()}`;
      }
      if (data.testedBy) {
        finalNotes = finalNotes
          ? `${finalNotes}\nTested by: ${data.testedBy}`
          : `Tested by: ${data.testedBy}`;
      }

      const payload = {
        babyId: data.childId,
        followUpType: data.followUpType,
        scheduledDate: new Date(data.scheduledDate).toISOString(),
        provisionalDiagnosisRight: data.provisionalDiagnosisRight || undefined,
        provisionalDiagnosisLeft: data.provisionalDiagnosisLeft || undefined,
        recommendationTypeIds,
        notes: finalNotes || undefined,
      };

      if (initialData?.id) {
        // Reschedule date change if applicable
        if (
          !isCompleteMode &&
          data.scheduledDate.substring(0, 10) !== initialData.scheduledDate.substring(0, 10)
        ) {
          await followUpsService.reschedule(
            initialData.id,
            new Date(data.scheduledDate).toISOString(),
          );
        }

        await followUpsService.update(initialData.id, {
          followUpType: payload.followUpType,
          scheduledDate: payload.scheduledDate,
          provisionalDiagnosisRight: payload.provisionalDiagnosisRight,
          provisionalDiagnosisLeft: payload.provisionalDiagnosisLeft,
          recommendationTypeIds: payload.recommendationTypeIds,
          notes: payload.notes,
        });

        if (isCompleteMode) {
          await followUpsService.updateStatus(initialData.id, 'completed');
        }
        return;
      }

      await followUpsService.create(payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      queryClient.invalidateQueries({ queryKey: ['children'] });
      toast.success(
        isCompleteMode
          ? 'Diagnostic evaluation saved and follow-up completed successfully!'
          : initialData
          ? 'Follow-up updated successfully!'
          : 'Follow-up scheduled successfully!',
      );
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save follow-up.';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  if (!isOpen) return null;

  const currentChild = children?.find(
    (c) => c.id === (initialData?.childId || initialData?.babyId || defaultChildId),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl border bg-card p-6 shadow-xl max-h-[92vh] overflow-y-auto space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {isCompleteMode
                ? 'Conduct Diagnostic Evaluation / Complete Follow-up'
                : initialData
                ? 'Edit Follow-up Visit'
                : 'Schedule Follow-up Visit'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record provisional diagnosis, clinical recommendations, and follow-up details.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
          {/* Patient Selection / Display */}
          <div>
            <label className="text-sm font-semibold">Patient</label>
            {initialData || defaultChildId ? (
              <div className="p-3 mt-1 rounded-md bg-muted/60 border border-border text-sm">
                <span className="font-semibold text-foreground">
                  {currentChild
                    ? `${currentChild.firstName} ${currentChild.lastName}`
                    : 'Selected Child'}
                </span>
                {currentChild?.hospitalNumber && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (MR: {currentChild.hospitalNumber})
                  </span>
                )}
                {currentChild?.pocdNumber && (
                  <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                    POCD: {currentChild.pocdNumber}
                  </span>
                )}
              </div>
            ) : (
              <select
                {...register('childId')}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Select Patient --</option>
                {children?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.hospitalNumber})
                  </option>
                ))}
              </select>
            )}
            {errors.childId && (
              <span className="text-xs text-destructive mt-1 block">{errors.childId.message}</span>
            )}
          </div>

          {/* Follow-up Type & Scheduled Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Follow-up Type</label>
              <select
                {...register('followUpType')}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary"
              >
                <option value="regular">Regular Follow-up / Clinical Evaluation</option>
                <option value="phone">Phone Follow-up</option>
                <option value="not_applicable">Not Applicable</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold">Scheduled Date</label>
              <Input type="date" {...register('scheduledDate')} className="mt-1" />
              {errors.scheduledDate && (
                <span className="text-xs text-destructive mt-1 block">
                  {errors.scheduledDate.message}
                </span>
              )}
            </div>
          </div>

          {/* ── Provisional Diagnosis & Recommendations ── */}
          <div className="rounded-xl border border-border bg-muted/20 p-5 space-y-5">
            <h3 className="text-base font-semibold border-b border-border pb-2 text-foreground">
              Provisional Diagnosis & Recommendations
            </h3>

            {/* Diagnosis: Right & Left Ear */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Provisional Diagnosis : Right Ear</label>
                <input
                  type="text"
                  {...register('provisionalDiagnosisRight')}
                  placeholder="Enter diagnosis for right ear"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Provisional Diagnosis : Left Ear</label>
                <input
                  type="text"
                  {...register('provisionalDiagnosisLeft')}
                  placeholder="Enter diagnosis for left ear"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Recommendation Checkboxes */}
            <div className="space-y-2.5">
              <label className="text-sm font-medium block">Recommendation</label>
              <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                {recommendationTypes?.map((rec) => (
                  <label
                    key={rec.id}
                    className="flex items-center space-x-2 text-sm cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={recommendationTypeIds.includes(rec.id)}
                      onChange={() => toggleRecommendation(rec.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                    />
                    <span className="font-medium text-foreground">{rec.label}</span>
                  </label>
                ))}
              </div>

              {/* Others (Specify) */}
              <div className="pt-2">
                <label className="text-sm font-medium">Others (Specify)</label>
                <input
                  type="text"
                  {...register('recommendationOther')}
                  placeholder="Specify other recommendations"
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Tested By Staff */}
            <div className="pt-3 border-t border-border">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tested By</label>
                <select
                  {...register('testedBy')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Select Staff --</option>
                  {staffList
                    .filter((s) => s.status !== 'deleted')
                    .map((s) => (
                      <option key={s.id} value={s.fullName}>
                        {s.employeeId} — {s.fullName}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Remarks / Notes */}
          <div>
            <label className="text-sm font-semibold">Remarks / Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="E.g. Diagnostic ABR scheduled, middle ear effusion noted..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className={isCompleteMode ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
            >
              {mutation.isPending
                ? 'Saving...'
                : isCompleteMode
                ? 'Complete Diagnostic Evaluation'
                : initialData
                ? 'Save Changes'
                : 'Schedule Follow-up'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
