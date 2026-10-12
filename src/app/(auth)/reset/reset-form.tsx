"use client";

import Link from "next/link";
import { useState } from "react";
import { DotLogo } from "@/components/dots/dots";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import { friendlyError } from "@/lib/backend";
import { useStore } from "@/lib/store";

export function ResetForm() {
  const { backend } = useStore();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (!backend) return;
    setLoading(true);
    setError(undefined);
    try {
      await backend.sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(friendlyError(err).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="anim-fade-in">
      <div className="mb-8 flex items-center gap-2.5 lg:hidden">
        <DotLogo size={24} />
        <span className="font-display text-[15px] font-extrabold uppercase tracking-[0.06em]">Prompt Labs</span>
      </div>

      {sent ? (
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-[-0.02em]">Check your email</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            If an account exists for <span className="font-mono text-ink">{email}</span>, a password reset link is on its way.
            The link expires after a short time — request a new one if it does.
          </p>
          <Link
            href="/sign-in"
            className="mt-6 inline-flex h-9 items-center rounded-xs border border-ink px-3.5 text-sm font-medium hover:bg-surface"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <h1 className="font-display text-[26px] font-bold tracking-[-0.02em]">Reset password</h1>
          <p className="mt-1.5 text-sm text-ink-2">Enter your account email and we&rsquo;ll send a reset link.</p>
          <form onSubmit={onSubmit} noValidate className="mt-7 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} inputSize="lg" placeholder="you@example.com" autoComplete="email" />
              <FieldError message={error} />
            </div>
            <Button type="submit" variant="primary" size="lg" block loading={loading} disabled={!backend}>
              Send reset link
            </Button>
          </form>
          <p className="mt-5 text-[13px] text-ink-2">
            Remembered it?{" "}
            <Link href="/sign-in" className="font-medium underline underline-offset-4 hover:opacity-70">
              Sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
