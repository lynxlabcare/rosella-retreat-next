"use client";

import { LenisProvider } from "@/components/context/LenisContext";
import { ThemeProvider } from "@/components/context/ThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LenisProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </LenisProvider>
  );
}
