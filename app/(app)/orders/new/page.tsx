import { PageHeader } from "@/components/shared/page-header";
import { CreateOrderForm } from "./create-form";

export default function NewOrderPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Новый заказ на производство"
        description="Заказ от коммерческого отдела — строки добавите на следующем шаге"
      />
      <CreateOrderForm today={new Date().toISOString().slice(0, 10)} />
    </div>
  );
}
