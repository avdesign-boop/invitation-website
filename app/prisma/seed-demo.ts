import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../services/business/crypto";

const db = new PrismaClient();

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "demo-password-1";
const DEMO_SLUG = "aarav-meera";
const appUrl = process.env.APP_URL ?? "http://localhost:3000";

async function designId(key: string): Promise<string> {
  const design = await db.design.findUnique({ where: { key } });
  if (!design) {
    throw new Error(`Design ${key} not found. Run the main seed first.`);
  }
  return design.id;
}

async function main() {
  if (await db.wedding.findUnique({ where: { slug: DEMO_SLUG } })) {
    console.log(`Demo wedding "${DEMO_SLUG}" already exists. Nothing to do.`);
    return;
  }

  const pkg = await db.package.findFirst({ where: { name: "Royal Marigold" } });
  if (!pkg) {
    throw new Error("Package not found. Run the main seed first.");
  }

  const plan =
    (await db.plan.findFirst({ where: { name: "Demo" } })) ??
    (await db.plan.create({
      data: { name: "Demo", priceMonthly: 999, currency: "INR", weddingLimit: 5 },
    }));

  const business =
    (await db.business.findUnique({ where: { email: DEMO_EMAIL } })) ??
    (await db.business.create({
      data: {
        name: "Demo Studio",
        email: DEMO_EMAIL,
        passwordHash: await hashPassword(DEMO_PASSWORD),
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
    data: {
      businessId: business.id,
      slug: DEMO_SLUG,
      brideName: "Meera",
      groomName: "Aarav",
      packageId: pkg.id,
      showDefaultPageWhenOff: true,
    },
  });

  const eventSpecs = [
    {
      key: "mehendi",
      name: "Mehendi",
      side: "BRIDE" as const,
      venue: "The Garden Courtyard",
      address: "12 Lotus Lane, Jaipur",
      startsAt: "2027-02-10T16:00:00+05:30",
      dressCode: "Green and yellow",
      note: "Henna artists and snacks all afternoon",
      design: "royal-mehendi",
    },
    {
      key: "haldi",
      name: "Haldi",
      side: "BOTH" as const,
      venue: "Marigold Lawns",
      address: "7 Palace Road, Jaipur",
      startsAt: "2027-02-11T10:00:00+05:30",
      dressCode: "Yellow, clothes you do not mind staining",
      note: null,
      design: "royal-haldi",
    },
    {
      key: "sangeet",
      name: "Sangeet",
      side: "BOTH" as const,
      venue: "Rambagh Ballroom",
      address: "Bhawani Singh Road, Jaipur",
      startsAt: "2027-02-11T19:00:00+05:30",
      dressCode: "Festive and glamorous",
      note: "Performances followed by dinner",
      design: "royal-sangeet",
    },
    {
      key: "wedding",
      name: "Wedding Ceremony",
      side: "BOTH" as const,
      venue: "Amber Fort Grounds",
      address: "Amer, Jaipur",
      startsAt: "2027-02-12T18:30:00+05:30",
      dressCode: "Traditional",
      note: "Baraat arrives at 6:30 PM",
      design: "royal-wedding",
    },
    {
      key: "reception",
      name: "Reception",
      side: "GROOM" as const,
      venue: "The Grand Pavilion",
      address: "Civil Lines, Jaipur",
      startsAt: "2027-02-13T20:00:00+05:30",
      dressCode: "Cocktail",
      note: null,
      design: "royal-reception",
    },
  ];

  const events: Record<string, { id: string }> = {};
  for (const [index, spec] of eventSpecs.entries()) {
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

  const links = [
    {
      token: "demo-close-family",
      type: "SUMMARY" as const,
      side: "BOTH" as const,
      audienceLabel: "Close family",
      design: "royal-summary-family",
      customText: "We would love to have you with us for every celebration.",
      enabled: true,
      events: [
        { key: "mehendi" },
        { key: "haldi" },
        { key: "sangeet" },
        { key: "wedding" },
        { key: "reception" },
      ],
    },
    {
      token: "demo-friends",
      type: "SUMMARY" as const,
      side: "GROOM" as const,
      audienceLabel: "Groom's friends",
      design: "royal-summary-friends",
      customText: null,
      enabled: true,
      events: [
        { key: "sangeet", startsAt: "2027-02-11T19:30:00+05:30" },
        { key: "wedding", invitedBy: "GROOM" as const },
        { key: "reception", invitedBy: "GROOM" as const },
      ],
    },
    {
      token: "demo-mehendi",
      type: "SINGLE_EVENT" as const,
      side: "BRIDE" as const,
      audienceLabel: "Bride's cousins",
      design: null,
      customText: null,
      enabled: true,
      events: [{ key: "mehendi" }],
    },
    {
      token: "demo-wedding",
      type: "SINGLE_EVENT" as const,
      side: "GROOM" as const,
      audienceLabel: "Groom's colleagues",
      design: null,
      customText: null,
      enabled: true,
      events: [{ key: "wedding", startsAt: "2027-02-12T19:00:00+05:30", invitedBy: "GROOM" as const }],
    },
    {
      token: "demo-turned-off",
      type: "SINGLE_EVENT" as const,
      side: "BOTH" as const,
      audienceLabel: "Turned off sample",
      design: null,
      customText: null,
      enabled: false,
      events: [{ key: "reception" }],
    },
  ];

  for (const link of links) {
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
            eventId: events[entry.key].id,
            sortOrder: index,
            invitedBy: "invitedBy" in entry ? entry.invitedBy : null,
            startsAt: "startsAt" in entry && entry.startsAt ? new Date(entry.startsAt) : null,
          })),
        },
      },
    });
  }

  console.log(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  for (const link of links) {
    console.log(`${link.audienceLabel}: ${appUrl}/w/${DEMO_SLUG}/i/${link.token}`);
  }
}

main().finally(() => db.$disconnect());
