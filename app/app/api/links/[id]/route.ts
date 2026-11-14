import { authedRoute } from "@/lib/http";

export const GET = authedRoute("invite.get");
export const PUT = authedRoute("invite.update");
export const DELETE = authedRoute("invite.delete");
