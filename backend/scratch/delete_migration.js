const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`DELETE FROM _prisma_migrations WHERE migration_name = '20260921142000_cnt_reasons'`);
  console.log("Deleted");
}

main().catch(console.error).finally(() => prisma.$disconnect());
