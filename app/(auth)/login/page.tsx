"use client";
import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/",
    });
    if (res?.error) setError(res.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="space-y-2">
          <label className="block text-sm" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-transparent"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-transparent"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-black text-white rounded px-3 py-2"
        >
          Sign in
        </button>
        <p className="text-sm text-center text-neutral-600">
          Or continue as{" "}
          <Link href="/" className="underline">
            guest
          </Link>
        </p>
      </form>
    </div>
  );
}
