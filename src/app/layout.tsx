import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { NavGuardProvider } from "@/lib/nav-guard";
import { TooltipProvider } from "@/components/ui/overlays";
import { Toaster } from "@/components/ui/toaster";

const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-schibsted",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-archivo",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Prompt Labs",
    template: "%s · Prompt Labs",
  },
  description: "Find the right prompt. Customize it. Reuse it. Share it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${schibsted.variable} ${archivo.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh bg-canvas text-ink antialiased">
        <StoreProvider>
          <NavGuardProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </NavGuardProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
