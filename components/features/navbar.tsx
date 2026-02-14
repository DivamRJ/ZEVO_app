"use client";

import { Home, MapPinned, PlusCircle, UserCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store/use-app-store";

const navItems = [
  { key: "home", label: "Home", icon: Home },
  { key: "map", label: "Map", icon: MapPinned },
  { key: "create", label: "Create", icon: PlusCircle },
  { key: "profile", label: "Profile", icon: UserCircle }
] as const;

export function Navbar() {
  const { activeView, setActiveView } = useAppStore();

  return (
    <nav className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[min(95%,440px)] rounded-2xl border border-zinc-700/70 bg-zinc-900/75 px-2 py-2 shadow-glass backdrop-blur-xl">
      <ul className="grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.key;
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => setActiveView(item.key)}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition",
                  isActive ? "bg-[#d9f99d] text-black" : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
