import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Aligning registration dates with screening dates...');
  
  const babies = await prisma.baby.findMany({
    include: { screenings: true }
  });

  for (const baby of babies) {
    if (baby.screenings.length > 0) {
      // Find the earliest screening date
      let earliestScreening = new Date();
      for (const s of baby.screenings) {
        if (s.testedAt && s.testedAt < earliestScreening) {
          earliestScreening = s.testedAt;
        }
      }
      
      // Set the baby's registration (createdAt) to be 1 day before their earliest screening
      const registrationDate = new Date(earliestScreening.getTime() - 24 * 60 * 60 * 1000);

      await prisma.baby.update({
        where: { id: baby.id },
        data: { createdAt: registrationDate }
      });
      
      // Also update the timeline event if it exists
      await prisma.patientTimeline.updateMany({
        where: { babyId: baby.id, event: 'registered' },
        data: { createdAt: registrationDate }
      });
    }
  }

  console.log('Done aligning registration dates!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
