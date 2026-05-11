import { PageHeader } from "@/components/shared/page-header";
import { EmployeesImportForm, ArticlesImportForm } from "./import-form";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Импорт из 1С"
        description="Загрузка справочников из XLSX. Сначала «Проверить» — потом «Применить»."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EmployeesImportForm />
        <ArticlesImportForm />
      </div>
    </div>
  );
}
