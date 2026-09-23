import { TransferScreen } from "./transfer-screen";

export const metadata = { title: "Передача" };

export default function TransferPage({ params }: { params: { id: string } }) {
  return <TransferScreen transferId={params.id} />;
}
