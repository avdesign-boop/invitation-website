import type { InvitedBy, LinkType } from "@prisma/client";

export type LinkEventInput = {
  eventId: string;
  invitedBy: InvitedBy | null;
  startsAt: Date | null;
};

export type LinkInput = {
  type: LinkType;
  side: InvitedBy;
  audienceLabel: string | null;
  designId: string | null;
  customText: string | null;
  events: LinkEventInput[];
};

export type LinkListItem = {
  id: string;
  type: LinkType;
  side: InvitedBy;
  audienceLabel: string | null;
  enabled: boolean;
  eventCount: number;
  url: string;
  createdAt: Date;
};

export type LinkDetail = {
  id: string;
  type: LinkType;
  side: InvitedBy;
  audienceLabel: string | null;
  designId: string | null;
  customText: string | null;
  enabled: boolean;
  url: string;
  events: LinkEventInput[];
};

export type RenderLink = {
  weddingId: string;
  enabled: boolean;
  type: LinkType;
  side: InvitedBy;
  designId: string | null;
  customText: string | null;
  events: LinkEventInput[];
};

export type WeddingRef = {
  id: string;
  slug: string;
  packageId: string;
};
