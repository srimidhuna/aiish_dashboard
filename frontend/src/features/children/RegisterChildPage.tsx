import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screening } from '../../types';
import { childrenService, hospitalsService, mastersService, screeningsService } from '../../services/api';
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
import { CreatableAutocomplete } from '../../components/ui/CreatableAutocomplete';
import type { LocationFilterValue } from '../../components/shared/LocationFilter';
import { useDefaultLocationFilters } from '../../hooks/useDefaultLocationFilters';
import { cn } from '../../lib/utils';
import { getDistrictsForState, getTaluksForDistrict, INDIA_STATES } from '../../lib/locationData';
import { ScreeningStep } from '../../components/forms/ScreeningStep';
import { useAuth } from '../../hooks/useAuth';
import { useScreeningCascade } from '../../hooks/useScreeningCascade';
import { computeScreeningOutcome, hasHighRisk, sanitizeScreening } from '../../lib/screeningLogic';

const testResult = z.enum(['pass', 'refer', 'noisy', 'cnt', 'not_done']);
const passReferOnly = z.enum(['pass', 'refer', 'cnt', 'not_done']);
// AABR additionally allows N/A for an ear that already passed OAE.
const aabrResult = z.enum(['pass', 'refer', 'cnt', 'not_done', 'na']);

const todayLocalISO = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const DRAFT_KEY = 'registration_draft';

/** Optional enum that also accepts the '' an unselected <select> / null an unchecked radio group produces. */
const optionalEnum = <T extends [string, ...string[]]>(values: T) => z.enum(values).nullish().or(z.literal(''));
const schema = z.object({
  hospitalNumber: z.string().trim().min(1, 'MR Records No. is required'),
  pocdNumber: z.string().optional(),
  uniqueMotherId: z.string().optional(),
  birthOrder: z.string().optional(),

  firstName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z
    .string()
    .min(1, 'Required')
    .refine((val) => !val || val <= todayLocalISO(), { message: 'Date of birth cannot be in the future' }),
  gender: z.enum(['male', 'female', 'other']),

  motherName: z.string().trim().min(1, 'Required'),
  motherAadhaar: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{12}$/.test(val), {
      message: 'Aadhaar number must be exactly 12 digits',
    }),
  fatherName: z.string().optional(),
  contactNumber: z
    .string()
    .min(1, 'Mobile number is required')
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  whatsappNumber: z
    .string()
    .optional()
    .refine((val) => !val || /^[6-9]\d{9}$/.test(val), {
      message: 'Enter a valid 10-digit WhatsApp number',
    }),
  phone2: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{10}$/.test(val), { message: 'Enter a valid 10-digit phone number' }),
  address: z.string().optional(),
  taluk: z.string().optional(),
  pinCode: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{6}$/.test(val), { message: 'PIN code must be 6 digits' }),
  parentDistrict: z.string().optional(),
  parentState: z.string().optional(),
  guardianPhotoUrl: z.string().optional(),

  hospitalOfBirthId: z.string().min(1, 'Please select a hospital'),
  districtId: z.string().min(1, 'Please select a district'),
  audiologistId: z.string().optional(),
  assessingStaffId: z.string().optional(),


  nbsCentre: z.string().optional(),
  region: optionalEnum(['urban', 'rural']),
  socioEconomicStatus: optionalEnum(['aay', 'bpl', 'apl']),
  educationLevel: optionalEnum(['illiterate', 'primary', 'high_school', 'graduate_and_above', 'others']),
  educationLevelOther: z.string().optional(),
  religion: optionalEnum(['hindu', 'muslim', 'christian', 'others']),
  religionOther: z.string().optional(),
  deliveryType: optionalEnum(['normal', 'caesarean', 'breech', 'home']),
  // Empty input means "not recorded", not 0.
  noOfSiblings: z.preprocess(
    (v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : v),
    z.coerce.number().int('Must be a whole number').min(0).optional(),
  ),

  riskFactorIds: z.array(z.string()).default([]),

  familyHistoryHearingLoss: z.boolean().default(false),
  consanguinityDegree: optionalEnum(['first', 'second', 'third']),
  caregiverConcern: z.boolean().default(false),
  hrrRemarks: z.string().optional(),
  craniofacialRemarks: z.string().optional(),
  reflexMoro: optionalEnum(['normal', 'abnormal', 'cnt']),
  reflexRooting: optionalEnum(['normal', 'abnormal', 'cnt']),
  reflexBabinski: optionalEnum(['normal', 'abnormal', 'cnt']),
  reflexPalmar: optionalEnum(['normal', 'abnormal', 'cnt']),
  reflexPlantar: optionalEnum(['normal', 'abnormal', 'cnt']),
  reflexSucking: optionalEnum(['normal', 'abnormal', 'cnt']),
  suckingLatchProperly: optionalEnum(['yes', 'no']),
  suckingBreathingDifficulty: optionalEnum(['yes', 'no']),
  suckingFeedDuration: z.string().optional(),
  suckingNasalRegurgitation: optionalEnum(['yes', 'no']),

  entFindings: z.string().optional(),
  cntReason: z.string().optional(),
  boaResult: passReferOnly.nullish().or(z.literal('')),
  oaeTestSelection: z.enum(['TEOAE', 'DPOAE']).nullish().or(z.literal('')),
  teoaeRight: testResult.nullish().or(z.literal('')),
  teoaeLeft: testResult.nullish().or(z.literal('')),
  dpoaeRight: testResult.nullish().or(z.literal('')),
  dpoaeLeft: testResult.nullish().or(z.literal('')),
  aabr1Right: aabrResult.nullish().or(z.literal('')),
  aabr1Left: aabrResult.nullish().or(z.literal('')),
  aabr2Right: aabrResult.nullish().or(z.literal('')),
  aabr2Left: aabrResult.nullish().or(z.literal('')),
  overallResult: z.enum(['pass', 'refer']).nullish().or(z.literal('')),

  remarks: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { id: 'child', label: 'Child Info' },
  { id: 'parent', label: 'Parent Info' },
  { id: 'sociodemo', label: 'Socio-Demographics' },
  { id: 'risk', label: 'High-Risk Register' },
  { id: 'assessment', label: "Reflex Assessment" },
  { id: 'screening', label: 'Screening' },
  { id: 'notes', label: 'Remarks' },
  { id: 'review', label: 'Review & Confirm' },
];

