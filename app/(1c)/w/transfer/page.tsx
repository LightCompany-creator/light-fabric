import { Suspense } from "react";
import { TransferRoute } from "./transfer-route";

export const metadata = { title: "Передача" };

export default function TransferPage() {
  return (
    <Suspense fallback={null}>
      <TransferRoute />
    </Suspense>
  );
}
