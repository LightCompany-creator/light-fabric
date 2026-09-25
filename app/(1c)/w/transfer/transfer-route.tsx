"use client";

// Документ передачи открывается по /w/transfer?id=..., список лежит на /w/transfers.
// Параметр вместо сегмента адреса нужен статической сборке, см. shift-route.tsx.

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TransferScreen } from "./transfer-screen";

export function TransferRoute() {
  const id = useSearchParams().get("id");
  if (!id) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Передача не указана.{" "}
        <Link href="/w/transfers" className="underline">
          К списку
        </Link>
      </p>
    );
  }
  return <TransferScreen transferId={id} />;
}
