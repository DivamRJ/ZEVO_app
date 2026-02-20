import Link from "next/link";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-100">ZEVO Platform</p>
          <p className="text-xs text-zinc-400">
            Copyright {currentYear} ZEVO. All rights reserved. Sports arena discovery and community platform.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link href="/about" className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-zinc-300 hover:border-zinc-500">
            Terms
          </Link>
          <Link href="/about" className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-zinc-300 hover:border-zinc-500">
            Privacy
          </Link>
          <Link href="/about" className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-zinc-300 hover:border-zinc-500">
            Help & Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
