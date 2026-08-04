import type { Child, Hospital, Screening, FollowUp, TimelineEvent } from '../../types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function mapBabyToChild(b: any): Child {
  return {
    id: b.id,
    hospitalNumber: b.mrNumber ?? '',
    pocdNumber: b.pocdNumber ?? undefined,
    uniqueMotherId: b.uniqueMotherId ?? undefined,
    firstName: b.firstName,
    lastName: b.lastName,
    dateOfBirth: b.dob,
    timeOfBirth: b.timeOfBirth ?? undefined,
    gender: b.gender,
    birthWeightGrams: b.birthWeightGrams ?? undefined,
    gestationalAgeWeeks: b.gestationalAgeWeeks ?? undefined,
    placeOfBirth: b.placeOfBirth ?? undefined,
    hospitalOfBirthId: b.hospitalId,
    districtId: b.districtId,
    district: b.district,
    state: b.state,
    motherName: b.motherName,
    fatherName: b.fatherName ?? undefined,
    contactNumber: b.phone1 ?? undefined,
    whatsappNumber: b.whatsappNumber ?? undefined,
    phone2: b.phone2 ?? undefined,
    email: b.email ?? undefined,
    address: b.address ?? undefined,
    taluk: b.taluk ?? undefined,
    pinCode: b.pinCode ?? undefined,
    parentDistrict: b.parentDistrict ?? undefined,
    parentState: b.parentState ?? undefined,
    department: b.department ?? undefined,
    doctorName: b.doctorName ?? undefined,
    assessingStaffId: b.assessingStaffId ?? undefined,
    assessingStaffEmployeeId: b.assessingStaffEmployeeId ?? undefined,
    assessingStaffName: b.assessingStaffName ?? undefined,
    referredBy: b.referredBy ?? undefined,
    referredByOther: b.referredByOther ?? undefined,
    nbsCentre: b.nbsCentre ?? undefined,
    region: b.region ?? undefined,
    educationLevel: b.educationLevel ?? undefined,
    educationLevelOther: b.educationLevelOther ?? undefined,
    religion: b.religion ?? undefined,
    religionOther: b.religionOther ?? undefined,
    socioEconomicStatus: b.socioEconomicStatus ?? undefined,
    deliveryType: b.deliveryType ?? undefined,
    noOfSiblings: b.noOfSiblings ?? undefined,
    riskFactorIds: (b.riskFactors ?? []).map((rf: any) => rf.riskCategoryId),
    assessment: b.assessment
      ? {
          familyHistoryHearingLoss: b.assessment.familyHistoryHearingLoss,
          consanguinityDegree: b.assessment.consanguinityDegree ?? undefined,
          caregiverConcern: b.assessment.caregiverConcern,
          reflexMoro: b.assessment.reflexMoro ?? undefined,
          reflexRooting: b.assessment.reflexRooting ?? undefined,
          reflexBabinski: b.assessment.reflexBabinski ?? undefined,
          reflexPalmar: b.assessment.reflexPalmar ?? undefined,
          reflexPlantar: b.assessment.reflexPlantar ?? undefined,
        }
      : undefined,
    remarks: b.remarks ?? undefined,
    status: b.status,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

export function mapChildToBabyPayload(c: Partial<Child>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    mrNumber: c.hospitalNumber,
    pocdNumber: c.pocdNumber,
    uniqueMotherId: c.uniqueMotherId,
    firstName: c.firstName,
    lastName: c.lastName,
    dob: c.dateOfBirth,
    timeOfBirth: c.timeOfBirth,
    gender: c.gender,
    birthWeightGrams: c.birthWeightGrams,
    gestationalAgeWeeks: c.gestationalAgeWeeks,
    placeOfBirth: c.placeOfBirth,
    hospitalId: c.hospitalOfBirthId,
    districtId: c.districtId,
    motherName: c.motherName,
    fatherName: c.fatherName,
    phone1: c.contactNumber,
    whatsappNumber: c.whatsappNumber,
    phone2: c.phone2,
    email: c.email,
    address: c.address,
    taluk: c.taluk,
    pinCode: c.pinCode,
    parentDistrict: c.parentDistrict,
    parentState: c.parentState,
    department: c.department,
    doctorName: c.doctorName,
    assessingStaffId: c.assessingStaffId,
    assessingStaffEmployeeId: c.assessingStaffEmployeeId,
    assessingStaffName: c.assessingStaffName,
    referredBy: c.referredBy,
    referredByOther: c.referredByOther,
    nbsCentre: c.nbsCentre,
    region: c.region,
    educationLevel: c.educationLevel,
    educationLevelOther: c.educationLevelOther,
    religion: c.religion,
    religionOther: c.religionOther,
    socioEconomicStatus: c.socioEconomicStatus,
    deliveryType: c.deliveryType,
    noOfSiblings: c.noOfSiblings,
    riskFactorIds: c.riskFactorIds,
    assessment: c.assessment,
    remarks: c.remarks,
    status: c.status,
  };
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
  return payload;
}

