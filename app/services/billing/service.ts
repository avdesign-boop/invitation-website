import { call } from "@/lib/call";
import { db } from "@/lib/db";

export async function canCreateWedding(input: {
  businessId: string;
}): Promise<{ allowed: boolean; reason?: string }> {
  const subscription = await db.subscription.findUnique({
    where: { businessId: input.businessId },
    include: { plan: true },
  });
  if (!subscription || subscription.status !== "ACTIVE" || !subscription.plan) {
    return { allowed: false, reason: "no active subscription" };
  }
  const { count } = await call("wedding.countByBusiness", { businessId: input.businessId });
  if (count >= subscription.plan.weddingLimit) {
    return { allowed: false, reason: "wedding limit reached" };
  }
  return { allowed: true };
}
