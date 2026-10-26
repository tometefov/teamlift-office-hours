import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Adds a few upcoming slots so the app isn't empty on first run.
async function main() {
  const data = [];
  for (let day = 1; day <= 3; day++) {
    for (const hour of [10, 14, 16]) {
      const d = new Date();
      d.setDate(d.getDate() + day);
      d.setHours(hour, 0, 0, 0);
      data.push({ startsAt: d, durationMinutes: 30 });
    }
  }
  await prisma.slot.createMany({ data });
  console.log(`Seeded ${data.length} slots.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
