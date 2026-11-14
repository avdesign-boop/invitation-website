import type { Event } from "@prisma/client";
import { call } from "@/lib/call";
import { db, isUniqueViolation, withTransaction } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { assertValidSlug } from "./slug";
import type {
  EventInput,
  EventView,
  OwnedWedding,
  WeddingDetail,
  WeddingListItem,
  WeddingLookup,
} from "./types";

function toEventView(event: Event): EventView {
  return {
    id: event.id,
    name: event.name,
    side: event.side,
    venue: event.venue,
    address: event.address,
    mapUrl: event.mapUrl,
    startsAt: event.startsAt,
    dressCode: event.dressCode,
    note: event.note,
    designId: event.designId,
    sortOrder: event.sortOrder,
  };
}

async function findOwnedWedding(businessId: string, weddingId: string) {
  const wedding = await db.wedding.findFirst({ where: { id: weddingId, businessId } });
  if (!wedding) {
    throw new AppError(404, "not found");
  }
  return wedding;
}

async function assertEventDesign(packageId: string, designId: string): Promise<void> {
  const design = await call("template.getDesign", { designId });
  if (!design || design.kind !== "EVENT" || design.packageId !== packageId) {
    throw new AppError(400, "invalid input");
  }
}

export async function slugCheck(input: { slug: string }): Promise<{ available: boolean }> {
  assertValidSlug(input.slug);
  const existing = await db.wedding.findUnique({ where: { slug: input.slug } });
  return { available: !existing };
}

export async function create(input: {
  businessId: string;
  brideName: string;
  groomName: string;
  slug: string;
  packageId: string;
}): Promise<{ id: string; slug: string }> {
  assertValidSlug(input.slug);
  if (await db.wedding.findUnique({ where: { slug: input.slug } })) {
    throw new AppError(409, "slug taken");
  }
  const permission = await call("billing.canCreateWedding", { businessId: input.businessId });
  if (!permission.allowed) {
    throw new AppError(403, "plan limit reached");
  }
  const pkg = await call("template.getPackage", { packageId: input.packageId });
  if (!pkg) {
    throw new AppError(400, "invalid input");
  }
  try {
    const wedding = await db.wedding.create({
      data: {
        businessId: input.businessId,
        brideName: input.brideName,
        groomName: input.groomName,
        slug: input.slug,
        packageId: input.packageId,
      },
    });
    return { id: wedding.id, slug: wedding.slug };
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(409, "slug taken");
    }
    throw error;
  }
}

export async function list(input: { businessId: string }): Promise<{ weddings: WeddingListItem[] }> {
  const weddings = await db.wedding.findMany({
    where: { businessId: input.businessId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { events: true } } },
  });
  return {
    weddings: weddings.map((w) => ({
      id: w.id,
      brideName: w.brideName,
      groomName: w.groomName,
      slug: w.slug,
      eventCount: w._count.events,
      createdAt: w.createdAt,
    })),
  };
}

export async function get(input: { businessId: string; weddingId: string }): Promise<WeddingDetail | null> {
  const wedding = await db.wedding.findFirst({
    where: { id: input.weddingId, businessId: input.businessId },
    include: { events: { orderBy: { sortOrder: "asc" } } },
  });
  if (!wedding) {
    return null;
  }
  return {
    id: wedding.id,
    brideName: wedding.brideName,
    groomName: wedding.groomName,
    slug: wedding.slug,
    packageId: wedding.packageId,
    showDefaultPageWhenOff: wedding.showDefaultPageWhenOff,
    events: wedding.events.map(toEventView),
  };
}

export async function update(input: {
  businessId: string;
  weddingId: string;
  brideName: string;
  groomName: string;
  slug: string;
  showDefaultPageWhenOff: boolean;
}): Promise<{ id: string; slug: string }> {
  const wedding = await findOwnedWedding(input.businessId, input.weddingId);
  if (input.slug !== wedding.slug) {
    assertValidSlug(input.slug);
  }
  try {
    const updated = await db.wedding.update({
      where: { id: wedding.id },
      data: {
        brideName: input.brideName,
        groomName: input.groomName,
        slug: input.slug,
        showDefaultPageWhenOff: input.showDefaultPageWhenOff,
      },
    });
    return { id: updated.id, slug: updated.slug };
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(409, "slug taken");
    }
    throw error;
  }
}

