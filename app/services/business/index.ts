import { register } from "@/lib/call";
import * as service from "./service";
import { forgotPasswordSchema, loginSchema, setPasswordSchema, signupSchema } from "./schemas";
import type { BusinessSummary } from "./types";

declare module "@/lib/call" {
  interface Operations {
    "business.signup": { input: { name: string; email: string }; output: { ok: true } };
    "business.forgotPassword": { input: { email: string }; output: { ok: true } };
    "business.setPassword": { input: { token: string; password: string }; output: { ok: true } };
    "business.login": {
      input: { email: string; password: string };
      output: { business: BusinessSummary; session: { id: string; expiresAt: Date } };
    };
    "business.logout": { input: { sessionId: string }; output: { ok: true } };
    "business.validateSession": {
      input: { sessionId: string };
      output: { businessId: string } | null;
    };
    "business.me": { input: { businessId: string }; output: BusinessSummary | null };
  }
}

register("business.signup", service.signup, { schema: signupSchema, message: "sent" });
register("business.forgotPassword", service.forgotPassword, {
  schema: forgotPasswordSchema,
  message: "sent",
});
register("business.setPassword", service.setPassword, {
  schema: setPasswordSchema,
  message: "password set",
});
register("business.login", service.login, { schema: loginSchema });
register("business.logout", service.logout, {
  sessionInput: true,
  clearSession: true,
  message: "logged out",
});
register("business.validateSession", service.validateSession);
register("business.me", service.me, {
  notFound: { status: 401, message: "not logged in" },
});
