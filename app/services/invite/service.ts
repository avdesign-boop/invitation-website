import type { InviteLink, InviteLinkEvent } from "@prisma/client";
import { call } from "@/lib/call";
import { db, withTransaction } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { newToken } from "./token";
import type {
  LinkDetail,
  LinkEventInput,
  LinkInput,
  LinkListItem,
  RenderLink,
  WeddingRef,
} from "./types";

type LinkWithEvents = InviteLink & { events: InviteLinkEvent[] };

async function requireWedding(businessId: string, weddingId: string): Promise<WeddingRef> {
  const wedding = await call("wedding.getOwned", { businessId, weddingId });
  if (!wedding) {
    throw new AppError(404, "not found");
  }
  return wedding;
}

async function findOwnedLink(
  businessId: string,
  linkId: string,
): Promise<{ link: LinkWithEvents; wedding: WeddingRef }> {
  const link = await db.inviteLink.findUnique({
    where: { id: linkId },
    include: { events: { orderBy: { sortOrder: "asc" } } },
  });
  if (!link) {
    throw new AppError(404, "not found");
  }
  const wedding = await requireWedding(businessId, link.weddingId);
  return { link, wedding };
}

async function assertLinkInput(wedding: WeddingRef, input: LinkInput): Promise<void> {
  const eventIds = input.events.map((event) => event.eventId);
  if (eventIds.length === 0 || new Set(eventIds).size !== eventIds.length) {
    throw new AppError(400, "invalid input");
  }
  if (input.type === "SINGLE_EVENT") {
    if (eventIds.length !== 1 || input.designId) {
      throw new AppError(400, "invalid input");
    }
  } else {
    if (!input.designId) {
      throw new AppError(400, "invalid input");
    }
    const design = await call("template.getDesign", { designId: input.designId });
    if (!design || design.kind !== "SUMMARY" || design.packageId !== wedding.packageId) {
      throw new AppError(400, "invalid input");
    }
  }
  const events = await call("wedding.getEvents", { weddingId: wedding.id, eventIds });
  if (events.length !== eventIds.length) {
    throw new AppError(400, "invalid input");
  }
}

function eventRows(events: LinkEventInput[]) {
  return events.map((event, index) => ({
    eventId: event.eventId,
    sortOrder: index,
    invitedBy: event.invitedBy,
    startsAt: event.startsAt,
  }));
}

function toEventInputs(events: InviteLinkEvent[]): LinkEventInput[] {
  return events.map((event) => ({
    eventId: event.eventId,
    invitedBy: event.invitedBy,
    startsAt: event.startsAt,
  }));
}

async function urlFor(slug: string, token: string): Promise<string> {
  const { url } = await call("entry.inviteUrl", { slug, token });
  return url;
}

export async function create(
  input: { businessId: string; weddingId: string } & LinkInput,
): Promise<{ id: string; token: string; url: string }> {
  const wedding = await requireWedding(input.businessId, input.weddingId);
  await assertLinkInput(wedding, input);
  const token = newToken();
  const link = await db.inviteLink.create({
    data: {
      weddingId: wedding.id,
      token,
      type: input.type,
      side: input.side,
      audienceLabel: input.audienceLabel,
      designId: input.designId,
      customText: input.customText,
      events: { create: eventRows(input.events) },
    },
  });
  return { id: link.id, token, url: await urlFor(wedding.slug, token) };
}

export async function list(input: {
  businessId: string;
  weddingId: string;
}): Promise<{ links: LinkListItem[] }> {
  const wedding = await requireWedding(input.businessId, input.weddingId);
  const links = await db.inviteLink.findMany({
    where: { weddingId: wedding.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { events: true } } },
  });
  const items = await Promise.all(
    links.map(async (link) => ({
      id: link.id,
      type: link.type,
      side: link.side,
      audienceLabel: link.audienceLabel,
      enabled: link.enabled,
      eventCount: link._count.events,
      url: await urlFor(wedding.slug, link.token),
      createdAt: link.createdAt,
    })),
  );
  return { links: items };
}

