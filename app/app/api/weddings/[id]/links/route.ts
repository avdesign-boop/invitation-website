import { authedRoute } from "@/lib/http";

export const GET = authedRoute("invite.list");
export const POST = authedRoute("invite.create");
