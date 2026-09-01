import { AppHeader } from "@/components/gusto/app-header";
import { EmployeeList } from "@/components/gusto/employee-list";

export const metadata = {
  title: "Employees | Gusto",
  description: "Create, edit, and delete payroll employees",
};

export default function GustoPage() {
  return (
    <div className="min-h-full bg-[#f3f3f3]">
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        <EmployeeList />
      </main>
    </div>
  );
}
