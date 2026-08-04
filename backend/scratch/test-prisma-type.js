const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const baby = await prisma.baby.findFirst();
    if (!baby) {
      console.log('No baby found');
      return;
    }
    const screening = await prisma.screening.create({
      data: {
        babyId: baby.id,
        status: 'scheduled',
        type: 'rescreening',
        dueDate: new Date(),
        remarks: 'Test rescreening',
        testedById: (await prisma.user.findFirst()).id,
      }
    });
    console.log('Success!', screening);
    await prisma.screening.delete({ where: { id: screening.id } });
  } catch (err) {
    console.log('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
