import type { Metadata } from "next";
import "@/styles/tailwind.css";
import { Providers } from "@/components/Providers";
import { CustomCursor } from "@/components/CustomCursor";

export const metadata: Metadata = {
  title: "Luxury Villa Landing Page",
  description: "Rosella Retreat — Elevated Serenity Above the Doon Valley",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="font-['Montserrat'] bg-[var(--rr-bg)] text-[var(--rr-text)] min-h-screen">
            {children}
          </div>
          {/* Global custom cursor — rendered outside the page flow so z-9999 is unobstructed */}
          <CustomCursor />
        </Providers>
      </body>
    </html>
  );
}
