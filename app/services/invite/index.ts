import { register } from "@/lib/call";
import * as service from "./service";
import { enabledSchema, linkSchema } from "./schemas";
import type { LinkDetail, LinkInput, LinkListItem, RenderLink } from "./types";

declare module "@/lib/call" {
  interface Operations {
    "invite.create": {
      input: { businessId: string; weddingId: string } & LinkInput;
      output: { id: string; token: string; url: string };
    };
    "invite.list": {
      input: { businessId: string; weddingId: string };
      output: { links: LinkListItem[] };
    };
    "invite.get": { input: { businessId: string; linkId: string }; output: LinkDetail | null };
    "invite.update": {
      input: { businessId: string; linkId: string } & LinkInput;
      output: { id: string; url: string };
    };
    "invite.setEnabled": {
      input: { businessId: string; linkId: string; enabled: boolean };
      output: { enabled: boolean };
    };
    "invite.copy": {
      input: { businessId: string; linkId: string };
      output: { id: string; token: string; url: string };
    };
    "invite.delete": { input: { businessId: string; linkId: string }; output: { ok: true } };
    "invite.getForRender": {
      input: { weddingId: string; token: string };
      output: RenderLink | null;
    };
    "invite.getForOwner": {
      input: { businessId: string; linkId: string };
      output: RenderLink | null;
    };
    "invite.deleteByWedding": { input: { weddingId: string }; output: { ok: true } };
    "invite.removeEvent": { input: { eventId: string }; output: { ok: true } };
  }
}

register("invite.create", service.create, { idParam: "weddingId", schema: linkSchema, status: 201 });
register("invite.list", service.list, { idParam: "weddingId" });
register("invite.get", service.get, { idParam: "linkId", notFound: true });
register("invite.update", service.update, { idParam: "linkId", schema: linkSchema });
register("invite.setEnabled", service.setEnabled, { idParam: "linkId", schema: enabledSchema });
register("invite.copy", service.copy, { idParam: "linkId", status: 201 });
register("invite.delete", service.remove, { idParam: "linkId", message: "deleted" });
register("invite.getForRender", service.getForRender);
register("invite.getForOwner", service.getForOwner);
register("invite.deleteByWedding", service.deleteByWedding);
register("invite.removeEvent", service.removeEvent);
