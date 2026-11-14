import { PrismaClient } from "@prisma/client";
import { royalMarigold } from "../services/template/catalog";

const db = new PrismaClient();

async function seedPackages() {
  const existing = await db.package.findFirst({ where: { name: royalMarigold.name } });
  const pkg = existing
    ? await db.package.update({
        where: { id: existing.id },
        data: { description: royalMarigold.description, active: true },
      })
    : await db.package.create({
        data: { name: royalMarigold.name, description: royalMarigold.description },
      });

  for (const design of royalMarigold.designs) {
    await db.design.upsert({
      where: { key: design.key },
      update: {
        packageId: pkg.id,
        name: design.name,
        kind: design.kind,
        eventType: design.eventType ?? null,
        guestType: design.guestType ?? null,
        active: true,
      },
      create: {
        packageId: pkg.id,
        key: design.key,
        name: design.name,
        kind: design.kind,
        eventType: design.eventType ?? null,
        guestType: design.guestType ?? null,
      },
    });
  }
}

async function main() {
  await seedPackages();
}

main().finally(() => db.$disconnect());
