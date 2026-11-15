"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";

type PackageItem = { id: string; name: string; description: string | null };

const inputClass = "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 38);
}

export default function NewWeddingPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [packageId, setPackageId] = useState("");
  const [slugState, setSlugState] = useState<"idle" | "available" | "taken">("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ packages: PackageItem[] }>("GET", "/api/packages")
      .then((result) => {
        setPackages(result.packages);
        setPackageId(result.packages[0]?.id ?? "");
      })
      .catch((failure) => setError(failure.message));
  }, []);

  useEffect(() => {
    if (!slugEdited) {
      setSlug(slugify([groomName, brideName].filter(Boolean).join("-")));
    }
  }, [groomName, brideName, slugEdited]);

  useEffect(() => {
    setSlugState("idle");
    if (slug.length < 3) {
      return;
    }
    const timer = setTimeout(() => {
      api<{ available: boolean }>("GET", `/api/weddings/slug-check?slug=${encodeURIComponent(slug)}`)
        .then((result) => setSlugState(result.available ? "available" : "taken"))
        .catch(() => setSlugState("idle"));
    }, 400);
    return () => clearTimeout(timer);
  }, [slug]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await api<{ id: string }>("POST", "/api/weddings", {
        brideName,
        groomName,
        slug,
        packageId,
      });
      router.push(`/dashboard/weddings/${created.id}`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-amber-700 hover:underline">
          Back to weddings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New wedding</h1>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-stone-700">
            Groom name
            <input required className={inputClass} value={groomName} onChange={(e) => setGroomName(e.target.value)} />
          </label>
          <label className="block text-sm text-stone-700">
            Bride name
            <input required className={inputClass} value={brideName} onChange={(e) => setBrideName(e.target.value)} />
          </label>
        </div>
        <label className="block text-sm text-stone-700">
          Invite address
          <input
            required
            className={inputClass}
            value={slug}
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(e.target.value.toLowerCase());
            }}
          />
          <span className="mt-1 block text-xs text-stone-500">
            Your invite links will start with /w/{slug || "your-address"}/
          </span>
          {slugState === "available" && <span className="text-xs text-green-700">Available</span>}
          {slugState === "taken" && <span className="text-xs text-red-600">Already taken</span>}
        </label>
        <label className="block text-sm text-stone-700">
          Template package
          <select required className={inputClass} value={packageId} onChange={(e) => setPackageId(e.target.value)}>
            {packages.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || slugState === "taken" || !packageId}
          className="rounded-lg bg-amber-700 px-4 py-2 text-sm text-white hover:bg-amber-800 disabled:opacity-60"
        >
          {busy ? "Creating..." : "Create wedding"}
        </button>
      </form>
    </div>
  );
}
