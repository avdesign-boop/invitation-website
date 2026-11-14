import "@/services";
import { redirect } from "next/navigation";
import { call } from "@/lib/call";
import { DefaultPage } from "@/services/rendering/DefaultPage";
import { ErrorPage } from "@/services/rendering/ErrorPage";
import { getDesignComponent } from "@/services/template/designs";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;

  let resolution;
  try {
    resolution = await call("rendering.resolveInvite", { slug, token });
  } catch (error) {
    console.error(error);
    return <ErrorPage />;
  }

  if (resolution.outcome === "redirect") {
    redirect(process.env.COMPANY_URL ?? "/");
  }
  if (resolution.outcome === "default") {
    return <DefaultPage brideName={resolution.brideName} groomName={resolution.groomName} />;
  }

  const Design = getDesignComponent(resolution.designKey);
  if (!Design) {
    console.error(`No coded page for design key: ${resolution.designKey}`);
    return <ErrorPage />;
  }
  return <Design data={resolution.data} />;
}