export async function remove(input: { businessId: string; weddingId: string }): Promise<{ ok: true }> {
  const wedding = await findOwnedWedding(input.businessId, input.weddingId);
  await withTransaction(async () => {
    await call("invite.deleteByWedding", { weddingId: wedding.id });
    await db.wedding.delete({ where: { id: wedding.id } });
  });
  return { ok: true };
}

export async function addEvent(
  input: { businessId: string; weddingId: string } & EventInput,
): Promise<{ id: string }> {
  const wedding = await findOwnedWedding(input.businessId, input.weddingId);
  await assertEventDesign(wedding.packageId, input.designId);
  const last = await db.event.findFirst({
    where: { weddingId: wedding.id },
    orderBy: { sortOrder: "desc" },
  });
  const event = await db.event.create({
    data: {
      weddingId: wedding.id,
      name: input.name,
      side: input.side,
      venue: input.venue,
      address: input.address,
      mapUrl: input.mapUrl,
      startsAt: input.startsAt,
      dressCode: input.dressCode,
      note: input.note,
      designId: input.designId,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });
  return { id: event.id };
}

export async function updateEvent(
  input: { businessId: string; eventId: string } & EventInput,
): Promise<{ id: string }> {
  const event = await db.event.findFirst({
    where: { id: input.eventId, wedding: { businessId: input.businessId } },
    include: { wedding: true },
  });
  if (!event) {
    throw new AppError(404, "not found");
  }
  await assertEventDesign(event.wedding.packageId, input.designId);
  await db.event.update({
    where: { id: event.id },
    data: {
      name: input.name,
      side: input.side,
      venue: input.venue,
      address: input.address,
      mapUrl: input.mapUrl,
      startsAt: input.startsAt,
      dressCode: input.dressCode,
      note: input.note,
      designId: input.designId,
    },
  });
  return { id: event.id };
}

export async function deleteEvent(input: { businessId: string; eventId: string }): Promise<{ ok: true }> {
  const event = await db.event.findFirst({
    where: { id: input.eventId, wedding: { businessId: input.businessId } },
  });
  if (!event) {
    throw new AppError(404, "not found");
  }
  await withTransaction(async () => {
    await call("invite.removeEvent", { eventId: event.id });
    await db.event.delete({ where: { id: event.id } });
  });
  return { ok: true };
}

export async function reorderEvents(input: {
  businessId: string;
  weddingId: string;
  eventIds: string[];
}): Promise<{ ok: true }> {
  const wedding = await findOwnedWedding(input.businessId, input.weddingId);
  const events = await db.event.findMany({ where: { weddingId: wedding.id }, select: { id: true } });
  const existing = new Set(events.map((e) => e.id));
  const requested = new Set(input.eventIds);
  const matches =
    requested.size === input.eventIds.length &&
    requested.size === existing.size &&
    input.eventIds.every((id) => existing.has(id));
  if (!matches) {
    throw new AppError(400, "ids do not match the wedding's events");
  }
  await withTransaction(async () => {
    for (const [index, id] of input.eventIds.entries()) {
      await db.event.update({ where: { id }, data: { sortOrder: index } });
    }
  });
  return { ok: true };
}

export async function findBySlug(input: { slug: string }): Promise<WeddingLookup | null> {
  const wedding = await db.wedding.findUnique({ where: { slug: input.slug } });
  if (!wedding) {
    return null;
  }
  return {
    id: wedding.id,
    brideName: wedding.brideName,
    groomName: wedding.groomName,
    showDefaultPageWhenOff: wedding.showDefaultPageWhenOff,
  };
}

export async function getEvents(input: { weddingId: string; eventIds: string[] }): Promise<EventView[]> {
  const events = await db.event.findMany({
    where: { weddingId: input.weddingId, id: { in: input.eventIds } },
  });
  const byId = new Map(events.map((event) => [event.id, event]));
  return input.eventIds.flatMap((id) => {
    const event = byId.get(id);
    return event ? [toEventView(event)] : [];
  });
}

export async function countByBusiness(input: { businessId: string }): Promise<{ count: number }> {
  return { count: await db.wedding.count({ where: { businessId: input.businessId } }) };
}

export async function getOwned(input: {
  businessId: string;
  weddingId: string;
}): Promise<OwnedWedding | null> {
  const wedding = await db.wedding.findFirst({
    where: { id: input.weddingId, businessId: input.businessId },
  });
  if (!wedding) {
    return null;
  }
  return {
    id: wedding.id,
    slug: wedding.slug,
    brideName: wedding.brideName,
    groomName: wedding.groomName,
    packageId: wedding.packageId,
  };
}
