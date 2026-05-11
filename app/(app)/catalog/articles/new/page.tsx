import { PageHeader } from "@/components/shared/page-header";
import { ArticleForm } from "../article-form";

export default function NewArticlePage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Новый артикул"
        description="Создание карточки артикула в каталоге"
      />
      <ArticleForm mode="create" />
    </div>
  );
}
