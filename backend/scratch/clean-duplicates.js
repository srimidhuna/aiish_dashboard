const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const all = await prisma.followUp.findMany({ orderBy: { createdAt: 'asc' } });

  const grouped = {};
  for (const f of all) {
    if (!grouped[f.childId]) grouped[f.childId] = [];
    grouped[f.childId].push(f);
  }

  const toDelete = [];

  for (const [childId, entries] of Object.entries(grouped)) {
    if (entries.length > 1) {
      console.log('childId: ' + childId + ' -> ' + entries.length + ' entries');
      entries.forEach(e => console.log('  id=' + e.id + ' status=' + e.status + ' scheduledDate=' + e.scheduledDate + ' createdAt=' + e.createdAt));

      const sorted = entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const keep = sorted[0];
      const remove = sorted.slice(1);
      console.log('  -> Keeping: ' + keep.id + ', Deleting: ' + remove.map(r => r.id).join(', '));
      toDelete.push(...remove.map(r => r.id));
    }
  }

  if (toDelete.length === 0) {
    console.log('No duplicates found.');
  } else {
    console.log('Deleting ' + toDelete.length + ' duplicate follow-up(s)...');
    await prisma.babyRecommendation.deleteMany({ where: { followUpId: { in: toDelete } } });
    const result = await prisma.followUp.deleteMany({ where: { id: { in: toDelete } } });
    console.log('Deleted ' + result.count + ' follow-up(s).');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
