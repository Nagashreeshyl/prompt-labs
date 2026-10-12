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

  useEffect(() => {
    if (authReady && user) router.replace("/home");
  }, [authReady, user, router]);

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

        <Button type="submit" variant="primary" size="lg" block loading={loading} disabled={!backend}>
          Create account
        </Button>
      </form>

      <p className="mt-5 text-[13px] text-ink-2">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium underline underline-offset-4 hover:opacity-70">
          Sign in
        </Link>
      </p>
    </div>
  );
}
