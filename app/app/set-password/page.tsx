"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AuthButton, AuthCard, authInputClass } from "@/components/AuthCard";
import { api } from "@/lib/api";

const MIN_LENGTH = 8;

function SetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters`);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("POST", "/api/business/set-password", { token, password });
      setDone(true);
      setTimeout(() => router.replace("/login"), 1500);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "something went wrong");
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <AuthCard title="Link not valid">
        <p className="text-sm text-stone-600">This link is missing its token. Ask for a new one.</p>
        <Link href="/forgot-password" className="block text-sm text-amber-700 hover:underline">
          Send a new link
        </Link>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title="Password saved">
        <p className="text-sm text-stone-600">Taking you to the login page...</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set your password">
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm text-stone-700">
          New password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
        </label>
        <label className="block text-sm text-stone-700">
          Confirm password
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={authInputClass}
          />
        </label>
        {error && (
          <p className="text-sm text-red-600">
            {error}
            {error === "invalid or expired link" && (
              <>
                {" "}
                <Link href="/forgot-password" className="underline">
                  Send a new link
                </Link>
              </>
            )}
          </p>
        )}
        <AuthButton busy={busy} label="Save password" busyLabel="Saving..." />
      </form>
    </AuthCard>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordForm />
    </Suspense>
  );
}
