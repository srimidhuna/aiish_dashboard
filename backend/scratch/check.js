const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  console.log('Start of today:', startOfToday);
  
  const babies = await prisma.baby.findMany({ where: { createdAt: { gte: startOfToday } } });
  console.log('Babies created today:', babies.length);
  
  const allBabies = await prisma.baby.findMany({ orderBy: { createdAt: 'desc' }, take: 2 });
  console.log('Latest babies:', allBabies.map(b => b.createdAt));
}

main().finally(() => prisma.$disconnect());
