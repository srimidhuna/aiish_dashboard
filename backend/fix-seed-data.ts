import { PrismaClient, FollowUpStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing seed data to include past dates and completed followups...');
  
  const babies = await prisma.baby.findMany({
    include: { screenings: true, followUps: true }
  });

  const now = new Date();

  for (let i = 0; i < babies.length; i++) {
    const baby = babies[i];
    
    // 1. Give them a random date of birth (0 to 14 months ago)
    const ageInMonths = (i % 14);
    const dob = new Date(now.getTime() - ageInMonths * 30 * 24 * 60 * 60 * 1000);
    
    await prisma.baby.update({
      where: { id: baby.id },
      data: { dob: dob }
    });

    // 2. Scatter screening dates into the past
    for (const screening of baby.screenings) {
      if (screening.status === 'completed') {
        const monthsAgo = i % 6; // 0 to 5 months ago
        const testedAt = new Date(now.getTime() - monthsAgo * 30 * 24 * 60 * 60 * 1000);
        await prisma.screening.update({
          where: { id: screening.id },
          data: { testedAt }
        });
      }
    }

    // 3. Mark half of the scheduled follow-ups as completed
    for (let j = 0; j < baby.followUps.length; j++) {
      const followup = baby.followUps[j];
      if (followup.status === 'scheduled' && j % 2 === 0) {
        await prisma.followUp.update({
          where: { id: followup.id },
          data: { status: FollowUpStatus.completed }
        });
      }
    }
  }

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
