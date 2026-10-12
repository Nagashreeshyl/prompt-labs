import { Suspense } from "react";
import { AppLoading } from "@/components/app-loading";
import { AppShell } from "@/components/shell/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppLoading label="Checking session" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
