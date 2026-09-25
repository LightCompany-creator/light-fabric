"use client";

// Номер смены передаётся параметром (/w/shift?id=...), а не сегментом адреса:
// статическая сборка не знает номера документов заранее, а параметр ей не мешает.

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShiftScreen } from "./shift-screen";

export function ShiftRoute() {
  const id = useSearchParams().get("id");
  if (!id) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Смена не указана.{" "}
        <Link href="/w" className="underline">
          К рабочему месту
        </Link>
      </p>
    );
  }
  return <ShiftScreen shiftId={id} />;
}
