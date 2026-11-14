import { authedRoute } from "@/lib/http";

export const GET = authedRoute("wedding.get");
export const PUT = authedRoute("wedding.update");
export const DELETE = authedRoute("wedding.delete");
