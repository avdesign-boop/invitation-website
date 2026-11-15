import type { ReactNode } from "react";

export const authInputClass = "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2";

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-stone-900">{title}</h1>
        {children}
      </div>
    </main>
  );
}

export function AuthButton({ busy, label, busyLabel }: { busy: boolean; label: string; busyLabel: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full rounded-lg bg-amber-700 px-4 py-2 text-white hover:bg-amber-800 disabled:opacity-60"
    >
      {busy ? busyLabel : label}
    </button>
  );
}
