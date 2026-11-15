"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DesignPreview } from "@/components/DesignPreview";
import { sampleDataFor } from "@/components/sampleData";
import { api } from "@/lib/api";

type PackageDesign = {
  id: string;
  key: string;
  name: string;
  kind: "EVENT" | "SUMMARY";
  eventType: string | null;
  guestType: string | null;
};

type PackageDetail = {
  id: string;
  name: string;
  description: string | null;
  designs: PackageDesign[];
};

function DesignGrid({ title, designs }: { title: string; designs: PackageDesign[] }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex flex-wrap gap-6">
        {designs.map((design) => (
          <div key={design.id} className="space-y-2">
            <DesignPreview designKey={design.key} data={sampleDataFor(design.kind, design.name)} scale={0.5} />
            <p className="text-sm font-medium">{design.name}</p>
            {design.guestType && <p className="text-xs text-stone-500">For {design.guestType.toLowerCase()}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [pkg, setPkg] = useState<PackageDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<PackageDetail>("GET", `/api/packages/${id}`)
      .then(setPkg)
      .catch((failure) => setError(failure.message));
  }, [id]);

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }
  if (!pkg) {
    return <p className="text-stone-500">Loading...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/templates" className="text-sm text-amber-700 hover:underline">
          Back to templates
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{pkg.name}</h1>
        {pkg.description && <p className="mt-1 text-stone-600">{pkg.description}</p>}
      </div>
      <DesignGrid title="Event designs" designs={pkg.designs.filter((design) => design.kind === "EVENT")} />
      <DesignGrid title="Summary designs" designs={pkg.designs.filter((design) => design.kind === "SUMMARY")} />
    </div>
  );
}
