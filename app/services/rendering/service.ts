import { call } from "@/lib/call";
import { AppError } from "@/lib/errors";
import type { DesignData } from "@/services/template/designs/types";

export type InviteResolution =
  | { outcome: "redirect" }
  | { outcome: "default"; brideName: string; groomName: string }
  | { outcome: "page"; designKey: string; data: DesignData };

export async function resolveInvite(input: { slug: string; token: string }): Promise<InviteResolution> {
  const wedding = await call("wedding.findBySlug", { slug: input.slug });
  if (!wedding) {
    return { outcome: "redirect" };
  }

  const link = await call("invite.getForRender", { weddingId: wedding.id, token: input.token });
  if (!link) {
    return { outcome: "redirect" };
  }

  if (!link.enabled) {
    return wedding.showDefaultPageWhenOff
      ? { outcome: "default", brideName: wedding.brideName, groomName: wedding.groomName }
      : { outcome: "redirect" };
  }

  const events = await call("wedding.getEvents", {
    weddingId: wedding.id,
    eventIds: link.events.map((entry) => entry.eventId),
  });
  const eventsById = new Map(events.map((event) => [event.id, event]));

  const shown = link.events.flatMap((entry) => {
    const event = eventsById.get(entry.eventId);
    return event ? [{ event, entry }] : [];
  });
  if (shown.length === 0) {
    throw new AppError(500, "link has no events");
  }

  const designId = link.type === "SINGLE_EVENT" ? shown[0].event.designId : link.designId;
  if (!designId) {
    throw new AppError(500, "link has no design");
  }
  const design = await call("template.getDesign", { designId });
  if (!design) {
    throw new AppError(500, "design not found");
  }

  return {
    outcome: "page",
    designKey: design.key,
    data: {
      brideName: wedding.brideName,
      groomName: wedding.groomName,
      customText: link.customText,
      events: shown.map(({ event, entry }) => ({
        id: event.id,
        name: event.name,
        startsAt: entry.startsAt ?? event.startsAt,
        venue: event.venue,
        address: event.address,
        mapUrl: event.mapUrl,
        dressCode: event.dressCode,
        note: event.note,
        invitedBy: entry.invitedBy ?? link.side,
      })),
    },
  };
}
