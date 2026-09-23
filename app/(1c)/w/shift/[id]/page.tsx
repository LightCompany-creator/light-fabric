import { ShiftScreen } from "./shift-screen";

export const metadata = { title: "Смена" };

export default function ShiftPage({ params }: { params: { id: string } }) {
  return <ShiftScreen shiftId={params.id} />;
}
