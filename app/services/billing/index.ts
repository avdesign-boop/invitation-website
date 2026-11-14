import { register } from "@/lib/call";
import * as service from "./service";

declare module "@/lib/call" {
  interface Operations {
    "billing.canCreateWedding": {
      input: { businessId: string };
      output: { allowed: boolean; reason?: string };
    };
  }
}

register("billing.canCreateWedding", service.canCreateWedding);
