import { register } from "@/lib/call";
import * as service from "./service";
import {
  eventSchema,
  reorderSchema,
  slugCheckSchema,
  weddingCreateSchema,
  weddingUpdateSchema,
} from "./schemas";
import type {
  EventInput,
  EventView,
  OwnedWedding,
  WeddingDetail,
  WeddingListItem,
  WeddingLookup,
} from "./types";

declare module "@/lib/call" {
  interface Operations {
    "wedding.slugCheck": { input: { slug: string }; output: { available: boolean } };
    "wedding.create": {
      input: { businessId: string; brideName: string; groomName: string; slug: string; packageId: string };
      output: { id: string; slug: string };
    };
    "wedding.list": { input: { businessId: string }; output: { weddings: WeddingListItem[] } };
    "wedding.get": {
      input: { businessId: string; weddingId: string };
      output: WeddingDetail | null;
    };
    "wedding.update": {
      input: {
        businessId: string;
        weddingId: string;
        brideName: string;
        groomName: string;
        slug: string;
        showDefaultPageWhenOff: boolean;
      };
      output: { id: string; slug: string };
    };
    "wedding.delete": { input: { businessId: string; weddingId: string }; output: { ok: true } };
    "wedding.addEvent": {
      input: { businessId: string; weddingId: string } & EventInput;
      output: { id: string };
    };
    "wedding.updateEvent": {
      input: { businessId: string; eventId: string } & EventInput;
      output: { id: string };
    };
    "wedding.deleteEvent": { input: { businessId: string; eventId: string }; output: { ok: true } };
    "wedding.reorderEvents": {
      input: { businessId: string; weddingId: string; eventIds: string[] };
      output: { ok: true };
    };
    "wedding.findBySlug": { input: { slug: string }; output: WeddingLookup | null };
    "wedding.getEvents": {
      input: { weddingId: string; eventIds: string[] };
      output: EventView[];
    };
    "wedding.countByBusiness": { input: { businessId: string }; output: { count: number } };
    "wedding.getOwned": {
      input: { businessId: string; weddingId: string };
      output: OwnedWedding | null;
    };
  }
}

register("wedding.slugCheck", service.slugCheck, { schema: slugCheckSchema });
register("wedding.create", service.create, { schema: weddingCreateSchema, status: 201 });
register("wedding.list", service.list);
register("wedding.get", service.get, { idParam: "weddingId", notFound: true });
register("wedding.update", service.update, { idParam: "weddingId", schema: weddingUpdateSchema });
register("wedding.delete", service.remove, { idParam: "weddingId", message: "deleted" });
register("wedding.addEvent", service.addEvent, {
  idParam: "weddingId",
  schema: eventSchema,
  status: 201,
});
register("wedding.updateEvent", service.updateEvent, { idParam: "eventId", schema: eventSchema });
register("wedding.deleteEvent", service.deleteEvent, { idParam: "eventId", message: "deleted" });
register("wedding.reorderEvents", service.reorderEvents, {
  idParam: "weddingId",
  schema: reorderSchema,
  message: "reordered",
});
register("wedding.findBySlug", service.findBySlug);
register("wedding.getEvents", service.getEvents);
register("wedding.countByBusiness", service.countByBusiness);
register("wedding.getOwned", service.getOwned);
