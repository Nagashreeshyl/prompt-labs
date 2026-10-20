"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { DotLogo } from "@/components/dots/dots";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import { friendlyError } from "@/lib/backend";
import { useStore } from "@/lib/store";

export function SignUpForm() {
  const router = useRouter();
  const { backend, user, authReady, toast } = useStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (authReady && user) router.replace("/home");
  }, [authReady, user, router]);

  async function onGoogle() {
    if (!backend) return;
    setGoogleLoading(true);
    setErrors({});
    try {
      await backend.signInWithGoogle();
      toast("Signed in");
      router.replace("/home");
    } catch (err) {
      setErrors({ form: friendlyError(err).message });
    } finally {
      setGoogleLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string | undefined> = {};
    if (!name.trim()) next.name = "Display name is required.";
    if (!email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    else if (password.length < 8) next.password = "Use at least 8 characters.";
    if (confirm !== password) next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).some((k) => next[k]) || !backend) return;

    setLoading(true);
    setErrors({});
    try {
      await backend.signUp(email, password, name);
      toast("Account created", { detail: "Your library starts empty — create your first prompt." });
      router.replace("/home");
    } catch (err) {
      setErrors({ form: friendlyError(err).message });
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

      <h1 className="font-display text-[26px] font-bold tracking-[-0.02em]">Create account</h1>
      <p className="mt-1.5 text-sm text-ink-2">Start with a private library. Publish only what you choose.</p>

      <form onSubmit={onSubmit} noValidate className="mt-7 space-y-4">
        <div>
          <Label htmlFor="name">Display name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" inputSize="lg" placeholder="Ada Lovelace" />
          <FieldError message={errors.name} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" inputSize="lg" placeholder="you@example.com" />
          <FieldError message={errors.email} />
        </div>
        <div>
          <Label htmlFor="password" hint="min 8 characters">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="new-password"
              inputSize="lg"
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-ink-2 hover:text-ink"
            >
              {showPassword ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
            </button>
          </div>
          <FieldError message={errors.password} />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
            autoComplete="new-password"
            inputSize="lg"
          />
          <FieldError message={errors.confirm} />
        </div>

        {errors.form ? (
          <div role="alert" className="flex items-start gap-2.5 border border-ink bg-surface px-3.5 py-3 text-[13px] leading-snug">
            <span aria-hidden className="mt-[5px] block h-[7px] w-[7px] shrink-0 bg-ink" />
            <span>{errors.form}</span>
          </div>
        ) : null}

        <Button type="submit" variant="primary" size="lg" block loading={loading} disabled={!backend || googleLoading}>
          Create account
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-2">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <Button
        type="button"
        variant="secondary"
        size="lg"
        block
        loading={googleLoading}
        disabled={!backend || loading}
        onClick={onGoogle}
        icon={<GoogleMark />}
      >
        Continue with Google
      </Button>

      <p className="mt-5 text-[13px] text-ink-2">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium underline underline-offset-4 hover:opacity-70">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden className="shrink-0" fill="currentColor">
      <path d="M12.24 10.4v3.36h4.66c-.2 1.2-.82 2.22-1.75 2.9l2.82 2.19c1.65-1.52 2.6-3.76 2.6-6.42 0-.62-.06-1.22-.16-1.8z" />
      <path d="M12.24 20c2.36 0 4.34-.78 5.79-2.11l-2.82-2.19c-.78.52-1.78.83-2.97.83-2.28 0-4.22-1.54-4.91-3.62l-2.91 2.24C5.86 17.98 8.78 20 12.24 20z" />
      <path d="M7.33 12.91c-.18-.52-.28-1.08-.28-1.66s.1-1.14.27-1.66L4.41 7.35C3.83 8.5 3.5 9.8 3.5 11.25s.33 2.75.91 3.9z" />
      <path d="M12.24 6.58c1.29 0 2.44.44 3.35 1.31l2.5-2.5C16.57 3.99 14.6 3.25 12.24 3.25c-3.46 0-6.38 2.02-7.83 4.96l2.91 2.24c.69-2.08 2.63-3.87 4.92-3.87z" />
    </svg>
  );
}
