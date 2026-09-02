import { AppHeader } from "@/components/gusto/app-header";
import { QboGenerator } from "@/components/generation/qbo-generator";

export const metadata = {
  title: "QBO Generation | Gusto",
  description: "Upload a timesheet CSV and download the weekly QBO workbook",
};

export default function QboGenerationPage() {
  return (
    <div className="min-h-full bg-[#f3f3f3]">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-6 py-8">
        <QboGenerator />
      </main>
    </div>
  );
}
