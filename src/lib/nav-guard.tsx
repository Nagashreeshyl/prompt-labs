"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/ui/overlays";

type GuardFn = (proceed: () => void) => void;

interface NavGuardValue {
  /** Run an in-app navigation, consulting the active guard first. */
  guardedNav: (action: () => void) => void;
  /** The editor registers its unsaved-changes guard here. */
  setGuard: (fn: GuardFn | null) => void;
}

const NavGuardContext = createContext<NavGuardValue | null>(null);

export function NavGuardProvider({ children }: { children: ReactNode }) {
  const guardRef = useRef<GuardFn | null>(null);
  const [guardVersion, setGuardVersion] = useState(0);

  const setGuard = useCallback((fn: GuardFn | null) => {
    guardRef.current = fn;
    setGuardVersion((v) => v + 1);
  }, []);

  const guardedNav = useCallback((action: () => void) => {
    const guard = guardRef.current;
    if (guard) guard(action);
    else action();
  }, []);

  // Warn on tab close / reload while a guard is armed
  useEffect(() => {
    if (!guardRef.current) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [guardVersion]);

  return (
    <NavGuardContext.Provider value={{ guardedNav, setGuard }}>
      {children}
    </NavGuardContext.Provider>
  );
}

export function useNavGuard(): NavGuardValue {
  const ctx = useContext(NavGuardContext);
  if (!ctx) throw new Error("useNavGuard must be used inside NavGuardProvider");
  return ctx;
}

/** Declarative in-app link that respects the unsaved-changes guard. */
export function GuardedLink({
  href,
  children,
  className,
  onClick,
  ...rest
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const router = useRouter();
  const { guardedNav } = useNavGuard();
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onClick?.();
        guardedNav(() => router.push(href));
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

/** Arm a guard for the lifetime of `active`; the callback receives `proceed`. */
export function useLeaveGuard(active: boolean) {
  const { setGuard } = useNavGuard();
  const [pendingProceed, setPendingProceed] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!active) {
      setGuard(null);
      return;
    }
    setGuard((proceed) => setPendingProceed(() => proceed));
    return () => setGuard(null);
  }, [active, setGuard]);

  const dialog = pendingProceed ? (
    <ConfirmDialog
      open
      onClose={() => setPendingProceed(null)}
      onConfirm={() => {
        const p = pendingProceed;
        setPendingProceed(null);
        p();
      }}
      title="Discard unsaved changes?"
      description="This prompt has edits that have not been saved. If you leave now, those changes are lost."
      confirmLabel="Discard changes"
      cancelLabel="Keep editing"
    />
  ) : null;

  return { dialog };
}
