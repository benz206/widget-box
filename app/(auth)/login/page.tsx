"use client";

import Link from "next/link";
import { useActionState } from "react";
import Button, { ButtonLink } from "@/app/components/ui/Button";
import Field from "@/app/components/ui/Field";
import Icon from "@/app/components/ui/Icon";
import { signInWithPassword } from "@/app/actions";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(signInWithPassword, null);

  return (
    <div className="onboarding">
      <header className="onboarding-bar material">
        <Link href="/" className="sidebar-brand focus-ring" aria-label="Widget Box home">
          <span className="brand-mark"><Icon name="grid" size={14} strokeWidth={2} /></span>
          <span>Widget Box</span>
        </Link>
        <ButtonLink href="/" variant="ghost" size="sm">
          Continue without an account
        </ButtonLink>
      </header>

      <main className="auth-main">
        <div className="card auth-card">
          <h1 className="step-title">Sign in</h1>
          <p className="step-description">
            Optional. Your dashboard works without an account.
          </p>

          <form action={formAction} className="mt-6 flex flex-col gap-4">
            <Field label="Email">
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                className="input input-lg"
                placeholder="you@example.com"
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                className="input input-lg"
              />
            </Field>

            {error && (
              <p role="alert" className="callout" data-tone="negative">
                <Icon name="alert" size={14} />
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" disabled={pending} className="mt-1 w-full">
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
