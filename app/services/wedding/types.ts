import type { EventSide } from "@prisma/client";

export type EventInput = {
  name: string;
  side: EventSide;
  venue: string;
  address: string | null;
  mapUrl: string | null;
  startsAt: Date;
  dressCode: string | null;
  note: string | null;
  designId: string;
};

export type EventView = EventInput & {
  id: string;
  sortOrder: number;
};

export type WeddingListItem = {
  id: string;
  brideName: string;
  groomName: string;
  slug: string;
  eventCount: number;
  createdAt: Date;
};

export type WeddingDetail = {
  id: string;
  brideName: string;
  groomName: string;
  slug: string;
  packageId: string;
  showDefaultPageWhenOff: boolean;
  events: EventView[];
};

export type WeddingLookup = {
  id: string;
  brideName: string;
  groomName: string;
  showDefaultPageWhenOff: boolean;
};

export type OwnedWedding = {
  id: string;
  slug: string;
  brideName: string;
  groomName: string;
  packageId: string;
};
