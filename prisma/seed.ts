import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@abedul.example";
  const adminName = process.env.ADMIN_NAME ?? "Administración Abedul";

  // Normas de la comunidad (fila única id=1).
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      communityName: "Comunidad Abedul",
      poolCapacity: 45,
      maxGuestsPerDay: 4,
      maxGuestsPerWeek: 8,
      maxGuestsPerSeason: 10,
      // Temporada de piscina típica en España: junio–septiembre.
      seasonStart: new Date("2026-06-01T00:00:00.000Z"),
      seasonEnd: new Date("2026-09-15T00:00:00.000Z"),
    },
  });

  // Administrador.
  await prisma.owner.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", name: adminName },
    create: {
      name: adminName,
      email: adminEmail,
      unit: "Administración",
      role: "ADMIN",
    },
  });

  // Algunos propietarios de ejemplo.
  const samples = [
    { name: "María García", email: "maria@example.com", unit: "Portal 1 · 1ºA" },
    { name: "Juan Pérez", email: "juan@example.com", unit: "Portal 1 · 2ºB" },
    { name: "Lucía Fernández", email: "lucia@example.com", unit: "Portal 2 · 3ºC" },
  ];

  for (const s of samples) {
    await prisma.owner.upsert({
      where: { email: s.email },
      update: {},
      create: s,
    });
  }

  console.log("✓ Seed completado.");
  console.log(`  Admin: ${adminEmail}`);
  console.log(`  Propietarios de ejemplo: ${samples.map((s) => s.email).join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
