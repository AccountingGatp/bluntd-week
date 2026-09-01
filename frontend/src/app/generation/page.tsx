import { AppHeader } from "@/components/gusto/app-header";
import { CsvGenerator } from "@/components/generation/csv-generator";

export const metadata = {
  title: "Generation | Gusto",
  description: "Upload a timesheet CSV and download the general ledger Excel file",
};

export default function GenerationPage() {
  return (
    <div className="min-h-full bg-[#f3f3f3]">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-6 py-8">
        <CsvGenerator />
      </main>
    </div>
  );
}
