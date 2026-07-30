import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffService } from '../../services/api/staffService';
import type { StaffMember } from '../../services/api/staffService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  X,
  Camera,
  Phone,
  Mail,
  Calendar,
  BadgeCheck,
  Search,
  Briefcase,
  GraduationCap,
  Building2,
  Clock,
  FileText,
  Trash2,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const ROLE_OPTIONS = [
  { value: 'audiologist', label: 'Audiologist' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'technician', label: 'Technician' },
  { value: 'other', label: 'Other' },
];

const schema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  fullName: z.string().min(2, 'Full name is required'),
  gender: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  mobileNumber: z.string().min(10, 'Mobile number is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['audiologist', 'doctor', 'nurse', 'technician', 'other'], {
    required_error: 'Staff role is required',
  }),
  designation: z.string().min(1, 'Designation is required'),
  department: z.string().min(1, 'Department is required'),
  qualification: z.string().min(1, 'Qualification is required'),
  licenseNumber: z.string().min(1, 'License / Registration number is required'),
  yearsOfExperience: z.coerce.number({ invalid_type_error: 'Required' }).min(0, 'Cannot be negative').max(60),
  photoUrl: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ── Sub-components ────────────────────────────────────────────────────────────

function GenderBadge({ gender }: { gender: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    male: { label: 'Male', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    female: { label: 'Female', cls: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
    other: { label: 'Other', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  };
  const { label, cls } = map[gender] ?? map['other'];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', cls)}>
      {label}
    </span>
  );
}

function RoleBadge({ role }: { role?: string | null }) {
  if (!role) return null;
  const label = ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
      {label}
    </span>
  );
}

function StaffAvatar({ staff }: { staff: StaffMember }) {
  const initials = staff.fullName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const colors = [
    'from-violet-500 to-purple-600',
    'from-pink-500 to-rose-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-sky-500 to-blue-600',
  ];
  const color = colors[staff.employeeId.charCodeAt(0) % colors.length];

  if (staff.photoUrl) {
    return (
      <img
        src={staff.photoUrl}
        alt={staff.fullName}
        className="w-14 h-14 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow"
      />
    );
  }
  return (
    <div
      className={cn(
        'w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-base ring-2 ring-white dark:ring-gray-800 shadow',
        color,
      )}
    >
      {initials}
    </div>
  );
}

// ── Registration Modal ────────────────────────────────────────────────────────

function LabeledField({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-foreground">
        {label} <span className="text-destructive">*</span>
      </label>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

function StaffRegistrationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const photoRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { gender: 'male' } });

  const mutation = useMutation({
    mutationFn: staffService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff registered successfully!');
      reset();
      setPhotoPreview(null);
      onClose();
    },
    onError: () => toast.error('Failed to register staff.'),
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be under 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotoPreview(dataUrl);
      setValue('photoUrl', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: FormData) => mutation.mutate(data);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal — scrollable */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 rounded-t-2xl shrink-0"
          style={{ background: 'linear-gradient(135deg, #1a0a4e 0%, #5b21b6 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Register Staff</h2>
              <p className="text-xs text-white/60">All fields marked * are mandatory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Photo upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-violet-200 dark:ring-violet-900 shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-100 to-purple-200 dark:from-violet-900/40 dark:to-purple-900/40 flex items-center justify-center ring-4 ring-violet-200 dark:ring-violet-900 shadow-lg">
                    <Users className="h-10 w-10 text-violet-400" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center text-white shadow-md transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">Click camera icon to upload profile photo</span>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            {/* ── Section: Basic Info ── */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 pb-1 border-b">
                Basic Information
              </p>
              <div className="grid grid-cols-2 gap-4">
                <LabeledField label="Employee ID" error={errors.employeeId?.message}>
                  <Input {...register('employeeId')} placeholder="e.g. EMP001" className={cn('mt-1', errors.employeeId && 'border-destructive')} />
                </LabeledField>

                <LabeledField label="Gender" error={errors.gender?.message}>
                  <select
                    {...register('gender')}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </LabeledField>

                <LabeledField label="Full Name" error={errors.fullName?.message} className="col-span-2">
                  <Input {...register('fullName')} placeholder="e.g. Dr. Anitha Rao" className={cn('mt-1', errors.fullName && 'border-destructive')} />
                </LabeledField>

                <LabeledField label="Date of Birth" error={errors.dateOfBirth?.message}>
                  <Input type="date" {...register('dateOfBirth')} className={cn('mt-1', errors.dateOfBirth && 'border-destructive')} />
                </LabeledField>

                <LabeledField label="Mobile Number" error={errors.mobileNumber?.message}>
                  <Input {...register('mobileNumber')} placeholder="10-digit number" className={cn('mt-1', errors.mobileNumber && 'border-destructive')} />
                </LabeledField>

                <LabeledField label="Email Address" error={errors.email?.message} className="col-span-2">
                  <Input type="email" {...register('email')} placeholder="staff@aiish.gov.in" className={cn('mt-1', errors.email && 'border-destructive')} />
                </LabeledField>
              </div>
            </div>

            {/* ── Section: Professional Details ── */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 pb-1 border-b">
                Professional Details
              </p>
              <div className="grid grid-cols-2 gap-4">
                <LabeledField label="Staff Role" error={errors.role?.message}>
                  <select
                    {...register('role')}
                    className={cn(
                      'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1',
                      errors.role && 'border-destructive',
                    )}
                  >
                    <option value="">-- Select Role --</option>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </LabeledField>

                <LabeledField label="Designation" error={errors.designation?.message}>
                  <Input {...register('designation')} placeholder="e.g. Senior Audiologist" className={cn('mt-1', errors.designation && 'border-destructive')} />
                </LabeledField>

                <LabeledField label="Department" error={errors.department?.message}>
                  <Input {...register('department')} placeholder="e.g. POCD" className={cn('mt-1', errors.department && 'border-destructive')} />
                </LabeledField>

                <LabeledField label="Years of Experience" error={errors.yearsOfExperience?.message}>
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    {...register('yearsOfExperience')}
                    placeholder="e.g. 5"
                    className={cn('mt-1', errors.yearsOfExperience && 'border-destructive')}
                  />
                </LabeledField>

                <LabeledField label="Qualification" error={errors.qualification?.message} className="col-span-2">
                  <Input {...register('qualification')} placeholder="e.g. M.Sc. Audiology, BASLP" className={cn('mt-1', errors.qualification && 'border-destructive')} />
                </LabeledField>

                <LabeledField label="License / Registration Number" error={errors.licenseNumber?.message} className="col-span-2">
                  <Input {...register('licenseNumber')} placeholder="e.g. RCI/AUD/12345" className={cn('mt-1', errors.licenseNumber && 'border-destructive')} />
                </LabeledField>
              </div>
            </div>
          </div>

          {/* Sticky footer */}
          <div className="sticky bottom-0 px-6 py-4 border-t border-border bg-card flex gap-3 rounded-b-2xl">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 font-semibold"
              disabled={mutation.isPending}
              style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', border: 'none', color: 'white' }}
            >
              {mutation.isPending ? 'Registering...' : 'Register Staff'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffService.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member removed successfully.');
      setDeleteConfirmId(null);
    },
    onError: () => toast.error('Failed to remove staff member.'),
  });

  const filtered = staffList.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      (s.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (s.department ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (s.designation ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const formatDob = (dob?: string | null) => {
    if (!dob) return '—';
    return new Date(dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Page Header */}
      <div
        className="rounded-2xl p-6 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #1a0a4e 0%, #5b21b6 60%, #7c3aed 100%)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Staff Directory</h1>
            <p className="text-sm text-white/60 mt-0.5">
              {staffList.length} staff member{staffList.length !== 1 ? 's' : ''} registered
            </p>
          </div>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 font-semibold"
          style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', border: 'none', color: 'white' }}
        >
          <UserPlus className="h-4 w-4" />
          Register Staff
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, ID, department, designation or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
        />
      </div>

      {/* Staff Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Users className="h-10 w-10 text-violet-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">No staff found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? 'Try a different search term.'
                : 'Click "Register Staff" to add the first staff member.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((staff) => (
            <div
              key={staff.id}
              className="group bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-4"
            >
              {/* Top row: avatar + name + badges */}
              <div className="flex items-start gap-3">
                <StaffAvatar staff={staff} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{staff.fullName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <BadgeCheck className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                    <span className="text-xs text-muted-foreground font-mono">{staff.employeeId}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <GenderBadge gender={staff.gender} />
                    <RoleBadge role={staff.role} />
                    {staff.status === 'deleted' && (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
                {staff.status !== 'deleted' && (
                  <button
                    onClick={() => setDeleteConfirmId(staff.id)}
                    className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remove staff member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Inline delete confirmation */}
              {deleteConfirmId === staff.id && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 flex flex-col gap-2">
                  <p className="text-sm font-medium text-destructive">
                    Remove <span className="font-bold">{staff.fullName}</span>? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="flex-1 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(staff.id)}
                      disabled={deleteMutation.isPending}
                      className="flex-1 py-1.5 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 disabled:opacity-60 transition-colors"
                    >
                      {deleteMutation.isPending ? 'Removing…' : 'Yes, Remove'}
                    </button>
                  </div>
                </div>
              )}

              {/* Professional info */}
              <div className="space-y-1.5 text-sm border-t border-border pt-3">
                {staff.designation && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                    <span className="truncate">{staff.designation}</span>
                  </div>
                )}
                {staff.department && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                    <span className="truncate">{staff.department}</span>
                  </div>
                )}
                {staff.qualification && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                    <span className="truncate">{staff.qualification}</span>
                  </div>
                )}
                {staff.licenseNumber && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                    <span className="truncate font-mono text-xs">{staff.licenseNumber}</span>
                  </div>
                )}
                {staff.yearsOfExperience != null && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                    <span>{staff.yearsOfExperience} yr{staff.yearsOfExperience !== 1 ? 's' : ''} experience</span>
                  </div>
                )}
              </div>

              {/* Contact info */}
              <div className="space-y-1.5 text-sm border-t border-border pt-3">
                {staff.dateOfBirth && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>{formatDob(staff.dateOfBirth)}</span>
                  </div>
                )}
                {staff.mobileNumber && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{staff.mobileNumber}</span>
                  </div>
                )}
                {staff.email && (
                  <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{staff.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <StaffRegistrationModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
