import { register } from "@/lib/call";
import * as service from "./service";
import type { DesignInfo, PackageDetail, PackageSummary } from "./service";

declare module "@/lib/call" {
  interface Operations {
    "template.listPackages": { input: Record<string, never>; output: { packages: PackageSummary[] } };
    "template.getPackage": { input: { packageId: string }; output: PackageDetail | null };
    "template.getDesign": { input: { designId: string }; output: DesignInfo | null };
    "template.getDesigns": { input: { designIds: string[] }; output: DesignInfo[] };
  }
}

register("template.listPackages", service.listPackages);
register("template.getPackage", service.getPackage, { idParam: "packageId", notFound: true });
register("template.getDesign", service.getDesign);
register("template.getDesigns", service.getDesigns);
