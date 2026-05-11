import { PageHeader } from "@/components/shared/page-header";
import { MaterialForm } from "../material-form";

export default function NewMaterialPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Новый материал" description="Сырьё или вспомогательный материал" />
      <MaterialForm mode="create" />
    </div>
  );
}
