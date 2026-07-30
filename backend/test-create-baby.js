const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst();
    const hospital = await prisma.hospital.findFirst();
    const district = await prisma.district.findFirst();

    if (!user || !hospital || !district) {
      console.log('Missing basic master data (user, hospital, or district)');
      return;
    }

    // Attempt to create a baby with typical data
    const res = await prisma.baby.create({
      data: {
        firstName: 'Test',
        lastName: 'Baby',
        dob: new Date('2023-01-01'),
        gender: 'male',
        motherName: 'Test Mother',
        phone1: '9876543210',
        districtId: district.id,
        hospitalId: hospital.id,
        createdById: user.id,
        // The frontend sends address, taluk, parentDistrict, parentState
        address: '123 Main St',
        taluk: 'Test Taluk',
        parentDistrict: 'Test District',
        parentState: 'Tamil Nadu',
      }
    });

    console.log('Created baby successfully:', res.id);
  } catch (err) {
    console.error('Prisma Error:');
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
