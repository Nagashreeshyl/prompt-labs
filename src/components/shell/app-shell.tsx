"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppLoading } from "@/components/app-loading";
import { CommandKeyCapture, MobileNav, MobileTopBar, Sidebar } from "@/components/shell/shell";
import { useStore } from "@/lib/store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, authReady } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authReady && !user) {
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
    }
  }, [authReady, user, pathname, router]);

  if (!authReady || !user) {
    return <AppLoading label="Checking session" />;
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <Sidebar />
      <MobileTopBar />
      <main className="lg:pl-[236px]">
        <div className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-6 sm:px-8 lg:pb-20 lg:pt-10">{children}</div>
      </main>
      <MobileNav />
      <CommandKeyCapture />
    </div>
  );
}
