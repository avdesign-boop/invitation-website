import { loadEnvConfig } from "@next/env";
import { PrismaClient, type EventSide, type InvitedBy, type LinkType } from "@prisma/client";
import { hashPassword } from "../services/business/crypto";
import rawData from "./data.json";

loadEnvConfig(process.cwd());

type DemoEvent = {
  key: string;
  name: string;
  side: EventSide;
  venue: string;
  address: string | null;
  startsAt: string;
  dressCode: string | null;
  note: string | null;
  design: string;
};

type DemoLink = {
  token: string;
  type: LinkType;
  side: InvitedBy;
  audienceLabel: string | null;
  design: string | null;
  customText: string | null;
  enabled: boolean;
  events: { event: string; startsAt?: string; invitedBy?: InvitedBy }[];
};

type DemoData = {
  business: { name: string };
  plan: { name: string; priceMonthly: number; currency: string; weddingLimit: number };
  package: string;
  wedding: { slug: string; brideName: string; groomName: string; showDefaultPageWhenOff: boolean };
  events: DemoEvent[];
  links: DemoLink[];
};

const data = rawData as unknown as DemoData;
const db = new PrismaClient();
const appUrl = process.env.APP_URL ?? "http://localhost:3000";

function credentials(): { email: string; password: string } {
  const email = process.env.LOGIN_HINT_EMAIL?.trim().toLowerCase();
  const password = process.env.LOGIN_HINT_PASSWORD;
  if (!email || !password) {
    throw new Error("Set LOGIN_HINT_EMAIL and LOGIN_HINT_PASSWORD. They become the demo account.");
  }
  return { email, password };
}

async function designId(key: string): Promise<string> {
  const design = await db.design.findUnique({ where: { key } });
  if (!design) {
    throw new Error(`Design ${key} not found. Run the main seed first.`);
  }
  return design.id;
}

async function resetDemoData(email: string) {
  const business = await db.business.findUnique({ where: { email } });
  if (!business) {
    return;
  }
  const weddings = await db.wedding.findMany({ where: { businessId: business.id }, select: { id: true } });
  const weddingIds = weddings.map((wedding) => wedding.id);
  await db.$transaction([
    db.inviteLink.deleteMany({ where: { weddingId: { in: weddingIds } } }),
    db.wedding.deleteMany({ where: { businessId: business.id } }),
  ]);
  console.log(`Removed ${weddingIds.length} demo wedding(s).`);
}

async function createDemoData(email: string, password: string) {
  if (await db.wedding.findUnique({ where: { slug: data.wedding.slug } })) {
    console.log(`Demo wedding "${data.wedding.slug}" already exists. Nothing to do.`);
    return;
  }

  const pkg = await db.package.findFirst({ where: { name: data.package } });
  if (!pkg) {
    throw new Error("Package not found. Run the main seed first.");
  }

  const plan =
    (await db.plan.findFirst({ where: { name: data.plan.name } })) ??
    (await db.plan.create({ data: data.plan }));

  const business =
    (await db.business.findUnique({ where: { email } })) ??
    (await db.business.create({
      data: {
        name: data.business.name,
        email,
        passwordHash: await hashPassword(password),
        emailVerifiedAt: new Date(),
      },
    }));

  const periodEnd = new Date();
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  await db.subscription.upsert({
    where: { businessId: business.id },
    update: { planId: plan.id, status: "ACTIVE", currentPeriodEnd: periodEnd },
    create: { businessId: business.id, planId: plan.id, status: "ACTIVE", currentPeriodEnd: periodEnd },
  });

  const wedding = await db.wedding.create({
    data: { businessId: business.id, packageId: pkg.id, ...data.wedding },
  });

  const events: Record<string, { id: string }> = {};
  for (const [index, spec] of data.events.entries()) {
    events[spec.key] = await db.event.create({
      data: {
        weddingId: wedding.id,
        name: spec.name,
        side: spec.side,
        venue: spec.venue,
        address: spec.address,
        startsAt: new Date(spec.startsAt),
        dressCode: spec.dressCode,
        note: spec.note,
        designId: await designId(spec.design),
        sortOrder: index,
      },
    });
  }

  for (const link of data.links) {
    await db.inviteLink.create({
      data: {
        weddingId: wedding.id,
        token: link.token,
        type: link.type,
        side: link.side,
        audienceLabel: link.audienceLabel,
        designId: link.design ? await designId(link.design) : null,
        customText: link.customText,
        enabled: link.enabled,
        events: {
          create: link.events.map((entry, index) => ({
            eventId: events[entry.event].id,
            sortOrder: index,
            invitedBy: entry.invitedBy ?? null,
            startsAt: entry.startsAt ? new Date(entry.startsAt) : null,
          })),
        },
      },
    });
  }

  console.log(`Demo login: ${email} / ${password}`);
  for (const link of data.links) {
    console.log(`${link.audienceLabel}: ${appUrl}/w/${data.wedding.slug}/i/${link.token}`);
  }
}

async function main() {
  const { email, password } = credentials();
  if (process.argv.includes("--reset")) {
    await resetDemoData(email);
  }
  await createDemoData(email, password);
}

main().finally(() => db.$disconnect());
