const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const todaysRange = { gte: startOfToday, lte: endOfToday };

  const countBefore = await prisma.baby.count({ where: { deletedAt: null, createdAt: todaysRange } });
  console.log('Babies before:', countBefore);

  const baby = await prisma.baby.create({
    data: {
      firstName: 'Test',
      lastName: 'Baby',
      gender: 'male',
      dateOfBirth: new Date(),
      hospitalNumber: '12345',
      hospitalOfBirthId: (await prisma.hospital.findFirst()).id,
      districtId: (await prisma.district.findFirst()).id,
    }
  });

  const countAfter = await prisma.baby.count({ where: { deletedAt: null, createdAt: todaysRange } });
  console.log('Babies after:', countAfter);

  // cleanup
  await prisma.baby.delete({ where: { id: baby.id } });
}

main().finally(() => prisma.$disconnect());
