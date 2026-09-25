import { Suspense } from "react";
import { ShiftRoute } from "./shift-route";

export const metadata = { title: "Смена" };

export default function ShiftPage() {
  return (
    <Suspense fallback={null}>
      <ShiftRoute />
    </Suspense>
  );
}
