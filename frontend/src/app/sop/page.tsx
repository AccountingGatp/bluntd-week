import { AppHeader } from "@/components/gusto/app-header";
import { SopGuide } from "@/components/sop/sop-guide";

export const metadata = {
  title: "SOP | Gusto",
  description: "How to run QBO Generation and Gusto Generation each pay week",
};

export default function SopPage() {
  return (
    <div className="min-h-full bg-[#f3f3f3]">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-6 py-8">
        <SopGuide />
      </main>
    </div>
  );
}
