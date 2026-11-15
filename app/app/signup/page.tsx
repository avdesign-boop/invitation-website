"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthButton, AuthCard, authInputClass } from "@/components/AuthCard";
import { api } from "@/lib/api";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("POST", "/api/business/signup", { name, email });
      setSent(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "something went wrong");
    }
    setBusy(false);
  }

  if (sent) {
    return (
      <AuthCard title="Check your email">
        <p className="text-sm text-stone-600">
          We sent a link to <span className="font-medium">{email}</span>. Open it to set your password. The link works
          once and expires in 30 minutes.
        </p>
        <Link href="/login" className="block text-sm text-amber-700 hover:underline">
          Back to login
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create your account">
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm text-stone-700">
          Business name
          <input required value={name} onChange={(e) => setName(e.target.value)} className={authInputClass} />
        </label>
        <label className="block text-sm text-stone-700">
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={authInputClass} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <AuthButton busy={busy} label="Sign up" busyLabel="Sending..." />
      </form>
      <p className="text-sm text-stone-600">
        Already have an account?{" "}
        <Link href="/login" className="text-amber-700 hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
