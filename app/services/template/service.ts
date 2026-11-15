import type { DesignKind } from "@prisma/client";
import { db } from "@/lib/db";

export type PackageSummary = {
  id: string;
  name: string;
  description: string | null;
  previewImageUrl: string | null;
  designCount: number;
};

export type PackageDesign = {
  id: string;
  key: string;
  name: string;
  kind: DesignKind;
  eventType: string | null;
  guestType: string | null;
  previewImageUrl: string | null;
};

export type PackageDetail = {
  id: string;
  name: string;
  description: string | null;
  previewImageUrl: string | null;
  designs: PackageDesign[];
};

export type DesignInfo = {
  id: string;
  packageId: string;
  key: string;
  kind: DesignKind;
  eventType: string | null;
};

export async function listPackages(): Promise<{ packages: PackageSummary[] }> {
  const packages = await db.package.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { designs: { where: { active: true } } } } },
  });
  return {
    packages: packages.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      previewImageUrl: p.previewImageUrl,
      designCount: p._count.designs,
    })),
  };
}

export async function getPackage(input: { packageId: string }): Promise<PackageDetail | null> {
  const found = await db.package.findFirst({
    where: { id: input.packageId, active: true },
    include: { designs: { where: { active: true }, orderBy: [{ kind: "asc" }, { name: "asc" }] } },
  });
  if (!found) {
    return null;
  }
  return {
    id: found.id,
    name: found.name,
    description: found.description,
    previewImageUrl: found.previewImageUrl,
    designs: found.designs.map((d) => ({
      id: d.id,
      key: d.key,
      name: d.name,
      kind: d.kind,
      eventType: d.eventType,
      guestType: d.guestType,
      previewImageUrl: d.previewImageUrl,
    })),
  };
}

function toDesignInfo(d: {
  id: string;
  packageId: string;
  key: string;
  kind: DesignKind;
  eventType: string | null;
}): DesignInfo {
  return { id: d.id, packageId: d.packageId, key: d.key, kind: d.kind, eventType: d.eventType };
}

export async function getDesign(input: { designId: string }): Promise<DesignInfo | null> {
  const design = await db.design.findFirst({ where: { id: input.designId, active: true } });
  return design ? toDesignInfo(design) : null;
}

export async function getDesigns(input: { designIds: string[] }): Promise<DesignInfo[]> {
  const designs = await db.design.findMany({ where: { id: { in: input.designIds } } });
  return designs.map(toDesignInfo);
}
