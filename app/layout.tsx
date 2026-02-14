import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "ZEVO",
  description: "ZEVO sports arena discovery platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-zinc-900 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
