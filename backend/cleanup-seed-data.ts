/**
 * cleanup-seed-data.ts
 *
 * Uses PostgreSQL TRUNCATE CASCADE to cleanly wipe all transactional/seed data.
 * KEEPS: states, districts, risk categories, recommendation types,
 *        admin user, and admin's hospital.
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register cleanup-seed-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting cleanup of seed/dummy data...\n');

  // Find the admin user so we can preserve their hospital
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!admin) {
    throw new Error('No admin user found! Aborting to avoid losing access.');
  }
  console.log(`👤 Admin user: ${admin.email} (hospital id: ${admin.hospitalId})\n`);

  // Step 1: TRUNCATE all transactional tables in one shot (CASCADE handles FK order)
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      audit_logs,
      patient_timelines,
      baby_recommendations,
      follow_ups,
      screenings,
      baby_risk_factors,
      audiologist_assessments,
      babies,
      staff
    RESTART IDENTITY CASCADE
  `);
  console.log('✅ Truncated: audit_logs, patient_timelines, baby_recommendations, follow_ups, screenings, baby_risk_factors, audiologist_assessments, babies, staff');

  // Step 2: Delete non-admin users (audiologists, doctors)
  const deletedUsers = await prisma.user.deleteMany({
    where: { role: { not: 'admin' } },
  });
  console.log(`✅ Deleted ${deletedUsers.count} non-admin users`);

  // Step 3: Delete all hospitals EXCEPT admin's hospital
  const deletedHospitals = await prisma.hospital.deleteMany({
    where: { id: { not: admin.hospitalId } },
  });
  console.log(`✅ Deleted ${deletedHospitals.count} hospitals (admin's hospital preserved)`);

  // Verify what's left
  const remaining = await Promise.all([
    prisma.baby.count(),
    prisma.hospital.count(),
    prisma.user.count(),
    prisma.staff.count(),
  ]);

  console.log('\n📊 Remaining records:');
  console.log(`   Babies:    ${remaining[0]}`);
  console.log(`   Hospitals: ${remaining[1]}`);
  console.log(`   Users:     ${remaining[2]}`);
  console.log(`   Staff:     ${remaining[3]}`);

  console.log('\n✅ Master data preserved:');
  const [states, districts, riskCats, recTypes] = await Promise.all([
    prisma.state.count(),
    prisma.district.count(),
    prisma.riskCategory.count(),
    prisma.recommendationType.count(),
  ]);
  console.log(`   States: ${states}, Districts: ${districts}, Risk Categories: ${riskCats}, Recommendation Types: ${recTypes}`);

  console.log('\n🎉 Database is clean and ready for production!');
  console.log(`\n⚠️  Admin login: ${admin.email}`);
  console.log('   Please change the admin password before handing over!');
}

main()
  .catch((e) => {
    console.error('\n❌ Cleanup failed:', e.message ?? e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
