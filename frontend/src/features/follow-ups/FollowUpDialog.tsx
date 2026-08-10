import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { followUpsService, childrenService } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { RecommendationSelector } from '../../components/forms/RecommendationSelector';
import { toast } from 'sonner';

const schema = z.object({
  childId: z.string().min(1, 'Child is required'),
  followUpType: z.enum(['phone', 'regular', 'not_applicable']),
  scheduledDate: z.string().min(1, 'Date is required'),
  provisionalDiagnosisRight: z.string().optional(),
  provisionalDiagnosisLeft: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface FollowUpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  // If provided, we are editing/rescheduling
  initialData?: {
    id: string;
    childId: string;
    scheduledDate: string;
    notes?: string;
  };
  // If provided, we are adding for a specific child
  defaultChildId?: string;
}

export function FollowUpDialog({
  isOpen,
  onClose,
  initialData,
  defaultChildId,
}: FollowUpDialogProps) {
  const queryClient = useQueryClient();
  const [recommendationTypeIds, setRecommendationTypeIds] = useState<string[]>([]);

  const { data: children } = useQuery({
    queryKey: ['children'],
    queryFn: () => childrenService.list(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      childId: defaultChildId || '',
      followUpType: 'regular',
      scheduledDate: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          childId: initialData.childId,
          followUpType: 'regular',
          scheduledDate: initialData.scheduledDate.substring(0, 10),
          notes: initialData.notes || '',
        });
      } else {
        reset({
          childId: defaultChildId || '',
          followUpType: 'regular',
          scheduledDate: '',
          notes: '',
        });
        setRecommendationTypeIds([]);
      }
    }
  }, [isOpen, initialData, defaultChildId, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = { ...data, recommendationTypeIds };

      if (initialData?.id) {
        if (data.scheduledDate.substring(0, 10) !== initialData.scheduledDate.substring(0, 10)) {
          await followUpsService.reschedule(
            initialData.id,
            new Date(data.scheduledDate).toISOString(),
          );
          return;
        }
        await followUpsService.update(initialData.id, payload);
        return;
      }
      await followUpsService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      toast.success(
        initialData ? 'Follow-up updated successfully!' : 'Follow-up created successfully!',
      );
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {initialData ? 'Reschedule Follow-up' : 'Schedule Follow-up'}
        </h2>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Patient</label>
            <select
              {...register('childId')}
              disabled={!!initialData || !!defaultChildId}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1"
            >
              <option value="">-- Select Patient --</option>
              {children?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.hospitalNumber})
                </option>
              ))}
            </select>
            {errors.childId && (
              <span className="text-xs text-destructive">{errors.childId.message}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Follow-up Type</label>
              <select
                {...register('followUpType')}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1"
              >
                <option value="phone">Phone Follow-up</option>
                <option value="regular">Regular Follow-up</option>
                <option value="not_applicable">Not Applicable</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Scheduled Date</label>
              <Input type="date" {...register('scheduledDate')} />
              {errors.scheduledDate && (
                <span className="text-xs text-destructive">{errors.scheduledDate.message}</span>
              )}
            </div>
          </div>

          {!initialData && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Provisional Diagnosis (Right Ear)</label>
                  <Input {...register('provisionalDiagnosisRight')} />
                </div>
                <div>
                  <label className="text-sm font-medium">Provisional Diagnosis (Left Ear)</label>
                  <Input {...register('provisionalDiagnosisLeft')} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Recommendations</label>
                <RecommendationSelector
                  selectedIds={recommendationTypeIds}
                  onChange={setRecommendationTypeIds}
                />
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium">Remarks / Notes</label>
            <textarea
              {...register('notes')}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1"
              placeholder="E.g. Repeat AABR for left ear..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
