import type { ReactNode } from "react";

import { SiteNav } from "@/components/zevo/site-nav";
import { ThemeToggle } from "@/components/zevo/theme-toggle";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen px-4 pb-16 pt-4 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <SiteNav />
        {children}
      </div>
      <ThemeToggle />
    </main>
  );
}
