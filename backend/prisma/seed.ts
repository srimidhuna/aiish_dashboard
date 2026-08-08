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



  // Assign each hospital's primary audiologist
  for (const hospital of hospitals) {
    await prisma.hospital.update({ where: { id: hospital.id }, data: { primaryAudiologistId: demoAudiologist.id } });
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
