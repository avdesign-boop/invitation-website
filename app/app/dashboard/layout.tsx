"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    api<{ name: string }>("GET", "/api/business/me")
      .then((business) => setName(business.name))
      .catch(() => router.replace("/login"));
  }, [router]);

  async function logout() {
    await api("POST", "/api/business/logout");
    router.replace("/login");
  }

  if (name === null) {
    return <p className="p-8 text-stone-500">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="font-semibold">
              Weddings
            </Link>
            <Link href="/dashboard/templates" className="text-stone-600 hover:text-stone-900">
              Templates
            </Link>
          </nav>
          <div className="flex items-center gap-4 text-sm text-stone-600">
            <span>{name}</span>
            <button onClick={logout} className="rounded-lg border border-stone-300 px-3 py-1 hover:bg-stone-100">
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
