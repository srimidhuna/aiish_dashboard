const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const babies = await prisma.baby.findMany({
    include: {
      screenings: true,
    }
  });

  const user = await prisma.user.findFirst();

  const unscreenedBabies = babies.filter(b => b.screenings.length === 0);
  console.log(`Found ${unscreenedBabies.length} unscreened babies.`);

  for (const baby of unscreenedBabies) {
    const result = Math.random() > 0.5 ? 'pass' : 'refer';
    
    await prisma.screening.create({
      data: {
        baby: { connect: { id: baby.id } },
        status: 'completed',
        overallResult: result,
        teoaeRight: result,
        teoaeLeft: result,
        testedAt: new Date(),
        testedBy: { connect: { id: user.id } }
      }
    });
    
    if (result === 'refer') {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 7);
        await prisma.followUp.create({
            data: {
                baby: { connect: { id: baby.id } },
                followUpType: 'regular',
                scheduledDate: nextDate,
                status: 'scheduled',
                provider: { connect: { id: user.id } }
            }
        });
    }

    console.log(`Added ${result} screening for baby ${baby.id}`);
  }

  console.log('Finished adding synthetic screenings.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
