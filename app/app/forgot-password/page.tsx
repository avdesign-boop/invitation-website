"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthButton, AuthCard, authInputClass } from "@/components/AuthCard";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("POST", "/api/business/forgot-password", { email });
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
          If an account exists for <span className="font-medium">{email}</span>, we sent a link to set a new password.
          The link works once and expires in 30 minutes.
        </p>
        <Link href="/login" className="block text-sm text-amber-700 hover:underline">
          Back to login
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot your password?">
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm text-stone-700">
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={authInputClass} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <AuthButton busy={busy} label="Send link" busyLabel="Sending..." />
      </form>
      <Link href="/login" className="block text-sm text-amber-700 hover:underline">
        Back to login
      </Link>
    </AuthCard>
  );
}
