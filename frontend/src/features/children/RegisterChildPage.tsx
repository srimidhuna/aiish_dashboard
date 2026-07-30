import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { childrenService, mastersService, screeningsService } from '../../services/api';
import { staffService } from '../../services/api/staffService';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';
import { FormSection } from '../../components/forms/FormSection';
import { FormCard } from '../../components/forms/FormCard';
import { FormStepper } from '../../components/forms/FormStepper';
import { RiskFactorChecklist } from '../../components/forms/RiskFactorChecklist';
import { ReflexSelector } from '../../components/forms/ReflexSelector';
import type { LocationFilterValue } from '../../components/shared/LocationFilter';
import { useDefaultLocationFilters } from '../../hooks/useDefaultLocationFilters';
import { cn } from '../../lib/utils';
import { ScreeningStep } from '../../components/forms/ScreeningStep';

const testResult = z.enum(['pass', 'refer', 'noisy', 'cnt', 'not_done']);
const passReferOnly = z.enum(['pass', 'refer', 'cnt', 'not_done']);

const DRAFT_KEY = 'registration_draft';
const schema = z.object({
  hospitalNumber: z.string().min(1, 'Hospital number is required'),
  pocdNumber: z.string().optional(),
  uniqueMotherId: z.string().optional(),

  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Required'),
  timeOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']),
  birthWeightGrams: z.coerce.number().min(0, 'Invalid weight').optional(),
  gestationalAgeWeeks: z.coerce.number().min(20).max(45).optional(),
  placeOfBirth: z.string().optional(),

  motherName: z.string().min(1, 'Required'),
  fatherName: z.string().optional(),
  contactNumber: z.string().min(10, 'Invalid number'),
  whatsappNumber: z.string().optional(),
  phone2: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  taluk: z.string().optional(),
  pinCode: z.string().optional(),
  parentDistrict: z.string().optional(),
  parentState: z.string().optional(),
  guardianPhotoUrl: z.string().optional(),

  hospitalOfBirthId: z.string().min(1, 'Please select a hospital'),
  districtId: z.string().min(1, 'Please select a district'),
  audiologistId: z.string().optional(),
  assessingStaffId: z.string().optional(),

  referredBy: z.enum(['pocd_staff', 'doctor', 'self', 'others']).optional(),
  referredByOther: z.string().optional(),
  nbsCentre: z.string().optional(),
  region: z.enum(['urban', 'rural']).optional(),
  socioEconomicStatus: z.enum(['aay', 'bpl', 'apl']).optional(),
  educationLevel: z
    .enum(['illiterate', 'primary', 'high_school', 'graduate_and_above', 'others'])
    .optional(),
  religion: z.enum(['hindu', 'muslim', 'christian', 'others']).optional(),
  deliveryType: z.enum(['normal', 'caesarean', 'breech', 'home']).optional(),
  noOfSiblings: z.coerce.number().min(0).optional(),

  riskFactorIds: z.array(z.string()).default([]),

  familyHistoryHearingLoss: z.boolean().default(false),
  consanguinityDegree: z.enum(['first', 'second', 'third']).optional(),
  caregiverConcern: z.boolean().default(false),
  reflexMoro: z.enum(['normal', 'abnormal']).optional(),
  reflexRooting: z.enum(['normal', 'abnormal']).optional(),
  reflexBabinski: z.enum(['normal', 'abnormal']).optional(),
  reflexPalmar: z.enum(['normal', 'abnormal']).optional(),
  reflexPlantar: z.enum(['normal', 'abnormal']).optional(),

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

const STEPS = [
  { id: 'child', label: 'Child Info' },
  { id: 'parent', label: 'Parent Info' },
  { id: 'sociodemo', label: 'Socio-Demographics' },
  { id: 'risk', label: 'High-Risk Register' },
  { id: 'assessment', label: "Audiologist's Assessment" },
  { id: 'screening', label: 'Screening' },
  { id: 'notes', label: 'Additional Notes' },
  { id: 'review', label: 'Review & Confirm' },
];

const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
  0: ['firstName', 'lastName', 'dateOfBirth'],
  1: ['motherName', 'contactNumber'],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
};

export default function RegisterChildPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [hrrFindings, setHrrFindings] = useState<'no_hrr' | 'hrr'>('no_hrr');
  const defaults = useDefaultLocationFilters();
  const [location, setLocation] = useState<LocationFilterValue>({});
  const [guardianPhotoPreview, setGuardianPhotoPreview] = useState<string | null>(null);
  const guardianPhotoRef = useRef<HTMLInputElement>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    setValue,
    getValues,
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: 'male',
      riskFactorIds: [],
      familyHistoryHearingLoss: false,
      caregiverConcern: false,
    },
  });

  const riskFactorIds = watch('riskFactorIds');
  const referredByValue = watch('referredBy');
  const dateOfBirthValue = watch('dateOfBirth');

  const { data: staffList = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffService.list(),
  });

  const { data: riskCategories = [] } = useQuery({
    queryKey: ['risk-categories'],
    queryFn: () => mastersService.listRiskCategories(),
  });

  const babyAge = (() => {
    if (!dateOfBirthValue) return null;
    const dob = new Date(dateOfBirthValue);
    if (Number.isNaN(dob.getTime())) return null;
    const days = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return null;
    if (days < 60) return `${days} day${days === 1 ? '' : 's'}`;
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? '' : 's'}`;
  })();

  useEffect(() => {
    if (defaults.hospitalId) {
      setLocation(defaults);
      setValue('hospitalOfBirthId', defaults.hospitalId);
      setValue('districtId', defaults.districtId ?? '');
      setValue('audiologistId', defaults.audiologistId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaults.hospitalId]);

  useEffect(() => {
    if (editId) return;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { values: FormData; step: number; savedAt: string };
      toast('Unsaved registration draft found', {
        description: `Saved ${new Date(saved.savedAt).toLocaleString()}`,
        action: {
          label: 'Restore',
          onClick: () => {
            reset(saved.values);
            setCurrentStep(saved.step);
            if (saved.values.hospitalOfBirthId) {
              setLocation({
                hospitalId: saved.values.hospitalOfBirthId,
                districtId: saved.values.districtId,
                audiologistId: saved.values.audiologistId,
              });
            }
          },
        },
      });
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editId) return;
    const interval = setInterval(() => {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          values: getValues(),
          step: currentStep,
          savedAt: new Date().toISOString(),
        }),
      );
    }, 30000);
    return () => clearInterval(interval);
  }, [currentStep, getValues]);

  useEffect(() => {
    if (!location.hospitalId) return;
    setValue('hospitalOfBirthId', location.hospitalId);
    setValue('districtId', location.districtId ?? '');
    setValue('audiologistId', location.audiologistId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hospitalId, location.districtId, location.audiologistId]);

  const { data: editChild, isLoading: isEditLoading } = useQuery({
    queryKey: ['child', editId],
    queryFn: () => childrenService.getById(editId!),
    enabled: !!editId,
  });

  const { data: editScreenings } = useQuery({
    queryKey: ['screenings', editId],
    queryFn: () => screeningsService.getByChildId(editId!),
    enabled: !!editId,
  });

  useEffect(() => {
    if (editChild) {
      const latestScreening = editScreenings?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())?.[0];
      reset({
        ...editChild,
        dateOfBirth: editChild.dateOfBirth?.split('T')[0] ?? '',
        hospitalOfBirthId: editChild.hospitalOfBirthId,
        districtId: editChild.districtId,
        assessingStaffId: editChild.assessingStaffId,
        riskFactorIds: editChild.riskFactorIds ?? [],
        familyHistoryHearingLoss: editChild.assessment?.familyHistoryHearingLoss ?? false,
        consanguinityDegree: editChild.assessment?.consanguinityDegree,
        caregiverConcern: editChild.assessment?.caregiverConcern ?? false,
        reflexMoro: editChild.assessment?.reflexMoro,
        reflexRooting: editChild.assessment?.reflexRooting,
        reflexBabinski: editChild.assessment?.reflexBabinski,
        reflexPalmar: editChild.assessment?.reflexPalmar,
        reflexPlantar: editChild.assessment?.reflexPlantar,
        remarks: editChild.remarks,
        entFindings: latestScreening?.entFindings ?? '',
        boaResult: latestScreening?.boaResult ?? '',
        teoaeRight: latestScreening?.teoaeRight ?? '',
        teoaeLeft: latestScreening?.teoaeLeft ?? '',
        dpoaeRight: latestScreening?.dpoaeRight ?? '',
        dpoaeLeft: latestScreening?.dpoaeLeft ?? '',
        aabr1Right: latestScreening?.aabr1Right ?? '',
        aabr1Left: latestScreening?.aabr1Left ?? '',
        aabr2Right: latestScreening?.aabr2Right ?? '',
        aabr2Left: latestScreening?.aabr2Left ?? '',
        overallResult: latestScreening?.overallResult ?? '',
      } as any);
      if (editChild.hospitalOfBirthId) {
        setLocation({
          hospitalId: editChild.hospitalOfBirthId,
          districtId: editChild.districtId,
          audiologistId: editChild.assessingStaffId,
        });
      }
    }
  }, [editChild, editScreenings, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      try {
        const {
        familyHistoryHearingLoss,
        consanguinityDegree,
        caregiverConcern,
        reflexMoro,
        reflexRooting,
        reflexBabinski,
        reflexPalmar,
        reflexPlantar,
        entFindings,
        boaResult,
        teoaeRight,
        teoaeLeft,
        dpoaeRight,
        dpoaeLeft,
        aabr1Right,
        aabr1Left,
        aabr2Right,
        aabr2Left,
        overallResult,
        // Strip form-only fields that don't belong in the baby payload
        audiologistId: _audiologistId,
        guardianPhotoUrl: _guardianPhotoUrl,
        ...rest
      } = data;

      // Strip empty-string optional fields to avoid backend @IsIn / @IsEmail failures
      const cleanRest = Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      ) as typeof rest;

      // Coerce numeric fields — getValues() returns raw DOM strings, backend needs integers
      const toInt = (v: unknown): number | undefined => {
        const n = parseInt(String(v), 10);
        return isNaN(n) ? undefined : n;
      };

      // Resolve assessing staff snapshot — persisted even if staff is deleted later
      const selectedStaff = cleanRest.assessingStaffId
        ? staffList.find((s) => s.id === cleanRest.assessingStaffId)
        : undefined;

      const payload = {
        ...cleanRest,
        birthWeightGrams: toInt(cleanRest.birthWeightGrams),
        gestationalAgeWeeks: toInt(cleanRest.gestationalAgeWeeks),
        noOfSiblings: toInt(cleanRest.noOfSiblings),
        // Snapshot assessing staff details so they survive deletion
        assessingStaffEmployeeId: selectedStaff?.employeeId,
        assessingStaffName: selectedStaff?.fullName,
        // Strip empty-string enum values from assessment
        assessment: Object.fromEntries(
          Object.entries({
            familyHistoryHearingLoss,
            consanguinityDegree,
            caregiverConcern,
            reflexMoro,
            reflexRooting,
            reflexBabinski,
            reflexPalmar,
            reflexPlantar,
          }).filter(([, v]) => (v as any) !== '' && v !== undefined && v !== null)
        ) as Parameters<typeof childrenService.create>[0]['assessment'],
      };

      const { screeningsService } = await import('../../services/api');

      if (editId) {
        const updatedChild = await childrenService.update(editId, payload);
        
        if (overallResult || boaResult || teoaeRight || aabr1Right) {
          const childScreenings = await screeningsService.getByChildId(editId);
          const existingScreening = childScreenings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          
          const screeningData = {
            childId: editId,
            status: 'completed' as const,
            entFindings,
            boaResult: boaResult as 'pass' | 'refer' | 'cnt' | 'not_done' | undefined,
            teoaeRight,
            teoaeLeft,
            dpoaeRight,
            dpoaeLeft,
            aabr1Right: aabr1Right as 'pass' | 'refer' | 'cnt' | 'not_done' | undefined,
            aabr1Left: aabr1Left as 'pass' | 'refer' | 'cnt' | 'not_done' | undefined,
            aabr2Right: aabr2Right as 'pass' | 'refer' | 'cnt' | 'not_done' | undefined,
            aabr2Left: aabr2Left as 'pass' | 'refer' | 'cnt' | 'not_done' | undefined,
            overallResult,
            remarks: data.remarks,
          };

          if (existingScreening) {
            await screeningsService.update(existingScreening.id, screeningData);
          } else {
            await screeningsService.create(screeningData);
          }
        }
        return updatedChild;
      }

      const child = await childrenService.create(payload);

      if (overallResult || boaResult || teoaeRight || aabr1Right) {
        await screeningsService.create({
          childId: child.id,
          status: 'completed',
          entFindings,
          boaResult: boaResult as 'pass' | 'refer' | 'cnt' | 'not_done' | undefined,
          teoaeRight,
          teoaeLeft,
          dpoaeRight,
          dpoaeLeft,
          aabr1Right: aabr1Right as 'pass' | 'refer' | 'cnt' | 'not_done' | undefined,
          aabr1Left: aabr1Left as 'pass' | 'refer' | 'cnt' | 'not_done' | undefined,
          aabr2Right: aabr2Right as 'pass' | 'refer' | 'cnt' | 'not_done' | undefined,
          aabr2Left: aabr2Left as 'pass' | 'refer' | 'cnt' | 'not_done' | undefined,
          overallResult,
          remarks: data.remarks,
        });
      }

        return child;
      } catch (err) {
        console.error("REGISTRATION ERROR:", err);
        throw err;
      }
    },
    onSuccess: async (data) => {
      // If a follow-up date was scheduled (all tests failed), create the follow-up record now
      if (followUpDate) {
        try {
          const { followUpsService } = await import('../../services/api');
          await followUpsService.create({
            childId: data.id,
            followUpType: 'regular',
            scheduledDate: new Date(followUpDate).toISOString(),
            notes: 'Scheduled after all screening tests resulted in refer/CNT/not done. Please repeat full screening on the next visit.',
          });
          queryClient.invalidateQueries({ queryKey: ['followUps'] });
        } catch (e: any) {
          console.error('[RegisterChild] Failed to create follow-up:', e);
          const msg = e.response?.data?.message || e.message || 'Unknown error';
          const detail = Array.isArray(msg) ? msg.join(', ') : msg;
          toast.error(`Follow-up creation failed: ${detail}`, { duration: 10000 });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      localStorage.removeItem(DRAFT_KEY);
      toast.success(followUpDate
        ? `Child registered! Follow-up scheduled for ${new Date(followUpDate).toLocaleDateString()}.`
        : 'Child registered successfully!');
      navigate(`/children/${data.id}`);
    },
    onError: (err: any) => {
      console.error('[RegisterChild] API error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to register child.';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const onNext = async () => {
    const isStepValid = await trigger(STEP_FIELDS[currentStep]);
    if (isStepValid) {
      if (editId && currentStep === 4) {
        setCurrentStep(6);
      } else {
        setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
      }
    }
  };

  const onPrev = () => {
    if (editId && currentStep === 6) {
      setCurrentStep(4);
    } else {
      setCurrentStep((s) => Math.max(s - 1, 0));
    }
  };

  const onSaveDraft = () => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ values: getValues(), step: currentStep, savedAt: new Date().toISOString() }),
    );
    toast.success('Draft saved. It will be offered back to you next time you open this form.');
  };


  const percentComplete = Math.round(((currentStep + 1) / STEPS.length) * 100);

  // currentStep is the index in STEPS. For FormStepper we might need to map it.
  // Actually, FormStepper just takes currentStep and highlights that index.
  // We'll leave FormStepper as is and it will just jump over the screening step when edited,
  // or we can just render STEPS as is and it shows 'Screening' but we skip it.
  // To avoid confusion, let's keep STEPS but maybe show "Skip"

  if (isEditLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{editId ? 'Edit Child Record' : 'Register New Child'}</h1>
        <Button variant="outline" onClick={() => navigate(editId ? `/children/${editId}` : '/children')}>
          Cancel
        </Button>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Step {currentStep + 1} of {STEPS.length}
        </span>
        <span>{percentComplete}% complete</span>
      </div>
      <FormStepper steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />

      <form onSubmit={(e) => e.preventDefault()}>
        <FormCard title={STEPS[currentStep].label}>
          {currentStep === 0 && (
            <FormSection title="Child Information">
              <div className="col-span-2">
                <label className="text-sm font-medium">MR Records No.</label>
                <Input {...register('hospitalNumber')} />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">POCD Number</label>
                <Input {...register('pocdNumber')} />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Unique Mother ID</label>
                <Input {...register('uniqueMotherId')} />
              </div>

              <div className="col-span-3">
                <label className="text-sm font-medium">First Name *</label>
                <Input
                  {...register('firstName')}
                  className={cn(errors.firstName && 'border-destructive')}
                />
                {errors.firstName && (
                  <span className="text-xs text-destructive">{errors.firstName.message}</span>
                )}
              </div>
              <div className="col-span-3">
                <label className="text-sm font-medium">Last Name *</label>
                <Input
                  {...register('lastName')}
                  className={cn(errors.lastName && 'border-destructive')}
                />
                {errors.lastName && (
                  <span className="text-xs text-destructive">{errors.lastName.message}</span>
                )}
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">Gender</label>
                <select
                  {...register('gender')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Date of Birth *</label>
                <Input
                  type="date"
                  {...register('dateOfBirth')}
                  className={cn(errors.dateOfBirth && 'border-destructive')}
                />
                {errors.dateOfBirth && (
                  <span className="text-xs text-destructive">{errors.dateOfBirth.message}</span>
                )}
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Age (baby)</label>
                <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 text-sm mt-1 text-muted-foreground">
                  {babyAge ?? '—'}
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Time of Birth</label>
                <Input type="time" {...register('timeOfBirth')} />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">Birth Weight (g)</label>
                <Input type="number" {...register('birthWeightGrams')} />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Gestational Age (weeks)</label>
                <Input type="number" {...register('gestationalAgeWeeks')} />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Place of Birth <span className="text-xs text-muted-foreground font-normal ml-1">e.g. Rajiv Gandhi Government General Hospital, Chennai</span></label>
                <Input {...register('placeOfBirth')} />
              </div>

              <input type="hidden" {...register('hospitalOfBirthId')} />
              <input type="hidden" {...register('districtId')} />
              <input type="hidden" {...register('audiologistId')} />
            </FormSection>
          )}

          {currentStep === 1 && (
            <FormSection title="Parent Information">
              <div className="col-span-3">
                <label className="text-sm font-medium">Mother&apos;s Name *</label>
                <Input
                  {...register('motherName')}
                  className={cn(errors.motherName && 'border-destructive')}
                />
                {errors.motherName && (
                  <span className="text-xs text-destructive">{errors.motherName.message}</span>
                )}
              </div>
              <div className="col-span-3">
                <label className="text-sm font-medium">Father&apos;s Name</label>
                <Input {...register('fatherName')} />
              </div>

              <div className="col-span-3">
                <label className="text-sm font-medium">Mobile Number *</label>
                <Input
                  {...register('contactNumber')}
                  placeholder="10-digit mobile number"
                  className={cn(errors.contactNumber && 'border-destructive')}
                />
                {errors.contactNumber && (
                  <span className="text-xs text-destructive">{errors.contactNumber.message}</span>
                )}
              </div>
              <div className="col-span-3">
                <label className="text-sm font-medium">WhatsApp Number</label>
                <Input {...register('whatsappNumber')} placeholder="WhatsApp number" />
              </div>
              <div className="col-span-3">
                <label className="text-sm font-medium">Alternate Phone</label>
                <Input {...register('phone2')} />
              </div>

              <div className="col-span-3">
                <label className="text-sm font-medium">Email Address</label>
                <Input type="email" {...register('email')} />
              </div>
              <div className="col-span-3">
                <label className="text-sm font-medium">PIN Code</label>
                <Input {...register('pinCode')} />
              </div>

              <div className="col-span-6">
                <label className="text-sm font-medium">Address *</label>
                <Input
                  {...register('address')}
                  className={cn(errors.address && 'border-destructive')}
                />
                {errors.address && (
                  <span className="text-xs text-destructive">{errors.address.message}</span>
                )}
              </div>
              <div className="col-span-3">
                <label className="text-sm font-medium">Taluk *</label>
                <Input {...register('taluk')} className={cn(errors.taluk && 'border-destructive')} />
                {errors.taluk && <span className="text-xs text-destructive">{errors.taluk.message}</span>}
              </div>
              <div className="col-span-3">
                <label className="text-sm font-medium">District *</label>
                <Input {...register('parentDistrict')} className={cn(errors.parentDistrict && 'border-destructive')} />
                {errors.parentDistrict && <span className="text-xs text-destructive">{errors.parentDistrict.message}</span>}
              </div>
              <div className="col-span-3">
                <label className="text-sm font-medium">State *</label>
                <select
                  {...register('parentState')}
                  className={cn(
                    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1',
                    errors.parentState && 'border-destructive'
                  )}
                >
                  <option value="">-- Select State --</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Assam">Assam</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Goa">Goa</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="West Bengal">West Bengal</option>
                  {/* Union Territories */}
                  <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                  <option value="Chandigarh">Chandigarh</option>
                  <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                  <option value="Ladakh">Ladakh</option>
                  <option value="Lakshadweep">Lakshadweep</option>
                  <option value="Puducherry">Puducherry</option>
                </select>
                {errors.parentState && <span className="text-xs text-destructive">{errors.parentState.message}</span>}
              </div>

              {/* Guardian Photo Upload */}
              <div className="col-span-6">
                <label className="text-sm font-medium">Photo of Mother / Father / Guardian</label>
                <div className="mt-2 flex items-start gap-5">
                  {/* Preview */}
                  <div className="shrink-0">
                    {guardianPhotoPreview ? (
                      <img
                        src={guardianPhotoPreview}
                        alt="Guardian"
                        className="w-24 h-24 rounded-xl object-cover ring-2 ring-violet-300 shadow"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center ring-2 ring-border">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Upload controls */}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => guardianPhotoRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      Upload Photo
                    </button>
                    {guardianPhotoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setGuardianPhotoPreview(null);
                          setValue('guardianPhotoUrl', '');
                          if (guardianPhotoRef.current) guardianPhotoRef.current.value = '';
                        }}
                        className="text-xs text-destructive hover:underline text-left"
                      >
                        Remove photo
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground">JPG, PNG or WEBP. Max 5 MB.</p>
                  </div>

                  <input
                    ref={guardianPhotoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error('Photo must be under 5 MB');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const dataUrl = ev.target?.result as string;
                        setGuardianPhotoPreview(dataUrl);
                        setValue('guardianPhotoUrl', dataUrl);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>
              </div>
            </FormSection>
          )}

          {currentStep === 2 && (
            <FormSection title="Socio-Demographics">
              <div className="col-span-3">
                <label className="text-sm font-medium">Referred By</label>
                <select
                  {...register('referredBy')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                >
                  <option value="">-- Select --</option>
                  <option value="pocd_staff">POCD Staff</option>
                  <option value="doctor">Doctor</option>
                  <option value="self">Self</option>
                  <option value="others">Others</option>
                </select>
              </div>
              {referredByValue === 'others' && (
                <div className="col-span-3">
                  <label className="text-sm font-medium">Referred By - Specify</label>
                  <Input {...register('referredByOther')} placeholder="Specify referral source" />
                </div>
              )}
              <div className="col-span-3">
                <label className="text-sm font-medium">Out Reach Service / NBS Centre</label>
                <Input {...register('nbsCentre')} />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">Region</label>
                <select
                  {...register('region')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                >
                  <option value="">-- Select --</option>
                  <option value="urban">Urban</option>
                  <option value="rural">Rural</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Socio-Economic Status</label>
                <select
                  {...register('socioEconomicStatus')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                >
                  <option value="">-- Select --</option>
                  <option value="aay">AAY</option>
                  <option value="bpl">BPL</option>
                  <option value="apl">APL</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Religion</label>
                <select
                  {...register('religion')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                >
                  <option value="">-- Select --</option>
                  <option value="hindu">Hindu</option>
                  <option value="muslim">Muslim</option>
                  <option value="christian">Christian</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div className="col-span-3">
                <label className="text-sm font-medium">Education Level (Parents)</label>
                <select
                  {...register('educationLevel')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                >
                  <option value="">-- Select --</option>
                  <option value="illiterate">Illiterate</option>
                  <option value="primary">Primary</option>
                  <option value="high_school">High School</option>
                  <option value="graduate_and_above">Graduation & Above</option>
                  <option value="others">Others</option>
                </select>
              </div>
              <div className="col-span-3">
                <label className="text-sm font-medium">Type of Delivery</label>
                <select
                  {...register('deliveryType')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                >
                  <option value="">-- Select --</option>
                  <option value="normal">Normal</option>
                  <option value="caesarean">Caesarean</option>
                  <option value="breech">Breech</option>
                  <option value="home">Home</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">No. of Siblings</label>
                {(() => {
                  const { ref: siblingsRef, onChange: siblingsRhfOnChange, ...siblingsRest } = register('noOfSiblings');
                  return (
                    <Input
                      type="number"
                      min={0}
                      ref={siblingsRef}
                      {...siblingsRest}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        const text = e.clipboardData.getData('text');
                        if (parseInt(text, 10) < 0) e.preventDefault();
                      }}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val < 0) {
                          e.target.value = '0';
                        }
                        siblingsRhfOnChange(e);
                      }}
                    />
                  );
                })()}
              </div>
            </FormSection>
          )}

          {currentStep === 3 && (
            <FormSection title="High-Risk Register (to be filled by Medical Professionals)">
              <div className="col-span-6">
                <RiskFactorChecklist
                  selectedIds={riskFactorIds}
                  onChange={(ids) => setValue('riskFactorIds', ids)}
                />
              </div>
              <div className="col-span-6 flex items-center gap-4 pt-2 border-t mt-2">
                <span className="text-sm font-medium">HRR findings</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="hrrFindings"
                    checked={hrrFindings === 'no_hrr'}
                    onChange={() => setHrrFindings('no_hrr')}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">No HRR (0)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="hrrFindings"
                    checked={hrrFindings === 'hrr'}
                    onChange={() => setHrrFindings('hrr')}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">HRR (1)</span>
                </label>
              </div>
            </FormSection>
          )}

          {currentStep === 4 && (
            <FormSection title="Audiologist's Assessment">
              <div className="col-span-3">
                <label className="text-sm font-medium">Staff ID (Assessing)</label>
                <select
                  {...register('assessingStaffId')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                >
                  <option value="">-- Select Staff --</option>
                  {staffList.filter(s => s.status !== 'deleted').map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.employeeId} — {s.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-3 flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('familyHistoryHearingLoss')}
                  className="h-4 w-4"
                />
                <span className="text-sm">
                  Family history of early/progressive/delayed hearing loss
                </span>
              </div>
              <div className="col-span-3 flex items-center space-x-2">
                <input type="checkbox" {...register('caregiverConcern')} className="h-4 w-4" />
                <span className="text-sm">Caregiver concern</span>
              </div>
              <div className="col-span-3">
                <label className="text-sm font-medium">Consanguinity</label>
                <select
                  {...register('consanguinityDegree')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                >
                  <option value="">None</option>
                  <option value="first">1st Degree</option>
                  <option value="second">2nd Degree</option>
                  <option value="third">3rd Degree</option>
                </select>
              </div>

              <div className="col-span-6 space-y-2">
                <h4 className="text-sm font-semibold">New Born Reflexes</h4>
                <ReflexSelector register={register} name="reflexMoro" label="Moro / Startle" />
                <ReflexSelector register={register} name="reflexRooting" label="Rooting" />
                <ReflexSelector register={register} name="reflexBabinski" label="Babinski" />
                <ReflexSelector register={register} name="reflexPalmar" label="Palmar" />
                <ReflexSelector register={register} name="reflexPlantar" label="Plantar" />
              </div>
            </FormSection>
          )}

          {currentStep === 6 && (
            <FormSection title="Additional Notes">
              <div className="col-span-6">
                <label className="text-sm font-medium">Remarks</label>
                <textarea
                  {...register('remarks')}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm mt-1"
                  placeholder="Enter any additional remarks..."
                />
              </div>
            </FormSection>
          )}

          {currentStep === 7 && (() => {
            const v = getValues();
            const fmt = (val: unknown) =>
              val === undefined || val === null || val === '' ? <span className="text-muted-foreground italic">—</span> : String(val);
            const Row = ({ label, value }: { label: string; value: unknown }) => (
              <div className="flex py-1.5 border-b border-border/50 last:border-0">
                <span className="w-56 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
                <span className="text-sm">{fmt(value)}</span>
              </div>
            );
            const SectionHead = ({ title, icon }: { title: string; icon: string }) => (
              <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0">
                <span className="text-lg">{icon}</span>
                <h3 className="text-base font-semibold tracking-tight">{title}</h3>
              </div>
            );
            const reflexLabel = (val?: string) =>
              val ? (val.charAt(0).toUpperCase() + val.slice(1)) : undefined;
            const earLabel = (val?: string) =>
              ({ pass: 'Pass', refer: 'Refer', noisy: 'Noisy', cnt: 'CNT', not_done: 'Not Done' } as Record<string, string>)[val ?? ''] ?? val;
            return (
              <div className="space-y-1">
                {/* Banner */}
                <div className="rounded-xl bg-gradient-to-r from-violet-600/15 to-blue-500/10 border border-violet-300/40 px-5 py-4 mb-6">
                  <p className="text-sm font-medium text-violet-800 dark:text-violet-300">
                    📋 Please review all the information below carefully before submitting. Once registered, changes will require editing the child profile.
                  </p>
                </div>

                {/* Step 1 — Child Info */}
                <SectionHead title="Step 1 — Child Information" icon="👶" />
                <div className="rounded-lg border border-border bg-card/60 px-4 py-2 space-y-0">
                  <Row label="MR Records No." value={v.hospitalNumber} />
                  <Row label="POCD Number" value={v.pocdNumber} />
                  <Row label="Unique Mother ID" value={v.uniqueMotherId} />
                  <Row label="First Name" value={v.firstName} />
                  <Row label="Last Name" value={v.lastName} />
                  <Row label="Gender" value={v.gender ? v.gender.charAt(0).toUpperCase() + v.gender.slice(1) : undefined} />
                  <Row label="Date of Birth" value={v.dateOfBirth} />
                  <Row label="Time of Birth" value={v.timeOfBirth} />
                  <Row label="Birth Weight (g)" value={v.birthWeightGrams} />
                  <Row label="Gestational Age (weeks)" value={v.gestationalAgeWeeks} />
                  <Row label="Place of Birth" value={v.placeOfBirth} />
                </div>

                {/* Step 2 — Parent Info */}
                <SectionHead title="Step 2 — Parent Information" icon="👨‍👩‍👧" />
                <div className="rounded-lg border border-border bg-card/60 px-4 py-2 space-y-0">
                  <Row label="Mother's Name" value={v.motherName} />
                  <Row label="Father's Name" value={v.fatherName} />
                  <Row label="Mobile Number" value={v.contactNumber} />
                  <Row label="Alternate Phone" value={v.phone2} />
                  <Row label="Email" value={v.email} />
                  <Row label="Address" value={v.address} />
                  <Row label="Taluk" value={v.taluk} />
                  <Row label="District" value={v.parentDistrict} />
                  <Row label="State" value={v.parentState} />
                  <Row label="PIN Code" value={v.pinCode} />
                  {guardianPhotoPreview && (
                    <div className="flex py-2 border-b border-border/50">
                      <span className="w-56 shrink-0 text-xs font-medium text-muted-foreground">Guardian Photo</span>
                      <img src={guardianPhotoPreview} alt="Guardian" className="w-16 h-16 rounded-lg object-cover ring-2 ring-violet-300" />
                    </div>
                  )}
                </div>

                {/* Step 3 — Socio-Demographics */}
                <SectionHead title="Step 3 — Socio-Demographics" icon="📊" />
                <div className="rounded-lg border border-border bg-card/60 px-4 py-2 space-y-0">
                  <Row label="Referred By" value={v.referredBy?.replace('_', ' ')} />
                  {v.referredBy === 'others' && (
                    <Row label="Referred By (specify)" value={v.referredByOther} />
                  )}
                  <Row label="NBS Centre" value={v.nbsCentre} />
                  <Row label="Region" value={v.region ? v.region.charAt(0).toUpperCase() + v.region.slice(1) : undefined} />
                  <Row label="Socio-Economic Status" value={v.socioEconomicStatus?.toUpperCase()} />
                  <Row label="Religion" value={v.religion ? v.religion.charAt(0).toUpperCase() + v.religion.slice(1) : undefined} />
                  <Row label="Education Level" value={v.educationLevel?.replace(/_/g, ' ')} />
                  <Row label="Delivery Type" value={v.deliveryType ? v.deliveryType.charAt(0).toUpperCase() + v.deliveryType.slice(1) : undefined} />
                  <Row label="No. of Siblings" value={v.noOfSiblings} />
                </div>

                {/* Step 4 — High-Risk Register */}
                <SectionHead title="Step 4 — High-Risk Register" icon="⚠️" />
                <div className="rounded-lg border border-border bg-card/60 px-4 py-2 space-y-0">
                  <div className="flex py-1.5 border-b border-border/50">
                    <span className="w-56 shrink-0 text-xs font-medium text-muted-foreground">Risk Factors Selected</span>
                    <span className="text-sm flex-1">
                      {(v.riskFactorIds?.length ?? 0) > 0 ? (
                        <span className="flex flex-wrap gap-1.5">
                          {v.riskFactorIds.map((id) => {
                            const cat = riskCategories.find((c) => c.id === id);
                            return (
                              <span
                                key={id}
                                className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-2.5 py-0.5 text-xs font-medium"
                              >
                                {cat?.label ?? id}
                              </span>
                            );
                          })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">None</span>
                      )}
                    </span>
                  </div>
                  <Row label="HRR Findings" value={hrrFindings === 'hrr' ? 'HRR (1)' : 'No HRR (0)'} />
                </div>

                {/* Step 5 — Audiologist Assessment */}
                <SectionHead title="Step 5 — Audiologist's Assessment" icon="🩺" />
                <div className="rounded-lg border border-border bg-card/60 px-4 py-2 space-y-0">
                  <Row
                    label="Staff ID (Assessing)"
                    value={(() => {
                      const st = staffList.find((s) => s.id === v.assessingStaffId);
                      return st ? `${st.employeeId} — ${st.fullName}` : v.assessingStaffId;
                    })()}
                  />
                  <Row label="Family History Hearing Loss" value={v.familyHistoryHearingLoss ? 'Yes' : 'No'} />
                  <Row label="Caregiver Concern" value={v.caregiverConcern ? 'Yes' : 'No'} />
                  <Row label="Consanguinity" value={v.consanguinityDegree} />
                  <Row label="Reflex — Moro/Startle" value={reflexLabel(v.reflexMoro)} />
                  <Row label="Reflex — Rooting" value={reflexLabel(v.reflexRooting)} />
                  <Row label="Reflex — Babinski" value={reflexLabel(v.reflexBabinski)} />
                  <Row label="Reflex — Palmar" value={reflexLabel(v.reflexPalmar)} />
                  <Row label="Reflex — Plantar" value={reflexLabel(v.reflexPlantar)} />
                </div>

                {/* Step 6 — Screening */}
                <SectionHead title="Step 6 — Screening" icon="🎧" />
                <div className="rounded-lg border border-border bg-card/60 px-4 py-2 space-y-0">
                  <Row label="ENT Findings" value={v.entFindings} />
                  <Row label="BOA Result" value={earLabel(v.boaResult)} />
                  <Row label="TEOAE — Right Ear" value={earLabel(v.teoaeRight)} />
                  <Row label="TEOAE — Left Ear" value={earLabel(v.teoaeLeft)} />
                  <Row label="DPOAE — Right Ear" value={earLabel(v.dpoaeRight)} />
                  <Row label="DPOAE — Left Ear" value={earLabel(v.dpoaeLeft)} />
                  <Row label="AABR 1st — Right Ear" value={earLabel(v.aabr1Right)} />
                  <Row label="AABR 1st — Left Ear" value={earLabel(v.aabr1Left)} />
                  <Row label="AABR 2nd — Right Ear" value={earLabel(v.aabr2Right)} />
                  <Row label="AABR 2nd — Left Ear" value={earLabel(v.aabr2Left)} />
                  <div className="flex py-1.5">
                    <span className="w-56 shrink-0 text-xs font-medium text-muted-foreground">Overall Result</span>
                    <span className={cn(
                      'text-sm font-semibold px-2 py-0.5 rounded',
                      v.overallResult === 'pass' && 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
                      v.overallResult === 'refer' && 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
                      !v.overallResult && 'text-muted-foreground italic font-normal',
                    )}>
                      {v.overallResult ? v.overallResult.charAt(0).toUpperCase() + v.overallResult.slice(1) : '—'}
                    </span>
                  </div>
                  {followUpDate && (
                    <div className="flex py-1.5">
                      <span className="w-56 shrink-0 text-xs font-medium text-muted-foreground">Scheduled Follow-up</span>
                      <span className="text-sm font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                        📅 {new Date(followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Step 7 — Additional Notes */}
                <SectionHead title="Step 7 — Additional Notes" icon="📝" />
                <div className="rounded-lg border border-border bg-card/60 px-4 py-2 space-y-0">
                  <Row label="Remarks" value={v.remarks} />
                </div>

                {/* Confirmation Checkbox */}
                <div className="mt-8 rounded-xl border-2 border-violet-400 bg-violet-50 dark:bg-violet-950/30 px-5 py-4">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="mt-0.5 h-5 w-5 accent-violet-600 rounded cursor-pointer"
                    />
                    <span className="text-sm font-medium text-violet-900 dark:text-violet-200">
                      I have carefully reviewed all the information above and confirm that it is correct and complete. I understand that this will create a permanent record.
                    </span>
                  </label>
                </div>
              </div>
            );
          })()}

          {currentStep === 5 && (
            <ScreeningStep
              register={register}
              watch={watch}
              setValue={setValue}
              followUpDate={followUpDate}
              setFollowUpDate={setFollowUpDate}
              showScheduleModal={showScheduleModal}
              setShowScheduleModal={setShowScheduleModal}
            />
          )}

          <div className="pt-4 flex justify-between border-t mt-8 sticky bottom-0 bg-card">
            <Button type="button" variant="outline" onClick={onPrev} disabled={currentStep === 0}>
              Previous
            </Button>

            <div className="space-x-2 flex">
              {!editId && (
                <Button type="button" variant="secondary" onClick={onSaveDraft}>
                  Save Draft
                </Button>
              )}
              {currentStep < STEPS.length - 1 ? (
                <Button type="button" onClick={onNext}>
                  Next Step
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={mutation.isPending || !confirmed}
                  onClick={handleSubmit((d) => mutation.mutate(d))}
                  title={!confirmed ? 'Please check the confirmation box above before registering' : undefined}
                >
                  {mutation.isPending ? 'Saving...' : editId ? 'Save Changes' : 'Register Child'}
                </Button>
              )}
            </div>
          </div>
        </FormCard>
      </form>
    </div>
  );
}
