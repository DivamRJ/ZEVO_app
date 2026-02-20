import type { ReactNode } from "react";

import { SiteFooter } from "@/components/zevo/site-footer";
import { SiteNav } from "@/components/zevo/site-nav";
import { ThemeToggle } from "@/components/zevo/theme-toggle";

type PageShellProps = {
  children: ReactNode;
  fullWidth?: boolean;
};

export function PageShell({ children, fullWidth = false }: PageShellProps) {
  return (
    <main className="min-h-screen px-4 pb-16 pt-4 text-zinc-100 sm:px-6 lg:px-8">
      <div className={`mx-auto w-full ${fullWidth ? "max-w-none" : "max-w-7xl"}`}>
        <SiteNav />
        {children}
        <SiteFooter />
      </div>
      <ThemeToggle />
    </main>
  );
}
