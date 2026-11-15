"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type WeddingItem = {
  id: string;
  brideName: string;
  groomName: string;
  slug: string;
  eventCount: number;
};

export default function DashboardHome() {
  const [weddings, setWeddings] = useState<WeddingItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ weddings: WeddingItem[] }>("GET", "/api/weddings")
      .then((result) => setWeddings(result.weddings))
      .catch((failure) => setError(failure.message));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your weddings</h1>
        <Link href="/dashboard/weddings/new" className="rounded-lg bg-amber-700 px-4 py-2 text-sm text-white hover:bg-amber-800">
          New wedding
        </Link>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      {weddings === null && !error && <p className="text-stone-500">Loading...</p>}
      {weddings?.length === 0 && <p className="text-stone-500">No weddings yet.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {weddings?.map((wedding) => (
          <Link
            key={wedding.id}
            href={`/dashboard/weddings/${wedding.id}`}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-amber-600"
          >
            <p className="text-lg font-semibold">
              {wedding.groomName} &amp; {wedding.brideName}
            </p>
            <p className="mt-1 text-sm text-stone-500">
              {wedding.eventCount} events · /w/{wedding.slug}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
