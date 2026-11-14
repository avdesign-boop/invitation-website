import { register } from "@/lib/call";
import * as service from "./service";
import type { InviteResolution } from "./service";

declare module "@/lib/call" {
  interface Operations {
    "rendering.resolveInvite": {
      input: { slug: string; token: string };
      output: InviteResolution;
    };
  }
}

register("rendering.resolveInvite", service.resolveInvite);
