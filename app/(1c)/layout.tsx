import type { ReactNode } from "react";
import { Api1CProvider } from "@/lib/api1c/provider";

// Раздел приложения, работающий напрямую с 1С (этап 1).
// Живёт рядом со старыми экранами, пока те не переведены на контракт.

export default function Layout1C({ children }: { children: ReactNode }) {
  return (
    <Api1CProvider>
      {/* lf-touch: все цели касания в цеховом разделе не ниже 44 px (правило в globals.css, Д-6). */}
      <div className="lf-touch min-h-screen bg-muted/30 px-4 py-6">{children}</div>
    </Api1CProvider>
  );
}
