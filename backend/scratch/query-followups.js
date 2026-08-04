const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  
  const followUps = await prisma.followUp.findMany({
    where: {
      scheduledDate: {
        gte: startOfToday,
        lte: endOfToday
      }
    }
  });
  console.log(followUps);
}

main().finally(() => prisma.$disconnect());
