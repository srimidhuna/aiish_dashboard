export type Gender = 'male' | 'female' | 'other';
export type FollowUpStatus =
  'scheduled' | 'completed' | 'missed' | 'lost_to_followup' | 'rescheduled';
export type Role = 'admin' | 'audiologist' | 'doctor';
export type ScreeningStatus = 'draft' | 'scheduled' | 'completed';
export type TestResult = 'pass' | 'refer' | 'noisy' | 'cnt' | 'not_done';
export type PassRefer = 'pass' | 'refer';
export type ReflexResult = 'normal' | 'abnormal';
export type ConsanguinityDegree = 'first' | 'second' | 'third';
export type FollowUpType = 'phone' | 'regular' | 'not_applicable';
export type Region = 'urban' | 'rural';
export type DeliveryType = 'normal' | 'caesarean' | 'breech' | 'home';
export type ReferredBy = 'pocd_staff' | 'doctor' | 'self' | 'others';
export type SocioEconomicStatus = 'aay' | 'bpl' | 'apl';
export type EducationLevel =
  'illiterate' | 'primary' | 'high_school' | 'graduate_and_above' | 'others';
export type Religion = 'hindu' | 'muslim' | 'christian' | 'others';
export type HospitalStatus = 'active' | 'inactive';
export type BabyStatus =
  'draft' | 'completed' | 'follow_up_required' | 'under_evaluation' | 'under_treatment' | 'closed';

export interface State {
  id: string;
  name: string;
}

export interface District {
  id: string;
  name: string;
  state: string;
}

export interface Audiologist {
  id: string;
  name: string;
  email: string;
  hospitalId: string;
}

export interface Hospital {
  id: string;
  name: string;
  districtId: string;
  district: string;
  state: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  status: HospitalStatus;
  primaryAudiologistId?: string;
  primaryAudiologist?: Audiologist;
  stats?: {
    totalChildren: number;
    totalScreenings: number;
    referralCount: number;
    pendingFollowUps: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  hospitalId?: string;
  audiologistId?: string;
}

export interface RiskCategory {
  id: string;
  label: string;
  categoryGroup: 'perinatal' | 'postnatal' | 'family_history' | 'other';
}

export interface RecommendationType {
  id: string;
  label: string;
}

export interface AudiologistAssessment {
  familyHistoryHearingLoss?: boolean;
  consanguinityDegree?: ConsanguinityDegree;
  caregiverConcern?: boolean;
  reflexMoro?: ReflexResult;
  reflexRooting?: ReflexResult;
  reflexBabinski?: ReflexResult;
  reflexPalmar?: ReflexResult;
  reflexPlantar?: ReflexResult;
}

export interface Child {
  id: string;
  hospitalNumber: string; // maps to backend mrNumber
  pocdNumber?: string;
  uniqueMotherId?: string;

  firstName: string;
  lastName: string;
  dateOfBirth: string; // maps to backend dob
  timeOfBirth?: string;
  gender: Gender;
  birthWeightGrams?: number;
  gestationalAgeWeeks?: number;
  placeOfBirth?: string;

  hospitalOfBirthId: string; // maps to backend hospitalId
  districtId?: string;
  district?: string; // denormalized district name (read-only)
  state?: string; // denormalized state name (read-only)

  motherName: string;
  fatherName?: string;
  contactNumber?: string; // maps to backend phone1
  whatsappNumber?: string; // maps to backend whatsapp_number
  phone2?: string;
  email?: string;
  address?: string;
  taluk?: string;
  pinCode?: string;
  parentDistrict?: string;
  parentState?: string;

  department?: string;
  doctorName?: string;
  assessingStaffId?: string;
  assessingStaffEmployeeId?: string;
  assessingStaffName?: string;

  referredBy?: ReferredBy;
  referredByOther?: string;
  nbsCentre?: string;
  region?: Region;
  educationLevel?: EducationLevel;
  educationLevelOther?: string;
  religion?: Religion;
  religionOther?: string;
  socioEconomicStatus?: SocioEconomicStatus;
  deliveryType?: DeliveryType;
  noOfSiblings?: number;

  riskFactorIds: string[];
  assessment?: AudiologistAssessment;

  remarks?: string;
  status?: BabyStatus;

  createdAt: string;
  updatedAt: string;
}

export interface Screening {
  id: string;
  childId: string; // maps to backend babyId
  hospitalId?: string;
  screenerId?: string; // maps to backend testedById (server-derived on create)
  date: string; // maps to backend testedAt

  status: ScreeningStatus;
  type?: 'initial' | 'rescreening';
  dueDate?: string;
  assignedAudiologistId?: string;

  entFindings?: string;
  boaResult?: TestResult;
  teoaeRight?: TestResult;
  teoaeLeft?: TestResult;
  dpoaeRight?: TestResult;
  dpoaeLeft?: TestResult;
  aabr1Right?: TestResult;
  aabr1Left?: TestResult;
  aabr2Right?: TestResult;
  aabr2Left?: TestResult;

  overallResult?: PassRefer;
  remarks?: string;
}

export interface FollowUp {
  id: string;
  childId: string; // maps to backend babyId
  hospitalId?: string;
  providerId?: string; // server-derived on create

  followUpType: FollowUpType;
  provisionalDiagnosisRight?: string;
  provisionalDiagnosisLeft?: string;

  status: FollowUpStatus;
  scheduledDate: string;
  actualDate?: string;
  notes?: string;
  nextSteps?: string;

  recommendationTypeIds?: string[];
}

export interface TimelineEvent {
  id: string;
  childId: string;
  date: string;
  type: 'registered' | 'screened' | 'follow_up_created' | 'treatment_started' | 'closed' | 'other';
  title: string;
  description: string;
  referenceId?: string;
}
