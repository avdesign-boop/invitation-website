import { authedRoute } from "@/lib/http";

export const PUT = authedRoute("wedding.updateEvent");
export const DELETE = authedRoute("wedding.deleteEvent");
