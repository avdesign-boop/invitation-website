"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthButton, AuthCard, authInputClass } from "@/components/AuthCard";
import { api } from "@/lib/api";

type LoginSettings = {
  signupEnabled: boolean;
  loginHint: { email: string; password: string } | null;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<LoginSettings>({ signupEnabled: true, loginHint: null });

  useEffect(() => {
    api<LoginSettings>("GET", "/api/config")
      .then(setSettings)
      .catch(() => undefined);
  }, []);

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

  const hint = settings.loginHint;

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
      {hint && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-stone-700">
          <p className="font-medium">Try this account</p>
          <p>{hint.email}</p>
          <p>{hint.password}</p>
          <button
            type="button"
            onClick={() => {
              setEmail(hint.email);
              setPassword(hint.password);
            }}
            className="mt-2 text-amber-700 hover:underline"
          >
            Fill in these details
          </button>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="text-amber-700 hover:underline">
          Forgot password?
        </Link>
        {settings.signupEnabled && (
          <Link href="/signup" className="text-amber-700 hover:underline">
            Create an account
          </Link>
        )}
      </div>
    </AuthCard>
  );
}
