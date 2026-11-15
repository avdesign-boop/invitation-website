"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthButton, AuthCard, authInputClass } from "@/components/AuthCard";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("POST", "/api/business/login", { email, password });
      router.replace("/dashboard");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "something went wrong");
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Business login">
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm text-stone-700">
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={authInputClass} />
        </label>
        <label className="block text-sm text-stone-700">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <AuthButton busy={busy} label="Sign in" busyLabel="Signing in..." />
      </form>
      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="text-amber-700 hover:underline">
          Forgot password?
        </Link>
        <Link href="/signup" className="text-amber-700 hover:underline">
          Create an account
        </Link>
      </div>
    </AuthCard>
  );
}
