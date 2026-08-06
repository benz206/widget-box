"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import Icon from "@/app/components/ui/Icon";

const inputClass =
  "focus-ring w-full rounded-control bg-fill px-3.5 py-2.5 text-[15px] outline-none placeholder:text-tertiary";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/",
    });
    setPending(false);
    if (result?.error) setError("That email and password did not match.");
    else window.location.href = result?.url ?? "/";
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span
            className="mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-[17px] text-white"
            style={{
              background: "linear-gradient(150deg, #0a84ff, #5e5ce6)",
              boxShadow: "0 10px 30px rgba(10,132,255,0.35)",
            }}
          >
            <Icon name="grid" size={28} strokeWidth={2} />
          </span>
          <h1 className="text-[26px] font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1.5 text-[14px] text-secondary">
            Widget Box works without an account — signing in is optional.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="material hairline flex flex-col gap-4 rounded-[20px] p-6"
          style={{ boxShadow: "var(--tile-shadow)" }}
        >
          {error && (
            <p
              className="rounded-control px-3.5 py-2.5 text-[13px]"
              style={{
                background: "color-mix(in srgb, var(--negative) 12%, transparent)",
                color: "var(--negative)",
              }}
            >
              {error}
            </p>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-secondary">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-secondary">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="press focus-ring mt-1 rounded-full py-2.5 text-[15px] font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-[13.5px] text-secondary">
          <Link href="/" className="focus-ring font-medium text-accent">
            Continue without an account
          </Link>
        </p>
      </div>
    </div>
  );
}
