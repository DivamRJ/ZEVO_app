import type { Metadata } from "next";

import { AppProviders } from "@/components/providers/app-providers";
import "@/app/globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "ZEVO",
  description: "ZEVO sports arena discovery platform",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-zinc-900 text-zinc-100 antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
