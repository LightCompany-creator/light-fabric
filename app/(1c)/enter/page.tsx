import { EnterForm } from "./enter-form";

export const metadata = { title: "Вход в LightFabric" };

export default function EnterPage() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
      <EnterForm />
    </div>
  );
}
