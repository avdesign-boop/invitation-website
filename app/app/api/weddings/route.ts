import { authedRoute } from "@/lib/http";

export const GET = authedRoute("wedding.list");
export const POST = authedRoute("wedding.create");
