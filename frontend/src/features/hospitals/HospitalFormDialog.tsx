import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hospitalsService, districtsService, audiologistsService } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';
import type { Hospital } from '../../types';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  state: z.string().min(1, 'State is required'),
  districtId: z.string().min(1, 'District is required'),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  primaryAudiologistId: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type FormData = z.infer<typeof schema>;

interface HospitalFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hospital?: Hospital;
}

export function HospitalFormDialog({ isOpen, onClose, hospital }: HospitalFormDialogProps) {
  const queryClient = useQueryClient();
  const [state, setState] = useState(hospital?.state ?? '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: hospital?.name ?? '',
      state: hospital?.state ?? '',
      districtId: hospital?.districtId ?? '',
      address: hospital?.address ?? '',
      contactPerson: hospital?.contactPerson ?? '',
      contactPhone: hospital?.contactPhone ?? '',
      primaryAudiologistId: hospital?.primaryAudiologistId ?? '',
      status: hospital?.status ?? 'active',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: hospital?.name ?? '',
        state: hospital?.state ?? '',
        districtId: hospital?.districtId ?? '',
        address: hospital?.address ?? '',
        contactPerson: hospital?.contactPerson ?? '',
        contactPhone: hospital?.contactPhone ?? '',
        primaryAudiologistId: hospital?.primaryAudiologistId ?? '',
        status: hospital?.status ?? 'active',
      });
      setState(hospital?.state ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, hospital]);

  const { data: states } = useQuery({
    queryKey: ['districts', 'states'],
    queryFn: () => districtsService.listStates(),
  });
  const { data: districts } = useQuery({
    queryKey: ['districts', 'byState', state],
    queryFn: () => districtsService.listByState(state),
    enabled: !!state,
  });
  const { data: audiologists } = useQuery({
    queryKey: ['audiologists', hospital?.id],
    queryFn: () => audiologistsService.list(hospital!.id),
    enabled: !!hospital,
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const { state: _state, ...payload } = data;
      void _state;
      // Strip empty strings — empty string is not a valid UUID for FK fields
      const cleanPayload = {
        ...payload,
        address: payload.address || undefined,
        contactPerson: payload.contactPerson || undefined,
        contactPhone: payload.contactPhone || undefined,
        primaryAudiologistId: payload.primaryAudiologistId || undefined,
      };
      return hospital
        ? hospitalsService.update(hospital.id, cleanPayload)
        : hospitalsService.create(cleanPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      toast.success(hospital ? 'Hospital updated successfully!' : 'Hospital created successfully!');
      onClose();
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to save hospital.'),
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{hospital ? 'Edit Hospital' : 'Add Hospital'}</h2>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Hospital Name *</label>
            <Input {...register('name')} />
            {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">State *</label>
              <select
                {...register('state')}
                onChange={(e) => setState(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1"
              >
                <option value="">-- Select --</option>
                {states?.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.state && (
                <span className="text-xs text-destructive">{errors.state.message}</span>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">District *</label>
              <select
                {...register('districtId')}
                disabled={!state}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1"
              >
                <option value="">-- Select --</option>
                {districts?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {errors.districtId && (
                <span className="text-xs text-destructive">{errors.districtId.message}</span>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Address</label>
            <Input {...register('address')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Contact Person</label>
              <Input {...register('contactPerson')} />
            </div>
            <div>
              <label className="text-sm font-medium">Contact Phone</label>
              <Input {...register('contactPhone')} />
            </div>
          </div>

          {hospital && (
            <div>
              <label className="text-sm font-medium">Primary Audiologist</label>
              <select
                {...register('primaryAudiologistId')}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1"
              >
                <option value="">-- Unassigned --</option>
                {audiologists?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {!hospital && (
            <p className="text-xs text-muted-foreground">
              Primary audiologist can be assigned after the hospital is created.
            </p>
          )}

          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              {...register('status')}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