export function mapScreeningRecord(s: any): Screening {
  return {
    id: s.id,
    childId: s.babyId,
    hospitalId: s.baby?.hospitalId,
    screenerId: s.testedById,
    date: s.testedAt,
    status: s.status,
    type: s.type,
    dueDate: s.dueDate ?? undefined,
    assignedAudiologistId: s.assignedAudiologistId ?? undefined,
    entFindings: s.entFindings ?? undefined,
    boaResult: s.boaResult ?? undefined,
    teoaeRight: s.teoaeRight ?? undefined,
    teoaeLeft: s.teoaeLeft ?? undefined,
    dpoaeRight: s.dpoaeRight ?? undefined,
    dpoaeLeft: s.dpoaeLeft ?? undefined,
    aabr1Right: s.aabr1Right ?? undefined,
    aabr1Left: s.aabr1Left ?? undefined,
    aabr2Right: s.aabr2Right ?? undefined,
    aabr2Left: s.aabr2Left ?? undefined,
    overallResult: s.overallResult ?? undefined,
    remarks: s.remarks ?? undefined,
  };
}

export function mapScreeningToPayload(s: Partial<Screening>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    babyId: s.childId,
    status: s.status,
    type: s.type,
    dueDate: s.dueDate,
    assignedAudiologistId: s.assignedAudiologistId,
    entFindings: s.entFindings,
    boaResult: s.boaResult,
    teoaeRight: s.teoaeRight,
    teoaeLeft: s.teoaeLeft,
    dpoaeRight: s.dpoaeRight,
    dpoaeLeft: s.dpoaeLeft,
    aabr1Right: s.aabr1Right,
    aabr1Left: s.aabr1Left,
    aabr2Right: s.aabr2Right,
    aabr2Left: s.aabr2Left,
    overallResult: s.overallResult,
    remarks: s.remarks,
  };
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
  return payload;
}

export function mapFollowUpRecord(f: any): FollowUp {
  return {
    id: f.id,
    childId: f.babyId,
    hospitalId: f.baby?.hospitalId,
    providerId: f.providerId,
    followUpType: f.followUpType,
    provisionalDiagnosisRight: f.provisionalDiagnosisRight ?? undefined,
    provisionalDiagnosisLeft: f.provisionalDiagnosisLeft ?? undefined,
    status: f.status,
    scheduledDate: f.scheduledDate,
    actualDate: f.actualDate ?? undefined,
    notes: f.notes ?? undefined,
    nextSteps: f.nextSteps ?? undefined,
    recommendationTypeIds: (f.recommendations ?? []).map((r: any) => r.recommendationTypeId),
  };
}

export function mapFollowUpToPayload(f: Partial<FollowUp>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    babyId: f.childId,
    followUpType: f.followUpType,
    provisionalDiagnosisRight: f.provisionalDiagnosisRight,
    provisionalDiagnosisLeft: f.provisionalDiagnosisLeft,
    scheduledDate: f.scheduledDate,
    notes: f.notes,
    nextSteps: f.nextSteps,
    recommendationTypeIds: f.recommendationTypeIds,
  };
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
  return payload;
}

export function mapHospitalRecord(h: any): Hospital {
  return {
    id: h.id,
    name: h.name,
    districtId: h.districtId,
    district: h.district,
    state: h.state,
    address: h.address ?? undefined,
    contactPerson: h.contactPerson ?? undefined,
    contactPhone: h.contactPhone ?? undefined,
    status: h.status,
    primaryAudiologistId: h.primaryAudiologistId ?? undefined,
    primaryAudiologist: h.primaryAudiologist
      ? {
          id: h.primaryAudiologist.id,
          name: h.primaryAudiologist.fullName,
          email: h.primaryAudiologist.email,
          hospitalId: h.id,
        }
      : undefined,
    stats: h.stats,
  };
}

export function mapTimelineRecord(t: any): TimelineEvent {
  return {
    id: t.id,
    childId: t.babyId,
    date: t.createdAt,
    type: t.event,
    title: t.description ?? t.event,
    description: t.description ?? '',
    referenceId: undefined,
  };
}
