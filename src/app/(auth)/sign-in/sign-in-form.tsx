"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { DotLogo } from "@/components/dots/dots";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import { friendlyError } from "@/lib/backend";
import { useStore } from "@/lib/store";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { backend, user, authReady, toast } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authReady && user) router.replace("/home");
  }, [authReady, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    setErrors(next);
    if (Object.keys(next).length > 0 || !backend) return;

    setLoading(true);
    setErrors({});
    try {
      await backend.signIn(email, password);
      toast("Signed in");
      const dest = searchParams.get("next");
      router.replace(dest && dest.startsWith("/") ? dest : "/home");
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

      <h1 className="font-display text-[26px] font-bold tracking-[-0.02em]">Sign in</h1>
      <p className="mt-1.5 text-sm text-ink-2">Your library of reusable prompts, one keystroke away.</p>

      <form onSubmit={onSubmit} noValidate className="mt-7 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder="you@example.com"
            inputSize="lg"
          />
          <FieldError id="email-err" message={errors.email} />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder="••••••••"
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
          <FieldError id="password-err" message={errors.password} />
        </div>

        {errors.form ? (
          <div role="alert" className="flex items-start gap-2.5 border border-ink bg-surface px-3.5 py-3 text-[13px] leading-snug">
            <span aria-hidden className="mt-[5px] block h-[7px] w-[7px] shrink-0 bg-ink" />
            <span>{errors.form}</span>
          </div>
        ) : null}

        <Button type="submit" variant="primary" size="lg" block loading={loading} disabled={!backend}>
          Sign in
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <Link href="/reset" className="underline underline-offset-4 hover:opacity-70">
          Forgot password?
        </Link>
        <span className="text-ink-2">
          No account?{" "}
          <Link href="/sign-up" className="font-medium underline underline-offset-4 hover:opacity-70">
            Create one
          </Link>
        </span>
      </div>
    </div>
  );
}

