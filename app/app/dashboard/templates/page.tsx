"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type PackageItem = {
  id: string;
  name: string;
  description: string | null;
  designCount: number;
};

export default function TemplatesPage() {
  const [packages, setPackages] = useState<PackageItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ packages: PackageItem[] }>("GET", "/api/packages")
      .then((result) => setPackages(result.packages))
      .catch((failure) => setError(failure.message));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Templates</h1>
      {error && <p className="text-red-600">{error}</p>}
      {packages === null && !error && <p className="text-stone-500">Loading...</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {packages?.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard/templates/${item.id}`}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-amber-600"
          >
            <p className="text-lg font-semibold">{item.name}</p>
            {item.description && <p className="mt-1 text-sm text-stone-600">{item.description}</p>}
            <p className="mt-3 text-sm text-stone-500">{item.designCount} designs</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
