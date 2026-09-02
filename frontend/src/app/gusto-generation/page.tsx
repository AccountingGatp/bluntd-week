import { AppHeader } from "@/components/gusto/app-header";
import { GustoGenerator } from "@/components/generation/gusto-generator";

export const metadata = {
  title: "Gusto Generation | Gusto",
  description:
    "Upload a Gusto Basic and Detailed ledger and download the full five-sheet workbook",
};

export default function GustoGenerationPage() {
  return (
    <div className="min-h-full bg-[#f3f3f3]">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-6 py-8">
        <GustoGenerator />
      </main>
    </div>
  );
}
