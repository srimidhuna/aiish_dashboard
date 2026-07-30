/**
 * prisma/seed.ts
 *
 * Idempotent seed script — safe to run multiple times.
 * All records use upsert keyed on unique fields (or a fixed deterministic id
 * where no natural unique key exists, e.g. Hospital/Baby/Screening/FollowUp).
 *
 * Seeded credentials:
 *   Admin:       admin@aiish.in       / Admin@12345
 *   Audiologist: audiologist@aiish.in / Audiologist@123
 */

import {
  PrismaClient,
  CategoryGroup,
  UserRole,
  Region,
  DeliveryType,
  ReferredBy,
  SocioEconomicStatus,
  EducationLevelParent,
  Religion,
  HospitalStatus,
  ScreeningStatus,
  ScreeningTestResult,
  PassReferResult,
  FollowUpType,
  FollowUpStatus,
  ConsanguinityDegree,
  ReflexResult,
  BabyStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

function seedId(kind: string, index: number): string {
  return `seed-${kind}-${String(index).padStart(4, '0')}`;
}

async function main(): Promise<void> {
  console.log('[seed] Starting idempotent seed...');

  // ── States & Districts ──────────────────────────────────────────────────
  const stateDefs = [
    { name: 'Karnataka', districts: ['Mysuru', 'Bengaluru Urban', 'Mandya', 'Hassan'] },
    { name: 'Kerala', districts: ['Kozhikode', 'Ernakulam', 'Wayanad'] },
    { name: 'Tamil Nadu', districts: ['Chennai'] },
  ];

  const districtByName = new Map<string, { id: string }>();
  for (const s of stateDefs) {
    const state = await prisma.state.upsert({
      where: { name: s.name },
      update: {},
      create: { name: s.name },
    });
    for (const dName of s.districts) {
      const district = await prisma.district.upsert({
        where: { name_stateId: { name: dName, stateId: state.id } },
        update: {},
        create: { name: dName, stateId: state.id },
      });
      districtByName.set(dName, district);
    }
  }
  console.log(`[seed] States/Districts: ${stateDefs.length} states seeded`);

  // ── Hospitals ────────────────────────────────────────────────────────────
  const hospitalDefs = [
    { name: 'Mysuru General Hospital', district: 'Mysuru', contactPerson: 'Dr. Rao', contactPhone: '9876543210', address: 'Sayyaji Rao Rd, Mysuru' },
    { name: 'AIISH Main Clinic', district: 'Mysuru', contactPerson: 'Dr. Kumar', contactPhone: '9876543211', address: 'Manasagangothri, Mysuru' },
    { name: 'Bengaluru Victoria Hospital', district: 'Bengaluru Urban', contactPerson: 'Dr. Nair', contactPhone: '9876543212', address: 'Fort Rd, Bengaluru' },
    { name: 'Bengaluru Cradle Care Clinic', district: 'Bengaluru Urban', contactPerson: 'Dr. Iyer', contactPhone: '9876543213', address: 'Jayanagar, Bengaluru' },
    { name: 'Mandya District Hospital', district: 'Mandya', contactPerson: 'Dr. Gowda', contactPhone: '9876543214', address: 'Mandya Town' },
    { name: 'Hassan Institute of Medical Sciences', district: 'Hassan', contactPerson: 'Dr. Shetty', contactPhone: '9876543215', address: 'Hassan Town' },
    { name: 'Kozhikode Medical College', district: 'Kozhikode', contactPerson: 'Dr. Menon', contactPhone: '9876543216', address: 'Medical College Rd, Kozhikode' },
    { name: 'Ernakulam General Hospital', district: 'Ernakulam', contactPerson: 'Dr. Thomas', contactPhone: '9876543218', address: 'MG Rd, Ernakulam' },
  ];

  const hospitals: { id: string; name: string }[] = [];
  for (let i = 0; i < hospitalDefs.length; i++) {
    const h = hospitalDefs[i];
    const district = districtByName.get(h.district)!;
    const id = seedId('hospital', i + 1);
    const hospital = await prisma.hospital.upsert({
      where: { id },
      update: {
        name: h.name,
        districtId: district.id,
        address: h.address,
        contactPerson: h.contactPerson,
        contactPhone: h.contactPhone,
        status: HospitalStatus.active,
      },
      create: {
        id,
        name: h.name,
        districtId: district.id,
        address: h.address,
        contactPerson: h.contactPerson,
        contactPhone: h.contactPhone,
        status: HospitalStatus.active,
      },
    });
    hospitals.push(hospital);
  }
  console.log(`[seed] Hospitals: ${hospitals.length} upserted`);

  // ── Users (1 admin + 2 audiologists per hospital) ───────────────────────
  const adminPasswordHash = await bcrypt.hash('Admin@12345', BCRYPT_ROUNDS);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aiish.in' },
    update: { fullName: 'System Administrator', hospitalId: hospitals[0].id, role: UserRole.admin },
    create: {
      email: 'admin@aiish.in',
      passwordHash: adminPasswordHash,
      fullName: 'System Administrator',
      hospitalId: hospitals[0].id,
      role: UserRole.admin,
    },
  });

  const audiologistPasswordHash = await bcrypt.hash('Audiologist@123', BCRYPT_ROUNDS);
  const demoAudiologist = await prisma.user.upsert({
    where: { email: 'audiologist@aiish.in' },
    update: { fullName: 'Demo Audiologist', hospitalId: hospitals[0].id, role: UserRole.audiologist },
    create: {
      email: 'audiologist@aiish.in',
      passwordHash: audiologistPasswordHash,
      fullName: 'Demo Audiologist',
      hospitalId: hospitals[0].id,
      role: UserRole.audiologist,
    },
  });

  const audiologistNamePool = ['Jones', 'Fernandes', 'Pillai', 'Bose', 'Kutty', 'Varma', 'Anand', 'Rehman', 'Das', 'Nazir'];
  const audiologists: { id: string; hospitalId: string }[] = [demoAudiologist];
  let nameIdx = 0;
  for (const hospital of hospitals) {
    for (let j = 0; j < 2; j++) {
      const email = `audiologist${hospital.id.slice(-4)}${j}@aiish.demo`;
      const fullName = `Dr. ${audiologistNamePool[nameIdx % audiologistNamePool.length]}`;
      nameIdx++;
      const a = await prisma.user.upsert({
        where: { email },
        update: { fullName, hospitalId: hospital.id, role: UserRole.audiologist },
        create: {
          email,
          passwordHash: audiologistPasswordHash,
          fullName,
          hospitalId: hospital.id,
          role: UserRole.audiologist,
        },
      });
      audiologists.push(a);
    }
  }
  console.log(`[seed] Users: 1 admin + ${audiologists.length} audiologists upserted`);

  // Assign each hospital's primary audiologist to its first attached audiologist
  for (const hospital of hospitals) {
    const primary = audiologists.find((a) => a.hospitalId === hospital.id);
    if (primary) {
      await prisma.hospital.update({ where: { id: hospital.id }, data: { primaryAudiologistId: primary.id } });
    }
  }

  // ── Risk Categories (matches the paper's "High Risk Register — Medical professionals" list) ──
  // `oldLabels` lists labels this entry was previously seeded under, so a rename updates the
  // existing row (and its baby_risk_factors references) in place instead of creating a duplicate.
  const riskCategories: Array<{ label: string; categoryGroup: CategoryGroup; oldLabels?: string[] }> = [
    {
      label: 'Neonatal intensive care unit stay > 5 days',
      categoryGroup: CategoryGroup.perinatal,
      oldLabels: ['NICU stay > 5 days'],
    },
    {
      label: 'Aminoglycoside administration for > 5 days - ototoxic medication',
      categoryGroup: CategoryGroup.perinatal,
      oldLabels: ['Aminoglycoside administration > 5 days (ototoxic medication)'],
    },
    { label: 'Birth Asphyxia or Hypoxic Ischemic Encephalopathy', categoryGroup: CategoryGroup.perinatal },
    {
      label: 'Extracorporeal membrane oxygenation',
      categoryGroup: CategoryGroup.perinatal,
      oldLabels: ['Extracorporeal Membrane Oxygenation (ECMO)'],
    },
    {
      label: 'In utero infections such as cytomegalovirus, rubella, syphilis, toxoplasmosis or herpes simplex virus',
      categoryGroup: CategoryGroup.perinatal,
      oldLabels: ['In utero infections (CMV, rubella, syphilis, toxoplasmosis, HSV)'],
    },
    { label: 'Culture positive infections associated with hearing loss', categoryGroup: CategoryGroup.postnatal },
    { label: 'Hyperbilirubinemia with exchange transfusion', categoryGroup: CategoryGroup.perinatal },
    { label: 'Seizures', categoryGroup: CategoryGroup.postnatal },
    {
      label: 'Craniofacial anomalies, including auricular or temporal bone abnormalities',
      categoryGroup: CategoryGroup.other,
      oldLabels: ['Craniofacial anomalies (including auricular/temporal bone abnormalities)'],
    },
    { label: 'Syndromes associated with hearing loss', categoryGroup: CategoryGroup.other },
    {
      label: 'Events associated with hearing loss, trauma, chemotherapy',
      categoryGroup: CategoryGroup.other,
      oldLabels: ['Events associated with hearing loss (trauma, chemotherapy)'],
    },
  ];

  const riskCategoryRows: { id: string; label: string }[] = [];
  for (const [index, rc] of riskCategories.entries()) {
    const sortOrder = index + 1;
    const existing = await prisma.riskCategory.findFirst({
      where: { label: { in: [rc.label, ...(rc.oldLabels ?? [])] } },
    });
    const row = existing
      ? await prisma.riskCategory.update({
          where: { id: existing.id },
          data: { label: rc.label, categoryGroup: rc.categoryGroup, sortOrder },
        })
      : await prisma.riskCategory.create({
          data: { label: rc.label, categoryGroup: rc.categoryGroup, sortOrder },
        });
    riskCategoryRows.push(row);
  }

  // Clean up any stale old-label rows that weren't matched during the upsert.
  // This happens when findFirst matched the new label (from a prior seed run)
  // and left the old-label row orphaned.
  const validIds = riskCategoryRows.map((r) => r.id);
  const { count: deletedRiskRefs } = await prisma.babyRiskFactor.deleteMany({
    where: { riskCategoryId: { notIn: validIds } },
  });
  const { count: deletedRiskCats } = await prisma.riskCategory.deleteMany({
    where: { id: { notIn: validIds } },
  });
  if (deletedRiskCats > 0) {
    console.log(`[seed] Cleaned up ${deletedRiskCats} stale risk categories (${deletedRiskRefs} orphaned refs)`);
  }
  console.log(`[seed] Risk categories: ${riskCategoryRows.length} upserted`);

  // ── Recommendation Types (matches the paper's "Recommendation" list) ────
  const recommendationTypes = [
    'Audiological Evaluation',
    'Speech & Language Evaluation',
    'ENT Evaluation',
    'Speech & Language Stimulation',
    'Others',
  ];
  const recommendationRows: { id: string; label: string }[] = [];
  for (const label of recommendationTypes) {
    const row = await prisma.recommendationType.upsert({ where: { label }, update: {}, create: { label } });
    recommendationRows.push(row);
  }
  console.log(`[seed] Recommendation types: ${recommendationRows.length} upserted`);

  // ── Demo Babies + Risk Factors + Assessment + Screenings + Follow-ups ───
  const districts = Array.from(districtByName.values());
  const totalBabies = 24;

  for (let i = 0; i < totalBabies; i++) {
    const hospital = hospitals[i % hospitals.length];
    const babyId = seedId('baby', i + 1);
    const isMale = i % 2 === 0;
    const dob = new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 120);

    const baby = await prisma.baby.upsert({
      where: { id: babyId },
      update: {},
      create: {
        id: babyId,
        mrNumber: `MR-${2000 + i}`,
        pocdNumber: `POCD-${3000 + i}`,
        uniqueMotherId: `UMI-${4000 + i}`,
        firstName: isMale ? 'Aarav' : 'Diya',
        lastName: `Baby${i + 1}`,
        dob,
        gender: isMale ? 'male' : 'female',
        birthWeightGrams: 2500 + Math.floor(Math.random() * 1000),
        gestationalAgeWeeks: 36 + Math.floor(Math.random() * 5),
        placeOfBirth: 'Hospital',
        motherName: 'Mother Name',
        fatherName: 'Father Name',
        address: '123 Main St',
        taluk: 'Taluk',
        pinCode: '570001',
        districtId: districts[i % districts.length].id,
        hospitalId: hospital.id,
        department: 'Pediatrics',
        doctorName: 'Dr. Smith',
        phone1: `999888${String(7000 + i)}`,
        phone2: null,
        referredBy: [ReferredBy.pocd_staff, ReferredBy.doctor, ReferredBy.self][i % 3],
        nbsCentre: 'Out Reach Service / NBS Centre',
        region: i % 3 === 0 ? Region.rural : Region.urban,
        educationLevel: EducationLevelParent.high_school,
        religion: Religion.hindu,
        socioEconomicStatus: SocioEconomicStatus.bpl,
        deliveryType: DeliveryType.normal,
        noOfSiblings: i % 4,
        status: i % 6 === 0 ? BabyStatus.follow_up_required : BabyStatus.completed,
        createdById: admin.id,
      },
    });

    // Risk factors — every 4th baby has one
    if (i % 4 === 0) {
      const rc = riskCategoryRows[i % riskCategoryRows.length];
      await prisma.babyRiskFactor.upsert({
        where: { babyId_riskCategoryId: { babyId: baby.id, riskCategoryId: rc.id } },
        update: {},
        create: { babyId: baby.id, riskCategoryId: rc.id },
      });
    }

    // Audiologist assessment
    await prisma.audiologistAssessment.upsert({
      where: { babyId: baby.id },
      update: {},
      create: {
        babyId: baby.id,
        familyHistoryHearingLoss: i % 7 === 0,
        consanguinityDegree: i % 5 === 0 ? ConsanguinityDegree.first : null,
        caregiverConcern: i % 6 === 0,
        reflexMoro: ReflexResult.normal,
        reflexRooting: ReflexResult.normal,
        reflexBabinski: ReflexResult.normal,
        reflexPalmar: ReflexResult.normal,
        reflexPlantar: ReflexResult.normal,
      },
    });

    const audiologist = audiologists.find((a) => a.hospitalId === hospital.id) ?? demoAudiologist;

    // Screenings: mix of completed/scheduled/draft
    const screeningId = seedId('screening', i + 1);
    const isRefer = i % 5 === 0;
    if (i < 16) {
      // Completed
      await prisma.screening.upsert({
        where: { id: screeningId },
        update: {},
        create: {
          id: screeningId,
          babyId: baby.id,
          status: ScreeningStatus.completed,
          entFindings: 'Normal',
          boaResult: isRefer ? ScreeningTestResult.refer : ScreeningTestResult.pass,
          teoaeRight: ScreeningTestResult.pass,
          teoaeLeft: isRefer ? ScreeningTestResult.refer : ScreeningTestResult.pass,
          dpoaeRight: ScreeningTestResult.pass,
          dpoaeLeft: ScreeningTestResult.pass,
          aabr1Right: ScreeningTestResult.pass,
          aabr1Left: ScreeningTestResult.pass,
          overallResult: isRefer ? PassReferResult.refer : PassReferResult.pass,
          remarks: 'Routine screening performed.',
          testedById: audiologist.id,
          assignedAudiologistId: audiologist.id,
          testedAt: new Date(),
        },
      });
    } else if (i < 20) {
      // Scheduled (due today or in the next few days)
      const dueOffsetDays = (i - 16) % 2 === 0 ? 0 : (i - 16);
      await prisma.screening.upsert({
        where: { id: screeningId },
        update: {},
        create: {
          id: screeningId,
          babyId: baby.id,
          status: ScreeningStatus.scheduled,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * dueOffsetDays),
          testedById: audiologist.id,
          assignedAudiologistId: audiologist.id,
          testedAt: new Date(),
        },
      });
    } else {
      // Draft
      await prisma.screening.upsert({
        where: { id: screeningId },
        update: {},
        create: {
          id: screeningId,
          babyId: baby.id,
          status: ScreeningStatus.draft,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
          remarks: 'Started but not yet completed.',
          testedById: audiologist.id,
          assignedAudiologistId: audiologist.id,
          testedAt: new Date(),
        },
      });
    }

    // Follow-ups for referred completed screenings
    if (i < 16 && isRefer) {
      const followUpId = seedId('followup', i + 1);
      const followUp = await prisma.followUp.upsert({
        where: { id: followUpId },
        update: {},
        create: {
          id: followUpId,
          babyId: baby.id,
          followUpType: FollowUpType.regular,
          provisionalDiagnosisRight: 'Refer',
          provisionalDiagnosisLeft: 'Normal',
          status: FollowUpStatus.scheduled,
          scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          providerId: audiologist.id,
        },
      });
      const rec = recommendationRows[i % recommendationRows.length];
      await prisma.babyRecommendation.upsert({
        where: { followUpId_recommendationTypeId: { followUpId: followUp.id, recommendationTypeId: rec.id } },
        update: {},
        create: { followUpId: followUp.id, recommendationTypeId: rec.id },
      });
    }

    // Registration timeline event
    await prisma.patientTimeline.upsert({
      where: { id: seedId('timeline-reg', i + 1) },
      update: {},
      create: {
        id: seedId('timeline-reg', i + 1),
        babyId: baby.id,
        event: 'registered',
        description: 'Registered in the system',
        createdById: admin.id,
        createdAt: baby.createdAt,
      },
    });
  }
  console.log(`[seed] Babies: ${totalBabies} upserted with risk factors, assessments, screenings, follow-ups, timeline`);

  console.log('[seed] Seed completed successfully.');
}

main()
  .catch((err: unknown) => {
    console.error('[seed] Seed failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
