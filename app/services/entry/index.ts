import { register } from "@/lib/call";
import { inviteUrl } from "./urls";

declare module "@/lib/call" {
  interface Operations {
    "entry.ping": { input: { message: string }; output: { message: string } };
    "entry.inviteUrl": { input: { slug: string; token: string }; output: { url: string } };
  }
}

register("entry.ping", async ({ message }) => ({ message }));
register("entry.inviteUrl", async ({ slug, token }) => ({ url: inviteUrl(slug, token) }));
