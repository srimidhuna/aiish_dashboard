import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hospital = await prisma.hospital.findFirst();
  if (!hospital) {
    throw new Error('No hospitals found. Create a hospital first.');
  }

  const email = 'audiologist@aiish.in';
  const password = 'Audiologist@123';
  const passwordHash = await bcrypt.hash(password, 12);

  const audiologist = await prisma.user.upsert({
    where: { email },
    update: {
        passwordHash,
        fullName: 'Demo Audiologist',
        hospitalId: hospital.id,
        role: UserRole.audiologist,
        deletedAt: null
    },
    create: {
      email,
      passwordHash,
      fullName: 'Demo Audiologist',
      hospitalId: hospital.id,
      role: UserRole.audiologist,
    },
  });

  console.log(`✅ Audiologist created/restored: ${audiologist.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
