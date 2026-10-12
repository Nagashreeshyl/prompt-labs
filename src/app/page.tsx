"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLoading } from "@/components/app-loading";
import { useStore } from "@/lib/store";

export default function IndexPage() {
  const { user, authReady } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;
    router.replace(user ? "/home" : "/sign-in");
  }, [authReady, user, router]);

  return <AppLoading label="Opening Prompt Labs" />;
}
