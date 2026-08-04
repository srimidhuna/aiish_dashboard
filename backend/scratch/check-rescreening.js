const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecords() {
  const rescreenings = await prisma.screening.findMany({
    where: { type: 'rescreening' },
    include: { baby: true }
  });
  console.log('Re-screenings found:', rescreenings.length);
  rescreenings.forEach(r => {
    console.log(`- ${r.id}: status=${r.status}, childId=${r.babyId}, dueDate=${r.dueDate}`);
  });
}

checkRecords().finally(() => prisma.$disconnect());