export async function get(input: { businessId: string; linkId: string }): Promise<LinkDetail | null> {
  let found;
  try {
    found = await findOwnedLink(input.businessId, input.linkId);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) {
      return null;
    }
    throw error;
  }
  const { link, wedding } = found;
  return {
    id: link.id,
    type: link.type,
    side: link.side,
    audienceLabel: link.audienceLabel,
    designId: link.designId,
    customText: link.customText,
    enabled: link.enabled,
    url: await urlFor(wedding.slug, link.token),
    events: toEventInputs(link.events),
  };
}

export async function update(
  input: { businessId: string; linkId: string } & LinkInput,
): Promise<{ id: string; url: string }> {
  const { link, wedding } = await findOwnedLink(input.businessId, input.linkId);
  await assertLinkInput(wedding, input);
  await withTransaction(async () => {
    await db.inviteLink.update({
      where: { id: link.id },
      data: {
        type: input.type,
        side: input.side,
        audienceLabel: input.audienceLabel,
        designId: input.designId,
        customText: input.customText,
      },
    });
    await db.inviteLinkEvent.deleteMany({ where: { linkId: link.id } });
    await db.inviteLinkEvent.createMany({
      data: eventRows(input.events).map((row) => ({ ...row, linkId: link.id })),
    });
  });
  return { id: link.id, url: await urlFor(wedding.slug, link.token) };
}

export async function setEnabled(input: {
  businessId: string;
  linkId: string;
  enabled: boolean;
}): Promise<{ enabled: boolean }> {
  const { link } = await findOwnedLink(input.businessId, input.linkId);
  const updated = await db.inviteLink.update({
    where: { id: link.id },
    data: { enabled: input.enabled },
  });
  return { enabled: updated.enabled };
}

export async function copy(input: {
  businessId: string;
  linkId: string;
}): Promise<{ id: string; token: string; url: string }> {
  const { link, wedding } = await findOwnedLink(input.businessId, input.linkId);
  const token = newToken();
  const created = await db.inviteLink.create({
    data: {
      weddingId: link.weddingId,
      token,
      type: link.type,
      side: link.side,
      audienceLabel: link.audienceLabel,
      designId: link.designId,
      customText: link.customText,
      events: { create: eventRows(toEventInputs(link.events)) },
    },
  });
  return { id: created.id, token, url: await urlFor(wedding.slug, token) };
}

export async function remove(input: { businessId: string; linkId: string }): Promise<{ ok: true }> {
  const { link } = await findOwnedLink(input.businessId, input.linkId);
  await db.inviteLink.delete({ where: { id: link.id } });
  return { ok: true };
}

function toRenderLink(link: LinkWithEvents): RenderLink {
  return {
    weddingId: link.weddingId,
    enabled: link.enabled,
    type: link.type,
    side: link.side,
    designId: link.designId,
    customText: link.customText,
    events: toEventInputs(link.events),
  };
}

export async function getForRender(input: {
  weddingId: string;
  token: string;
}): Promise<RenderLink | null> {
  const link = await db.inviteLink.findFirst({
    where: { token: input.token, weddingId: input.weddingId },
    include: { events: { orderBy: { sortOrder: "asc" } } },
  });
  return link ? toRenderLink(link) : null;
}

export async function getForOwner(input: {
  businessId: string;
  linkId: string;
}): Promise<RenderLink | null> {
  try {
    const { link } = await findOwnedLink(input.businessId, input.linkId);
    return toRenderLink(link);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function deleteByWedding(input: { weddingId: string }): Promise<{ ok: true }> {
  await db.inviteLink.deleteMany({ where: { weddingId: input.weddingId } });
  return { ok: true };
}

export async function removeEvent(input: { eventId: string }): Promise<{ ok: true }> {
  const affected = await db.inviteLinkEvent.findMany({
    where: { eventId: input.eventId },
    select: { linkId: true },
  });
  await db.inviteLinkEvent.deleteMany({ where: { eventId: input.eventId } });
  const linkIds = [...new Set(affected.map((entry) => entry.linkId))];
  if (linkIds.length > 0) {
    await db.inviteLink.deleteMany({ where: { id: { in: linkIds }, events: { none: {} } } });
  }
  return { ok: true };
}