const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
  0: ['hospitalNumber', 'firstName', 'lastName', 'dateOfBirth', 'hospitalOfBirthId', 'districtId'],
  1: ['motherName', 'motherAadhaar', 'contactNumber', 'whatsappNumber', 'phone2', 'pinCode'],
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
  
  const { data: nextPocdData } = useQuery({
    queryKey: ['nextPocdNumber'],
    queryFn: () => childrenService.getNextPocdNumber(),
    enabled: !editId,
  });

  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const defaults = useDefaultLocationFilters();
  const { nbsCentre } = useAuth();
  const [location, setLocation] = useState<LocationFilterValue>({});
  const [guardianPhotoPreview, setGuardianPhotoPreview] = useState<string | null>(null);
  const guardianPhotoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [firstNamePrefix, setFirstNamePrefix] = useState<'bo' | ''>('');
  const [showAadhaar, setShowAadhaar] = useState(false);

  // Unique Mother ID duplicate check
  const [motherIdCheck, setMotherIdCheck] = useState<{
    status: 'idle' | 'checking' | 'duplicate' | 'ok';
    matches: Array<{ id: string; firstName?: string; lastName?: string; dob: string; gender: string; birthOrder?: string; hospital: { name: string } }>;
  }>({ status: 'idle', matches: [] });
  const motherIdDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  // WhatsApp option: 'same' | 'not_available' | 'custom'
  const [whatsappOption, setWhatsappOption] = useState<'same' | 'not_available' | 'custom'>('custom');

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      setCameraStream(stream);
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      // Fallback: trigger file input with capture attribute
      guardianPhotoRef.current?.click();
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setGuardianPhotoPreview(dataUrl);
    setValue('guardianPhotoUrl', dataUrl);
    closeCamera();
  };

  const closeCamera = () => {
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setIsCameraOpen(false);
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    trigger,
    setValue,
    getValues,
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: 'male',
      nbsCentre: nbsCentre || '',
      riskFactorIds: [],
      familyHistoryHearingLoss: false,
      caregiverConcern: false,
      hrrRemarks: '',
      craniofacialRemarks: '',
      reflexMoro: 'normal',
      reflexRooting: 'normal',
      reflexBabinski: 'normal',
      reflexPalmar: 'normal',
      reflexPlantar: 'normal',
      reflexSucking: 'normal',
      suckingLatchProperly: '',
      suckingBreathingDifficulty: '',
      suckingFeedDuration: '',
      suckingNasalRegurgitation: '',
    },
  });

  useEffect(() => {
    if (nbsCentre) {
      setValue('nbsCentre', nbsCentre);
    }
  }, [nbsCentre, setValue]);

  // Keeps the screening cascade (hidden sections, AABR N/A, overall result, CNT reason,
  // re-screening date) consistent with HRR/screening answers from ANY step.
  useScreeningCascade({ watch, getValues, setValue, setFollowUpDate });

  const riskFactorIds = watch('riskFactorIds');
  const familyHistoryHearingLoss = watch('familyHistoryHearingLoss');
  const consanguinityDegree = watch('consanguinityDegree');
  const caregiverConcernValue = watch('caregiverConcern');

  const craniofacialRemarksValue = watch('craniofacialRemarks');


  const religionValue = watch('religion');
  const educationLevelValue = watch('educationLevel');
  const dateOfBirthValue = watch('dateOfBirth');
  const parentState = watch('parentState');
  const parentDistrict = watch('parentDistrict');
  const contactNumberValue = watch('contactNumber');
  const uniqueMotherIdValue = watch('uniqueMotherId');
  const birthOrderValue = watch('birthOrder');

  useEffect(() => {
    if (birthOrderValue && motherIdCheck.status === 'duplicate' && motherIdCheck.matches.length > 0 && !editId) {
      const matchId = motherIdCheck.matches[0].id;
      // Fetch details and populate
      childrenService.getById(matchId).then((existingChild) => {
        const fieldsToCopy: (keyof FormData)[] = [
          'lastName', 'motherName', 'motherAadhaar', 'fatherName', 'contactNumber', 'whatsappNumber', 'phone2',
          'address', 'taluk', 'pinCode', 'parentDistrict', 'parentState', 'region',
          'socioEconomicStatus', 'educationLevel', 'educationLevelOther', 'religion', 'religionOther', 'deliveryType', 'noOfSiblings'
        ];
        fieldsToCopy.forEach(field => {
          const val = (existingChild as unknown as Record<string, unknown>)[field];
          if (val !== undefined && val !== null) {
            setValue(field, val as any, { shouldValidate: true, shouldDirty: true });
          }
        });
        if (existingChild.assessment) {
          if (existingChild.assessment.familyHistoryHearingLoss !== undefined && existingChild.assessment.familyHistoryHearingLoss !== null) {
            setValue('familyHistoryHearingLoss', existingChild.assessment.familyHistoryHearingLoss, { shouldValidate: true, shouldDirty: true });
          }
          if (existingChild.assessment.consanguinityDegree !== undefined && existingChild.assessment.consanguinityDegree !== null) {
            setValue('consanguinityDegree', existingChild.assessment.consanguinityDegree, { shouldValidate: true, shouldDirty: true });
          }
        }
        toast.success("Demographic details auto-filled from existing sibling record.");
      }).catch(err => {
        console.error("Failed to fetch sibling details", err);
      });
    }
  }, [birthOrderValue, motherIdCheck.status, motherIdCheck.matches, setValue, editId]);

  // Keep WhatsApp in sync when mobile number changes and option is 'same'
  useEffect(() => {
    if (whatsappOption === 'same') {
      setValue('whatsappNumber', contactNumberValue || '', { shouldValidate: true });
    }
  }, [contactNumberValue, whatsappOption, setValue]);

  // Auto-fill Mother's Aadhaar from Unique Mother ID (they are the same number)
  useEffect(() => {
    if (uniqueMotherIdValue) {
      setValue('motherAadhaar', uniqueMotherIdValue, { shouldValidate: true });
    } else {
      // Clear Aadhaar only if it was previously auto-filled (matches the old mother ID)
      const currentAadhaar = getValues('motherAadhaar');
      if (!currentAadhaar || currentAadhaar === '') {
        // Already empty, nothing to do
      }
    }
  }, [uniqueMotherIdValue, setValue, getValues]);




  const highRisk = hasHighRisk({
    riskFactorIds,
    familyHistoryHearingLoss,
    consanguinityDegree,
    caregiverConcern: caregiverConcernValue,
  });
  const hrrFindings: 'no_hrr' | 'hrr' = highRisk ? 'hrr' : 'no_hrr';

  const { data: staffList = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffService.list(),
  });

  const { user } = useAuth();
  useEffect(() => {
    if (!editId && user && staffList.length > 0) {
      const currentAssessingStaff = getValues('assessingStaffId');
      if (!currentAssessingStaff) {
        const staffRec = staffList.find(s => s.email === user.email);
        if (staffRec) {
          setValue('assessingStaffId', staffRec.id, { shouldValidate: true });
        }
      }
    }
  }, [editId, user, staffList, getValues, setValue]);

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals', 'register-child'],
    queryFn: () => hospitalsService.list(),
  });

  const { data: riskCategories = [] } = useQuery({
    queryKey: ['risk-categories'],
    queryFn: () => mastersService.listRiskCategories(),
  });

  // Derive the craniofacial category ID from the loaded list (must be after riskCategories query)
  const craniofacialCategoryId = riskCategories.find((rc) =>
    rc.label.toLowerCase().includes('craniofacial')
  )?.id;
  const craniofacialSelected = !!(craniofacialCategoryId && riskFactorIds.includes(craniofacialCategoryId));

  // Auto-clear craniofacialRemarks if craniofacial anomaly is no longer selected
  useEffect(() => {
    if (!craniofacialSelected && getValues('craniofacialRemarks')) {
      setValue('craniofacialRemarks', '', { shouldDirty: true });
    }
  }, [craniofacialSelected, setValue, getValues]);

  // Auto-clear hrrRemarks if child is no longer in High-Risk Register (HRR-0)
  useEffect(() => {
    if (!highRisk && getValues('hrrRemarks')) {
      setValue('hrrRemarks', '', { shouldDirty: true });
    }
  }, [highRisk, setValue, getValues]);

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
      const saved = JSON.parse(raw) as {
        values: FormData;
        step: number;
        savedAt: string;
        ui?: { firstNamePrefix?: 'bo' | ''; followUpDate?: string; whatsappOption?: 'same' | 'not_available' | 'custom' };
      };
      toast('Unsaved registration draft found', {
        description: `Saved ${new Date(saved.savedAt).toLocaleString()}`,
        action: {
          label: 'Restore',
          onClick: () => {
            reset(saved.values);
            const step = Math.min(Math.max(Number(saved.step) || 0, 0), STEPS.length - 1);
            setCurrentStep(step);
            setFirstNamePrefix(saved.ui?.firstNamePrefix ?? '');
            setFollowUpDate(saved.values.overallResult === 'refer' ? saved.ui?.followUpDate ?? '' : '');
            setWhatsappOption(saved.ui?.whatsappOption ?? 'custom');
            setGuardianPhotoPreview(saved.values.guardianPhotoUrl || null);
            if (nbsCentre) {
              setValue('nbsCentre', nbsCentre);
            }
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

  const saveDraft = () => {
    const ui = { firstNamePrefix, followUpDate, whatsappOption };
    const write = (values: FormData) =>
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ values, step: currentStep, savedAt: new Date().toISOString(), ui }),
      );
    try {
      write(getValues());
      return true;
    } catch {
      // Quota exceeded (e.g. a large guardian photo) — retry without the photo.
      try {
        write({ ...getValues(), guardianPhotoUrl: '' });
        return true;
      } catch {
        return false;
      }
    }
  };
  const saveDraftRef = useRef(saveDraft);
  saveDraftRef.current = saveDraft;
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  useEffect(() => {
    if (editId) return;
    // Autosave only once the user has actually entered something, so an untouched
    // form doesn't produce a "draft found" prompt next time.
    const interval = setInterval(() => {
      if (isDirtyRef.current) saveDraftRef.current();
    }, 30000);
    return () => clearInterval(interval);
  }, [editId]);

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

  const { data: editScreenings, isLoading: isEditScreeningsLoading } = useQuery({
    queryKey: ['screenings', editId],
    queryFn: () => screeningsService.getByChildId(editId!),
    enabled: !!editId,
  });

  useEffect(() => {
    // Wait for BOTH child data AND screening data before resetting.
    // Resetting with undefined screenings causes a premature reset (screening fields → '')
    // which updates prevShow* refs in ScreeningStep, leading to a false-positive clear trigger
    // when the real screening data arrives.
    if (!editChild) return;
    if (editId && isEditScreeningsLoading) return; // screenings query still in flight

    const initialScreening = editScreenings
      ?.filter((s) => s.type === 'initial')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())?.[0];

    // Split a stored "B/o <name>" back into the prefix toggle + plain first name.
    const storedFirstName = editChild.firstName ?? '';
    const boMatch = /^B\/o\s+/i.exec(storedFirstName);
    setFirstNamePrefix(boMatch ? 'bo' : '');

    const storedWhatsapp = editChild.whatsappNumber ?? '';
    setWhatsappOption(storedWhatsapp && storedWhatsapp === editChild.contactNumber ? 'same' : 'custom');

    reset({
      ...editChild,
      firstName: boMatch ? storedFirstName.slice(boMatch[0].length) : storedFirstName,
      birthOrder: editChild.birthOrder ?? '',
      dateOfBirth: editChild.dateOfBirth?.split('T')[0] ?? '',
      hospitalOfBirthId: editChild.hospitalOfBirthId,
      districtId: editChild.districtId,
      assessingStaffId: editChild.assessingStaffId,
      riskFactorIds: editChild.riskFactorIds ?? [],
      familyHistoryHearingLoss: editChild.assessment?.familyHistoryHearingLoss ?? false,
      consanguinityDegree: editChild.assessment?.consanguinityDegree ?? '',
      caregiverConcern: editChild.assessment?.caregiverConcern ?? false,
      hrrRemarks: editChild.assessment?.hrrRemarks ?? '',
      craniofacialRemarks: editChild.assessment?.craniofacialRemarks ?? '',
      reflexMoro: editChild.assessment?.reflexMoro,
      reflexRooting: editChild.assessment?.reflexRooting,
      reflexBabinski: editChild.assessment?.reflexBabinski,
      reflexPalmar: editChild.assessment?.reflexPalmar,
      reflexPlantar: editChild.assessment?.reflexPlantar,
      reflexSucking: editChild.assessment?.reflexSucking,
      suckingLatchProperly: editChild.assessment?.suckingLatchProperly ?? '',
      suckingBreathingDifficulty: editChild.assessment?.suckingBreathingDifficulty ?? '',
      suckingFeedDuration: editChild.assessment?.suckingFeedDuration ?? '',
      suckingNasalRegurgitation: editChild.assessment?.suckingNasalRegurgitation ?? '',
      remarks: editChild.remarks ?? '',
      entFindings: initialScreening?.entFindings ?? '',
      cntReason: initialScreening?.cntReason ?? '',
      boaResult: initialScreening?.boaResult ?? '',
      // Infer which OAE test was used from whichever result is stored
      oaeTestSelection: initialScreening?.teoaeRight || initialScreening?.teoaeLeft
        ? 'TEOAE'
        : initialScreening?.dpoaeRight || initialScreening?.dpoaeLeft
          ? 'DPOAE'
          : undefined,
      teoaeRight: initialScreening?.teoaeRight ?? '',
      teoaeLeft: initialScreening?.teoaeLeft ?? '',
      dpoaeRight: initialScreening?.dpoaeRight ?? '',
      dpoaeLeft: initialScreening?.dpoaeLeft ?? '',
      aabr1Right: initialScreening?.aabr1Right ?? '',
      aabr1Left: initialScreening?.aabr1Left ?? '',
      overallResult: initialScreening?.overallResult ?? '',
      educationLevelOther: editChild.educationLevelOther ?? '',
      religionOther: editChild.religionOther ?? '',
    } as any);
    // Pre-fill the pending re-screening date (if any) so saving doesn't lose it.
    const pendingRescreening = editScreenings?.find((s) => s.type === 'rescreening' && s.status !== 'completed');
    setFollowUpDate(
      initialScreening?.overallResult === 'refer' && pendingRescreening?.dueDate
        ? pendingRescreening.dueDate.split('T')[0]
        : '',
    );
    if (editChild.hospitalOfBirthId) {
      setLocation({
        hospitalId: editChild.hospitalOfBirthId,
        districtId: editChild.districtId,
        audiologistId: editChild.assessingStaffId,
      });
    }
  }, [editChild, editScreenings, isEditScreeningsLoading, editId, reset]);

  type SubmitResult = { child: { id: string }; warnings: string[]; rescreeningDate?: string; staleRescreening?: boolean };

  const mutation = useMutation({
    mutationFn: async (data: FormData): Promise<SubmitResult> => {
      const isEdit = !!editId;
      // Create: omit empty fields. Edit: send null so a field the user cleared is really cleared.
      const blank = isEdit ? null : undefined;
      const clean = (v: unknown) => {
        if (typeof v === 'string') return v.trim() === '' ? blank : v.trim();
        return v === undefined || v === null ? blank : v;
      };
      const toInt = (v: unknown): number | null | undefined => {
        if (v === '' || v === undefined || v === null) return blank;
        const n = parseInt(String(v), 10);
        return Number.isNaN(n) ? blank : n;
      };

      const highRiskNow = hasHighRisk(data);
      // New registrations never carry answers from sections the cascade hides. For edits,
      // useScreeningCascade has already cleared anything the user hid, and stored data the
      // user did not touch is preserved as-is.
      const scr = isEdit ? data : sanitizeScreening(data, highRiskNow);
      const outcome = computeScreeningOutcome(scr, highRiskNow);
      const overallResult = (isEdit ? scr.overallResult : outcome.overallResult) || '';

      const selectedStaff = data.assessingStaffId
        ? staffList.find((s) => s.id === data.assessingStaffId)
        : undefined;

      const firstName = (data.firstName ?? '').trim();
      const fullFirstName = firstNamePrefix === 'bo' ? `B/o ${firstName}`.trim() : firstName;

      const babyPayload = {
        hospitalNumber: data.hospitalNumber.trim(),
        uniqueMotherId: clean(data.uniqueMotherId),
        birthOrder: clean(data.birthOrder),
        firstName: clean(fullFirstName),
        lastName: data.lastName.trim(),
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        motherName: data.motherName.trim(),
        fatherName: clean(data.fatherName),
        contactNumber: data.contactNumber,
        whatsappNumber: clean(whatsappOption === 'same' ? data.contactNumber : whatsappOption === 'not_available' ? '' : data.whatsappNumber),
        phone2: clean(data.phone2),
        address: clean(data.address),
        taluk: clean(data.taluk),
        pinCode: clean(data.pinCode),
        parentDistrict: clean(data.parentDistrict),
        parentState: clean(data.parentState),
        hospitalOfBirthId: data.hospitalOfBirthId,
        districtId: data.districtId,
        assessingStaffId: clean(data.assessingStaffId),
        // Snapshot assessing staff details so they survive staff deletion
        assessingStaffEmployeeId: selectedStaff?.employeeId ?? blank,
        assessingStaffName: selectedStaff?.fullName ?? blank,
        nbsCentre: clean(data.nbsCentre),
        region: clean(data.region),
        socioEconomicStatus: clean(data.socioEconomicStatus),
        educationLevel: clean(data.educationLevel),
        educationLevelOther: data.educationLevel === 'others' ? clean(data.educationLevelOther) : blank,
        religion: clean(data.religion),
        religionOther: data.religion === 'others' ? clean(data.religionOther) : blank,
        deliveryType: clean(data.deliveryType),
        noOfSiblings: toInt(data.noOfSiblings),
        riskFactorIds: data.riskFactorIds ?? [],
        assessment: {
          familyHistoryHearingLoss: !!data.familyHistoryHearingLoss,
          consanguinityDegree: clean(data.consanguinityDegree),
          caregiverConcern: !!data.caregiverConcern,
          hrrRemarks: clean(data.hrrRemarks),
          craniofacialRemarks: craniofacialSelected ? clean(data.craniofacialRemarks) : blank,
          reflexMoro: clean(data.reflexMoro),
          reflexRooting: clean(data.reflexRooting),
          reflexBabinski: clean(data.reflexBabinski),
          reflexPalmar: clean(data.reflexPalmar),
          reflexPlantar: clean(data.reflexPlantar),
          reflexSucking: clean(data.reflexSucking),
          suckingLatchProperly: clean(data.suckingLatchProperly),
          suckingBreathingDifficulty: clean(data.suckingBreathingDifficulty),
          suckingFeedDuration: clean(data.suckingFeedDuration),
          suckingNasalRegurgitation: clean(data.suckingNasalRegurgitation),
        },
        remarks: clean(data.remarks),
      } as unknown as Parameters<typeof childrenService.create>[0];

      const screeningFields = {
        entFindings: clean(scr.entFindings),
        cntReason: outcome.hasCnt ? clean(scr.cntReason) : blank,
        boaResult: clean(scr.boaResult),
        teoaeRight: clean(scr.teoaeRight),
        teoaeLeft: clean(scr.teoaeLeft),
        dpoaeRight: clean(scr.dpoaeRight),
        dpoaeLeft: clean(scr.dpoaeLeft),
        aabr1Right: clean(scr.aabr1Right),
        aabr1Left: clean(scr.aabr1Left),
        overallResult: clean(overallResult),
        remarks: clean(data.remarks),
      };
      const hasScreeningData = Object.entries(screeningFields)
        .filter(([k]) => k !== 'remarks')
        .some(([, v]) => v !== undefined && v !== null);

      const needsRescreening = overallResult === 'refer';
      const rescreeningDate = needsRescreening ? followUpDate || undefined : undefined;
      if (needsRescreening && !rescreeningDate) {
        throw new Error('Please schedule a Re-Screening visit date before submitting.');
      }
      const dueDateISO = rescreeningDate ? new Date(`${rescreeningDate}T00:00:00`).toISOString() : undefined;

      const warnings: string[] = [];

      if (isEdit) {
        const child = await childrenService.update(editId!, babyPayload);
        const existing = await screeningsService.getByChildId(editId!);
        const initial = existing
          .filter((s) => s.type === 'initial')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        if (initial) {
          await screeningsService.update(initial.id, {
            status: 'completed',
            ...screeningFields,
          } as unknown as Partial<Screening>);
        } else if (hasScreeningData) {
          await screeningsService.create({
            childId: editId!,
            type: 'initial',
            status: 'completed',
            ...screeningFields,
          } as unknown as Partial<Screening>);
        }

        const pending = existing.find((s) => s.type === 'rescreening' && s.status !== 'completed');
        let staleRescreening = false;
        if (dueDateISO) {
          if (pending) {
            await screeningsService.update(pending.id, { dueDate: dueDateISO });
          } else {
            await screeningsService.create({
              childId: editId!,
              status: 'scheduled',
              type: 'rescreening',
              dueDate: dueDateISO,
              remarks: 'Scheduled for AABR - 2nd Screening',
            });
          }
        } else if (pending) {
          staleRescreening = true;
        }
        return { child, warnings, rescreeningDate, staleRescreening };
      }

      // The child record is the critical write. Screening/re-screening are separate API calls;
      // if one of those fails the child already exists, so we must NOT let the user resubmit
      // (that would hit the duplicate-record guard). Report it and send them to the record.
      const child = await childrenService.create(babyPayload);

      if (hasScreeningData) {
        try {
          await screeningsService.create({
            childId: child.id,
            type: 'initial',
            status: 'completed',
            ...screeningFields,
          } as unknown as Partial<Screening>);
        } catch (err) {
          console.error('[RegisterChild] initial screening save failed', err);
          warnings.push('the initial screening results');
        }
      }

      if (dueDateISO) {
        try {
          await screeningsService.create({
            childId: child.id,
            status: 'scheduled',
            type: 'rescreening',
            dueDate: dueDateISO,
            remarks: 'Scheduled for AABR - 2nd Screening',
          });
        } catch (err) {
          console.error('[RegisterChild] re-screening scheduling failed', err);
          warnings.push('the re-screening appointment');
        }
      }

      return { child, warnings, rescreeningDate };
    },
    onSuccess: ({ child, warnings, rescreeningDate, staleRescreening }) => {
      queryClient.invalidateQueries({ queryKey: ['screenings'] });
      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.invalidateQueries({ queryKey: ['child', child.id] });
      queryClient.invalidateQueries({ queryKey: ['nextPocdNumber'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      if (!editId) localStorage.removeItem(DRAFT_KEY);

      const when = rescreeningDate
        ? new Date(`${rescreeningDate}T00:00:00`).toLocaleDateString('en-IN')
        : '';
      if (editId) {
        toast.success(rescreeningDate ? `Changes saved. Re-Screening on ${when}.` : 'Changes saved.');
        if (staleRescreening) {
          toast.warning('The result is no longer REFER, but a re-screening is still scheduled. Review it in Follow-ups.');
        }
      } else {
        toast.success(rescreeningDate ? `Child registered! Re-Screening scheduled for ${when}.` : 'Child registered successfully!');
      }
      if (warnings.length) {
        toast.error(`The child was saved, but ${warnings.join(' and ')} could not be saved. Please add them from the child's record.`, {
          duration: 12000,
        });
      }
      navigate(`/children/${child.id}`);
    },
    onError: (err: unknown) => {
      console.error('[RegisterChild] API error:', err);
      const e = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const msg = e?.response?.data?.message || e?.message || (editId ? 'Failed to save changes.' : 'Failed to register child.');
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  /** Validates one step. Returns false (and tells the user why) if it can't be left yet. */
  const validateStep = async (step: number): Promise<boolean> => {
    const fields = STEP_FIELDS[step] ?? [];
    if (fields.length && !(await trigger(fields))) {
      const missingHospital = fields.includes('hospitalOfBirthId') && !getValues('hospitalOfBirthId');
      toast.error(missingHospital ? 'Please select the hospital of birth.' : 'Please fix the highlighted fields before continuing.');
      return false;
    }
    if (step === 0) {
      if (motherIdCheck.status === 'checking') {
        toast('Still checking the Unique Mother ID — please try again in a moment.');
        return false;
      }
      if (motherIdCheck.status === 'duplicate' && !getValues('birthOrder')) {
        toast.error('Duplicate Unique Mother ID detected — please select the birth order relationship (Twin, Triplet, etc.) before continuing.');
        return false;
      }
    }
    // HRR Remarks is optional even when HRR (1) is selected; craniofacial details are not.
    if (step === 3 && craniofacialSelected && !getValues('craniofacialRemarks')?.trim()) {
      toast.error('Please describe the craniofacial anomaly details before proceeding.');
      return false;
    }
    return true;
  };

  const changeStep = (step: number) => {
    setCurrentStep(step);
    // The confirmation applies to what was on screen; any trip away from review requires re-confirming.
    if (step !== STEPS.length - 1) setConfirmed(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Moves to any step. Going forward validates every step in between. */
  const goToStep = async (target: number) => {
    if (target === currentStep || target < 0 || target >= STEPS.length) return;
    if (target < currentStep) {
      changeStep(target);
      return;
    }
    for (let step = currentStep; step < target; step++) {
      if (!(await validateStep(step))) {
        if (step !== currentStep) changeStep(step);
        return;
      }
    }
    changeStep(target);
  };

  const onNext = () => goToStep(currentStep + 1);
  const onPrev = () => goToStep(currentStep - 1);

  const stepOfField = (field: string): number => {
    const entry = Object.entries(STEP_FIELDS).find(([, fields]) => (fields as string[]).includes(field));
    return entry ? Number(entry[0]) : currentStep;
  };

  const onSubmit = handleSubmit(
    async (d) => {
      // Re-run step checks that live outside the zod schema.
      for (let step = 0; step < STEPS.length - 1; step++) {
        if (!(await validateStep(step))) {
          changeStep(step);
          return;
        }
      }
      const demoFields = ['region', 'socioEconomicStatus', 'educationLevel', 'religion'] as const;
      const missingDemo = demoFields.filter((f) => !d[f]);
      if (
        missingDemo.length > 0 &&
        !window.confirm('Some socio-demographic details are missing. Are you sure you want to submit without them?')
      ) {
        return;
      }
      mutation.mutate(d);
    },
    (formErrors) => {
      console.warn('Form validation errors:', formErrors);
      const keys = Object.keys(formErrors);
      const firstStep = Math.min(...keys.map(stepOfField));
      const messages = Object.values(formErrors).map((e) => e?.message).filter(Boolean);
      toast.error(`Please fix the errors before submitting: ${messages.join(', ')}`);
      if (Number.isFinite(firstStep) && firstStep !== currentStep) changeStep(firstStep);
    },
  );

  const onSaveDraft = () => {
    if (saveDraft()) {
      toast.success('Draft saved. It will be offered back to you next time you open this form.');
    } else {
      toast.error('Could not save the draft — browser storage is unavailable or full.');
    }
  };


  const percentComplete = Math.round(((currentStep + 1) / STEPS.length) * 100);

  if (isEditLoading || (editId && isEditScreeningsLoading)) {
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
      <FormStepper steps={STEPS} currentStep={currentStep} onStepClick={(i) => void goToStep(i)} />

      <form onSubmit={(e) => e.preventDefault()}>
        <FormCard title={STEPS[currentStep].label}>
          {currentStep === 0 && (
            <FormSection title="Child Information">
              <div className="col-span-2">
                <label className="text-sm font-medium">MR Records No. *</label>
                <Input
                  {...register('hospitalNumber')}
                  className={cn(errors.hospitalNumber && 'border-destructive')}
                />
                {errors.hospitalNumber && (
                  <span className="text-xs text-destructive">{errors.hospitalNumber.message}</span>
                )}
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">POCD Number</label>
                <Input
                  {...register('pocdNumber')}
                  readOnly
                  disabled
                  placeholder={!editId && nextPocdData ? `Approx: ${nextPocdData.nextPocd}` : ''}
                  className="bg-muted/50 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editId 
                    ? 'Auto-generated at registration' 
                    : nextPocdData 
                      ? `Will be auto-generated on registration (approx: ${nextPocdData.nextPocd})` 
                      : 'Will be auto-generated on registration'}
                </p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Unique Mother ID</label>
                <div className="relative">
                  <Input
                    {...register('uniqueMotherId')}
                    onChange={(e) => {
                      register('uniqueMotherId').onChange(e);
                      const val = e.target.value.trim();
                      // Auto-fill Mother's Aadhaar (same number as Unique Mother ID)
                      setValue('motherAadhaar', val, { shouldValidate: true });
                      if (!val) { setMotherIdCheck({ status: 'idle', matches: [] }); return; }
                      setMotherIdCheck((p) => ({ ...p, status: 'checking' }));
                      if (motherIdDebounceRef.current) clearTimeout(motherIdDebounceRef.current);
                      motherIdDebounceRef.current = setTimeout(async () => {
                        try {
                          const res = await childrenService.checkUniqueMotherId(val, editId);
                          setMotherIdCheck({ status: res.exists ? 'duplicate' : 'ok', matches: res.matches });
                        } catch {
                          setMotherIdCheck({ status: 'idle', matches: [] });
                        }
                      }, 600);
                    }}
                    className={cn(
                      motherIdCheck.status === 'duplicate' && 'border-amber-500 focus-visible:ring-amber-400',
                      motherIdCheck.status === 'ok' && 'border-green-500 focus-visible:ring-green-400',
                    )}
                  />
                  {/* Status indicator */}
                  {motherIdCheck.status === 'checking' && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">Checking…</span>
                  )}
                  {motherIdCheck.status === 'ok' && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600 text-xs font-medium">✓ Unique</span>
                  )}
                  {motherIdCheck.status === 'duplicate' && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-600 text-xs font-medium">⚠ Duplicate</span>
                  )}
                </div>

                {/* Duplicate warning + birth-order selector */}
                {motherIdCheck.status === 'duplicate' && (
                  <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-2">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                      ⚠ This Unique Mother ID is already linked to {motherIdCheck.matches.length} existing record{motherIdCheck.matches.length > 1 ? 's' : ''}:
                    </p>
                    <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-0.5 pl-3">
                      {motherIdCheck.matches.map((m) => (
                        <li key={m.id} className="list-disc">
                          {m.firstName || m.lastName ? `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() : 'Unnamed'}
                          {' · '}{new Date(m.dob).toLocaleDateString('en-IN')}
                          {' · '}{m.hospital.name}
                          {m.birthOrder ? ` · ${m.birthOrder.replace(/_/g, ' ')}` : ''}
                        </li>
                      ))}
                    </ul>
                    <div className="pt-1">
                      <label className="text-xs font-medium text-amber-800 dark:text-amber-300 block mb-1">
                        Is this baby a twin / sibling? Select relationship:
                      </label>
                      <select
                        {...register('birthOrder')}
                        className="w-full text-xs rounded-md border border-amber-300 bg-white dark:bg-zinc-900 px-2 py-1.5"
                      >
                        <option value="">-- Select birth order --</option>
                        <option value="twin">Twin</option>
                        <option value="triplet">Triplet</option>
                        <option value="second_child">Second Child</option>
                        <option value="third_child">Third Child</option>
                        <option value="fourth_child">Fourth Child or more</option>
                      </select>
                      {!watch('birthOrder') && (
                        <p className="text-xs text-amber-600 mt-1">Please select a relationship to proceed with this ID.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-3">
                <label className="text-sm font-medium">First Name</label>
                <div className="flex gap-2 mt-1">
                  {/* B/o prefix toggle */}
                  <button
                    type="button"
                    onClick={() => setFirstNamePrefix(firstNamePrefix === 'bo' ? '' : 'bo')}
                    className={cn(
                      'shrink-0 px-3 py-1.5 rounded-md border text-sm font-semibold transition-colors',
                      firstNamePrefix === 'bo'
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-background text-muted-foreground border-input hover:bg-muted'
                    )}
                    title="Toggle B/o (Baby of) prefix for unnamed newborns"
                  >
                    B/o
                  </button>
                  <Input
                    {...register('firstName')}
                    placeholder={firstNamePrefix === 'bo' ? "Mother's name (auto-prefix B/o)" : 'First name'}
                    className={cn('flex-1', errors.firstName && 'border-destructive')}
                  />
                </div>
                {firstNamePrefix === 'bo' && (
                  <p className="text-xs text-violet-600 mt-0.5">Will be saved as: <span className="font-semibold">B/o {watch('firstName') || '…'}</span></p>
                )}
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
                  max={new Date().toISOString().split('T')[0]}
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

              <div className="col-span-3">
                <label className="text-sm font-medium">Hospital of Birth *</label>
                <select
                  value={location.hospitalId ?? ''}
                  disabled={!!defaults.hospitalId && !editId}
                  onChange={(e) => {
                    const h = hospitals.find((x) => x.id === e.target.value);
                    setLocation((prev) => ({
                      ...prev,
                      hospitalId: h?.id,
                      districtId: h?.districtId,
                      state: h?.state,
                    }));
                    setValue('hospitalOfBirthId', h?.id ?? '', { shouldValidate: true, shouldDirty: true });
                    setValue('districtId', h?.districtId ?? '', { shouldValidate: true, shouldDirty: true });
                  }}
                  className={cn(
                    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1 disabled:cursor-not-allowed disabled:bg-muted/50',
                    errors.hospitalOfBirthId && 'border-destructive',
                  )}
                >
                  <option value="" disabled>
                    -- Select Hospital --
                  </option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                      {h.district ? ` — ${h.district}` : ''}
                    </option>
                  ))}
                </select>
                {errors.hospitalOfBirthId && (
                  <span className="text-xs text-destructive">{errors.hospitalOfBirthId.message}</span>
                )}
              </div>
              <input type="hidden" {...register('hospitalOfBirthId')} />
              <input type="hidden" {...register('districtId')} />
              <input type="hidden" {...register('audiologistId')} />

              {/* Staff ID moved here from Reflex Assessment step */}
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

              {/* Mother's Aadhaar */}
              <div className="col-span-3">
                <label className="text-sm font-medium">Mother&apos;s Aadhaar Number</label>
                <Input
                  {...register('motherAadhaar')}
                  placeholder="12-digit Aadhaar number"
                  maxLength={12}
                  inputMode="numeric"
                  readOnly={!!uniqueMotherIdValue}
                  disabled={!!uniqueMotherIdValue}
                  className={cn(
                    errors.motherAadhaar && 'border-destructive',
                    uniqueMotherIdValue && 'bg-muted/50 cursor-not-allowed',
                  )}
                />
                {errors.motherAadhaar ? (
                  <span className="text-xs text-destructive">{errors.motherAadhaar.message}</span>
                ) : uniqueMotherIdValue ? (
                  <span className="text-xs text-green-600">Auto-filled from Unique Mother ID</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Optional — 12 digits</span>
                )}
              </div>
              <div className="col-span-3" />{/* spacer */}

              <div className="col-span-3">
                <label className="text-sm font-medium">Mobile Number *</label>
                <Input
                  {...register('contactNumber')}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  inputMode="numeric"
                  className={cn(errors.contactNumber && 'border-destructive')}
                />
                {errors.contactNumber && (
                  <span className="text-xs text-destructive">{errors.contactNumber.message}</span>
                )}
              </div>
              <div className="col-span-3">
                <label className="text-sm font-medium">WhatsApp Number</label>
                {/* Option selector */}
                <div className="flex gap-4 mt-1 mb-1">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="whatsappOption"
                      value="same"
                      checked={whatsappOption === 'same'}
                      onChange={() => {
                        setWhatsappOption('same');
                        setValue('whatsappNumber', contactNumberValue || '', { shouldValidate: true });
                      }}
                      className="accent-primary"
                    />
                    Same as mobile
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="whatsappOption"
                      value="not_available"
                      checked={whatsappOption === 'not_available'}
                      onChange={() => {
                        setWhatsappOption('not_available');
                        setValue('whatsappNumber', '', { shouldValidate: false });
                      }}
                      className="accent-primary"
                    />
                    Not available
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="whatsappOption"
                      value="custom"
                      checked={whatsappOption === 'custom'}
                      onChange={() => {
                        setWhatsappOption('custom');
                        setValue('whatsappNumber', '', { shouldValidate: false });
                      }}
                      className="accent-primary"
                    />
                    Custom
                  </label>
                </div>
                {whatsappOption === 'same' ? (
                  <Input
                    key="wa-same"
                    value={contactNumberValue || ''}
                    readOnly
                    disabled
                    className="bg-muted/50 cursor-not-allowed"
                    placeholder="Auto-filled from mobile number"
                  />
                ) : whatsappOption === 'not_available' ? (
                  <Input
                    key="wa-na"
                    value="Not available"
                    readOnly
                    disabled
                    className="bg-muted/50 cursor-not-allowed text-muted-foreground"
                  />
                ) : (
                  <Input
                    key="wa-custom"
                    {...register('whatsappNumber')}
                    placeholder="WhatsApp number"
                    maxLength={10}
                    inputMode="numeric"
                    className={cn(errors.whatsappNumber && 'border-destructive')}
                  />
                )}
                {errors.whatsappNumber && whatsappOption === 'custom' && (
                  <span className="text-xs text-destructive">{errors.whatsappNumber.message}</span>
                )}
              </div>
              <div className="col-span-3">
                <label className="text-sm font-medium">Alternate Phone</label>
                <Input {...register('phone2')} />
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
                <label className="text-sm font-medium">State *</label>
                <select
                  {...register('parentState', {
                    // Only a user change of state invalidates district/taluk. (Done here rather than
                    // in an effect so loading an existing record or a draft never wipes them.)
                    onChange: () => {
                      setValue('parentDistrict', '');
                      setValue('taluk', '');
                    },
                  })}
                  className={cn(
                    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1',
                    errors.parentState && 'border-destructive'
                  )}
                >
                  <option value="">-- Select State --</option>
                  {INDIA_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {errors.parentState && <span className="text-xs text-destructive">{errors.parentState.message}</span>}
              </div>
              <div className="col-span-3">
                <label className="text-sm font-medium">District *</label>
                <CreatableAutocomplete
                  options={getDistrictsForState(parentState || '')}
                  placeholder="-- Select or type District --"
                  disabled={!parentState}
                  onChange={(val) => {
                    if (val !== getValues('parentDistrict')) setValue('taluk', '');
                    setValue('parentDistrict', val, { shouldValidate: true, shouldDirty: true });
                  }}
                  value={watch('parentDistrict') || ''}
                />
                {errors.parentDistrict && <span className="text-xs text-destructive">{errors.parentDistrict.message}</span>}
              </div>
              <div className="col-span-3">
                <label className="text-sm font-medium">Taluk *</label>
                <CreatableAutocomplete
                  options={getTaluksForDistrict(parentState || '', parentDistrict || '')}
                  placeholder="-- Select or type Taluk --"
                  onChange={(val) => {
                    setValue('taluk', val, { shouldValidate: true, shouldDirty: true });
                  }}
                  value={watch('taluk') || ''}
                  disabled={!parentDistrict}
                />
                {errors.taluk && <span className="text-xs text-destructive">{errors.taluk.message}</span>}
              </div>
              <div className="col-span-3">
                <label className="text-sm font-medium">PIN Code</label>
                <Input {...register('pinCode')} />
              </div>

              {/* Guardian Camera Capture */}
              <div className="col-span-6">
                <label className="text-sm font-medium">Photo of Mother / Father / Guardian</label>
                <div className="mt-2 flex items-start gap-5">
                  {/* Preview / Viewfinder */}
                  <div className="shrink-0">
                    {isCameraOpen ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-40 h-32 rounded-xl object-cover ring-2 ring-violet-400 shadow-lg bg-black"
                      />
                    ) : guardianPhotoPreview ? (
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

                  {/* Controls */}
                  <div className="flex flex-col gap-2 justify-center">
                    {isCameraOpen ? (
                      <>
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors shadow"
                        >
                          {/* Shutter icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="12" r="4" />
                            <path d="M9 3h6l1.5 2H18a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h1.5L9 3z" />
                          </svg>
                          Capture Photo
                        </button>
                        <button
                          type="button"
                          onClick={closeCamera}
                          className="text-xs text-muted-foreground hover:text-destructive transition-colors text-left"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={openCamera}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted transition-colors"
                        >
                          {/* Camera icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                          </svg>
                          {guardianPhotoPreview ? 'Retake Photo' : 'Open Camera'}
                        </button>
                        {guardianPhotoPreview && (
                          <button
                            type="button"
                            onClick={() => {
                              setGuardianPhotoPreview(null);
                              setValue('guardianPhotoUrl', '');
                            }}
                            className="text-xs text-destructive hover:underline text-left"
                          >
                            Remove photo
                          </button>
                        )}
                        <p className="text-xs text-muted-foreground">Uses your device camera.</p>
                      </>
                    )}
                  </div>

                  {/* Hidden fallback file input (capture="user" for mobile) */}
                  <input
                    ref={guardianPhotoRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
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
                <label className="text-sm font-medium">Out Reach Service / NBS Centre</label>
                <Input
                  {...register('nbsCentre')}
                  readOnly={!!nbsCentre}
                  className={nbsCentre ? "bg-muted cursor-not-allowed" : ""}
                  title={nbsCentre ? "Auto-filled from login" : "Enter NBS Centre"}
                />
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
                {religionValue === 'others' ? (
                  <div className="flex gap-2 mt-1">
                    <Input {...register('religionOther')} placeholder="Type religion" autoFocus />
                    <Button variant="outline" size="sm" className="px-2" onClick={() => { setValue('religion', undefined); setValue('religionOther', undefined); }}>X</Button>
                  </div>
                ) : (
                  <select
                    {...register('religion')}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                  >
                    <option value="">-- Select --</option>
                    <option value="hindu">Hindu</option>
                    <option value="muslim">Muslim</option>
                    <option value="christian">Christian</option>
                    <option value="others">Others (Specify)</option>
                  </select>
                )}
              </div>

              <div className="col-span-3">
                <label className="text-sm font-medium">Education Level (Parents)</label>
                {educationLevelValue === 'others' ? (
                  <div className="flex gap-2 mt-1">
                    <Input {...register('educationLevelOther')} placeholder="Type education level" autoFocus />
                    <Button variant="outline" size="sm" className="px-2" onClick={() => { setValue('educationLevel', undefined); setValue('educationLevelOther', undefined); }}>X</Button>
                  </div>
                ) : (
                  <select
                    {...register('educationLevel')}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                  >
                    <option value="">-- Select --</option>
                    <option value="illiterate">Illiterate</option>
                    <option value="primary">Primary</option>
                    <option value="high_school">High School</option>
                    <option value="graduate_and_above">Graduation & Above</option>
                    <option value="others">Others (Specify)</option>
                  </select>
                )}
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
                <Input
                  type="number"
                  min={0}
                  {...register('noOfSiblings')}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData('text');
                    if (parseInt(text, 10) < 0) e.preventDefault();
                  }}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    const val = parseInt(el.value, 10);
                    if (!isNaN(val) && val < 0) el.value = '0';
                  }}
                />
              </div>
            </FormSection>
          )}

          {currentStep === 3 && (
            <FormSection title="High-Risk Register (to be filled by Medical Professionals)">
              <div className="col-span-6">
                <RiskFactorChecklist
                  selectedIds={riskFactorIds}
                  onChange={(ids) => setValue('riskFactorIds', ids, { shouldDirty: true, shouldValidate: true })}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="familyHistoryHearingLoss"
                      {...register('familyHistoryHearingLoss')}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-input text-primary focus:ring-primary"
                    />
                    <label htmlFor="familyHistoryHearingLoss" className="text-sm font-medium leading-none">
                      Family history of early/progressive/delayed hearing loss
                    </label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <label className="text-sm font-medium leading-none mt-2">Consanguinity:</label>
                    <select
                      {...register('consanguinityDegree')}
                      className="flex h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
                    >
                      <option value="">None</option>
                      <option value="first">1st Degree</option>
                      <option value="second">2nd Degree</option>
                      <option value="third">3rd Degree</option>
                    </select>
                  </div>
                  <div className="flex items-start space-x-3 pt-1">
                    <input
                      type="checkbox"
                      id="caregiverConcernHRR"
                      {...register('caregiverConcern')}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-input text-primary focus:ring-primary"
                    />
                    <label htmlFor="caregiverConcernHRR" className="text-sm font-medium leading-none">
                      Caregiver&apos;s Concern
                    </label>
                  </div>
                </RiskFactorChecklist>
              </div>

              {/* Craniofacial anomalies — mandatory comment box */}
              {craniofacialSelected && (
                <div className="col-span-6 mt-1">
                  <label className="text-sm font-medium">
                    Craniofacial Anomaly Details
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-1">Required — describe the specific craniofacial anomaly (type, severity, affected structures, etc.).</p>
                  <textarea
                    {...register('craniofacialRemarks')}
                    rows={3}
                    placeholder="e.g. Microtia grade II, right ear — auricular malformation with partial canal atresia..."
                    className={`mt-1 flex w-full rounded-md border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-transparent ${!craniofacialRemarksValue?.trim()
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-input'
                      }`}
                  />
                  {!craniofacialRemarksValue?.trim() && (
                    <p className="text-xs text-red-500 mt-1">Please describe the craniofacial anomaly details.</p>
                  )}
                </div>
              )}
              <div className="col-span-6 flex items-center gap-4 pt-2 border-t mt-2">
                <span className="text-sm font-medium">HRR findings</span>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="hrrFindings"
                    checked={hrrFindings === 'no_hrr'}
                    readOnly
                    className="h-4 w-4 accent-primary cursor-not-allowed"
                  />
                  <span className="text-sm">No HRR (0)</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="hrrFindings"
                    checked={hrrFindings === 'hrr'}
                    readOnly
                    className="h-4 w-4 accent-primary cursor-not-allowed"
                  />
                  <span className="text-sm">HRR (1)</span>
                </label>
                <span className="text-xs text-muted-foreground italic ml-2">(auto-computed from selections above)</span>
              </div>
              <div className="col-span-6 mt-2">
                <label className="text-sm font-medium">
                  HRR Remarks
                  <span className="text-muted-foreground text-xs ml-1">(optional)</span>
                </label>
                <textarea
                  {...register('hrrRemarks')}
                  rows={2}
                  placeholder="Enter any remarks about the HRR findings..."
                  className="mt-1 flex w-full rounded-md border border-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-transparent"
                />
              </div>

            </FormSection>
          )}

          {currentStep === 4 && (
            <FormSection title="Reflex Assessment">
              <div className="col-span-6 space-y-5">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">New Born Reflexes</h4>
                  <ReflexSelector register={register} name="reflexMoro" label="Moro / Startle" />
                  <ReflexSelector register={register} name="reflexRooting" label="Rooting" />
                  <ReflexSelector register={register} name="reflexBabinski" label="Babinski" />
                  <ReflexSelector register={register} name="reflexPalmar" label="Palmar" />
                  <ReflexSelector register={register} name="reflexPlantar" label="Plantar" />
                  <ReflexSelector register={register} name="reflexSucking" label="Sucking" />
                </div>

                {/* Sub-topic: Sucking Reflex */}
                <div className="pt-4 border-t border-border space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-primary">Sucking Reflex</h4>
                    <p className="text-xs text-muted-foreground">Feeding and respiratory assessment</p>
                  </div>

                  {/* Question 1 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md border bg-card gap-2">
                    <span className="text-sm font-medium">1. Does the baby latch on properly while feeding?</span>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" value="yes" {...register('suckingLatchProperly')} className="text-primary" />
                        <span className="text-sm">Yes</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" value="no" {...register('suckingLatchProperly')} className="text-primary" />
                        <span className="text-sm">No</span>
                      </label>
                    </div>
                  </div>

                  {/* Question 2 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md border bg-card gap-2">
                    <span className="text-sm font-medium">2. Does the baby have any breathing difficulty while feeding?</span>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" value="yes" {...register('suckingBreathingDifficulty')} className="text-primary" />
                        <span className="text-sm">Yes</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" value="no" {...register('suckingBreathingDifficulty')} className="text-primary" />
                        <span className="text-sm">No</span>
                      </label>
                    </div>
                  </div>

                  {/* Question 3 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md border bg-card gap-3">
                    <div>
                      <span className="text-sm font-medium">3. How much time does the child take to finish 1 round feed?</span>
                      <p className="text-xs text-muted-foreground mt-0.5">(ideally 15 to 20 mins every 2 hours)</p>
                    </div>
                    <div className="w-full sm:w-64">
                      <Input
                        {...register('suckingFeedDuration')}
                        placeholder="e.g. 15 to 20 mins"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Question 4 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md border bg-card gap-2">
                    <span className="text-sm font-medium">4. Does milk come from the nose (nasal regurgitation) while feeding?</span>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" value="yes" {...register('suckingNasalRegurgitation')} className="text-primary" />
                        <span className="text-sm">Yes</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" value="no" {...register('suckingNasalRegurgitation')} className="text-primary" />
                        <span className="text-sm">No</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </FormSection>
          )}

          {currentStep === 6 && (
            <FormSection title="Remarks">
              <div className="col-span-6">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Remarks (Optional)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remarks-nil"
                      checked={watch('remarks') === 'NIL'}
                      onChange={(e) => {
                        if (e.target.checked) setValue('remarks', 'NIL');
                        else if (watch('remarks') === 'NIL') setValue('remarks', '');
                      }}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                    />
                    <label htmlFor="remarks-nil" className="text-sm cursor-pointer select-none">NIL</label>
                  </div>
                </div>
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
            const reflexLabel = (val?: string | null) =>
              ({ normal: 'Normal', abnormal: 'Abnormal', cnt: 'CNT' } as Record<string, string>)[val ?? ''] ?? val;
            const earLabel = (val?: string | null) =>
              ({ pass: 'Pass', refer: 'Refer', noisy: 'Noisy', cnt: 'CNT', not_done: 'Not Done' } as Record<string, string>)[val ?? ''] ?? val ?? '—';
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
                  {v.birthOrder && <Row label="Birth Order" value={v.birthOrder.replace(/_/g, ' ')} />}
                  <Row label="First Name" value={firstNamePrefix === 'bo' ? `B/o ${v.firstName || ''}`.trim() : v.firstName} />
                  <Row label="Last Name" value={v.lastName} />
                  <Row label="Gender" value={v.gender ? v.gender.charAt(0).toUpperCase() + v.gender.slice(1) : undefined} />
                  <Row label="Date of Birth" value={v.dateOfBirth} />
                  <Row label="Hospital of Birth" value={hospitals.find((h) => h.id === v.hospitalOfBirthId)?.name} />
                  <Row
                    label="Staff ID (Assessing)"
                    value={(() => {
                      const st = staffList.find((s) => s.id === v.assessingStaffId);
                      return st ? `${st.employeeId} — ${st.fullName}` : v.assessingStaffId;
                    })()}
                  />
                </div>

                {/* Step 2 — Parent Info */}
                <SectionHead title="Step 2 — Parent Information" icon="👨‍👩‍👧" />
                <div className="rounded-lg border border-border bg-card/60 px-4 py-2 space-y-0">
                  <Row label="Mother's Name" value={v.motherName} />
                  {v.motherAadhaar && (
                    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0 text-sm">
                      <span className="text-muted-foreground w-40 shrink-0">Mother&apos;s Aadhaar</span>
                      <span className="font-medium tracking-widest flex-1">
                        {showAadhaar
                          ? v.motherAadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')
                          : `XXXX XXXX ${v.motherAadhaar.slice(-4)}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAadhaar((p) => !p)}
                        className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
                        title={showAadhaar ? 'Hide Aadhaar' : 'Show full Aadhaar'}
                      >
                        {showAadhaar ? (
                          /* eye-off */
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          /* eye */
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                  <Row label="Father's Name" value={v.fatherName} />
                  <Row label="Mobile Number" value={v.contactNumber} />
                  <Row
                    label="WhatsApp Number"
                    value={whatsappOption === 'same' ? v.contactNumber : whatsappOption === 'not_available' ? 'Not available' : v.whatsappNumber}
                  />
                  <Row label="Alternate Phone" value={v.phone2} />
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

                  <Row label="NBS Centre" value={v.nbsCentre} />
                  <Row label="Region" value={v.region ? v.region.charAt(0).toUpperCase() + v.region.slice(1) : undefined} />
                  <Row label="Socio-Economic Status" value={v.socioEconomicStatus?.toUpperCase()} />
                  <Row
                    label="Religion"
                    value={v.religion === 'others' ? v.religionOther || 'Others' : v.religion ? v.religion.charAt(0).toUpperCase() + v.religion.slice(1) : undefined}
                  />
                  <Row
                    label="Education Level"
                    value={v.educationLevel === 'others' ? v.educationLevelOther || 'Others' : v.educationLevel?.replace(/_/g, ' ')}
                  />
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
                  <Row label="Family History Hearing Loss" value={v.familyHistoryHearingLoss ? 'Yes' : 'No'} />
                  <Row label="Consanguinity" value={v.consanguinityDegree ? `${v.consanguinityDegree.charAt(0).toUpperCase()}${v.consanguinityDegree.slice(1)} degree` : 'None'} />
                  <Row label="HRR Findings" value={hrrFindings === 'hrr' ? 'HRR (1)' : 'No HRR (0)'} />
                  {hrrFindings === 'hrr' && v.hrrRemarks && <Row label="HRR Remarks" value={v.hrrRemarks} />}
                  <Row label="Caregiver Concern" value={v.caregiverConcern ? 'Yes' : 'No'} />
                  {craniofacialSelected && <Row label="Craniofacial Anomaly Details" value={v.craniofacialRemarks} />}
                </div>

                {/* Step 5 — Audiologist Assessment */}
                <SectionHead title="Step 5 — Reflex Assessment" icon="🩺" />
                <div className="rounded-lg border border-border bg-card/60 px-4 py-2 space-y-0">
                  <Row label="Reflex — Moro/Startle" value={reflexLabel(v.reflexMoro)} />
                  <Row label="Reflex — Rooting" value={reflexLabel(v.reflexRooting)} />
                  <Row label="Reflex — Babinski" value={reflexLabel(v.reflexBabinski)} />
                  <Row label="Reflex — Palmar" value={reflexLabel(v.reflexPalmar)} />
                  <Row label="Reflex — Plantar" value={reflexLabel(v.reflexPlantar)} />
                  <Row label="Reflex — Sucking" value={reflexLabel(v.reflexSucking)} />
                  <Row
                    label="Sucking: Latch on properly"
                    value={v.suckingLatchProperly ? (v.suckingLatchProperly === 'yes' ? 'Yes' : 'No') : undefined}
                  />
                  <Row
                    label="Sucking: Breathing difficulty"
                    value={v.suckingBreathingDifficulty ? (v.suckingBreathingDifficulty === 'yes' ? 'Yes' : 'No') : undefined}
                  />
                  <Row
                    label="Sucking: Feed duration"
                    value={v.suckingFeedDuration || undefined}
                  />
                  <Row
                    label="Sucking: Nasal regurgitation"
                    value={v.suckingNasalRegurgitation ? (v.suckingNasalRegurgitation === 'yes' ? 'Yes' : 'No') : undefined}
                  />
                </div>

                {/* Step 6 — Screening */}
                <SectionHead title="Step 6 — Screening" icon="🎧" />
                <div className="rounded-lg border border-border bg-card/60 px-4 py-2 space-y-0">
                  <Row label="ENT Findings" value={v.entFindings} />
                  <Row label="BOA Result" value={earLabel(v.boaResult)} />
                  <Row label="OAE Test" value={v.oaeTestSelection} />
                  <Row label="TEOAE — Right Ear" value={earLabel(v.teoaeRight)} />
                  <Row label="TEOAE — Left Ear" value={earLabel(v.teoaeLeft)} />
                  <Row label="DPOAE — Right Ear" value={earLabel(v.dpoaeRight)} />
                  <Row label="DPOAE — Left Ear" value={earLabel(v.dpoaeLeft)} />
                  {(() => {
                    const revOutcome = computeScreeningOutcome(v, highRisk);
                    return revOutcome.showAabr1 ? (
                      <>
                        <Row label="AABR 1st — Right Ear" value={earLabel(v.aabr1Right)} />
                        <Row label="AABR 1st — Left Ear" value={earLabel(v.aabr1Left)} />
                      </>
                    ) : null;
                  })()}
                  <Row label="CNT Reason" value={v.cntReason} />
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
                  {v.overallResult === 'refer' && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 px-3 my-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 gap-2">
                      <div>
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200">Scheduled Re-Screening Date</span>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Automatically set to next day. You can change this date before confirming:
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          min={todayLocalISO()}
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          className="rounded-md border border-amber-400 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-amber-900 dark:text-amber-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 7 — Remarks */}
                <SectionHead title="Step 7 — Remarks" icon="📝" />
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
                  onClick={() => void onSubmit()}
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
