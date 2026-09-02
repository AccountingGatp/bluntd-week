import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STEPS = [
  {
    title: "Export Basic and Detailed from Gusto",
    body: (
      <>
        Download the weekly Republic Supply general ledger from Gusto. Keep only
        the Basic and Detailed sheets, or export a file that already has just
        those two sheets.
      </>
    ),
  },
  {
    title: "Upload on Gusto Generation",
    body: (
      <>
        Go to{" "}
        <Link
          href="/gusto-generation"
          className="font-medium text-employee-name underline-offset-2 hover:underline"
        >
          Gusto Generation
        </Link>
        , drop or browse the .xlsx file, then click{" "}
        <strong>Generate full ledger</strong>. Basic and Detailed stay as Gusto
        sent them. WC, HZ &amp; EL, and Paul are added.
      </>
    ),
  },
  {
    title: "Review the preview, then download",
    body: (
      <>
        Confirm wages from the Detailed sheet. Click <strong>Download</strong>{" "}
        to save{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[13px]">
          general_ledger_republic-supply-company_YYYY-MM-DD.xlsx
        </code>
        . The date is the check date from the Gusto file.
      </>
    ),
  },
];

export function SopGuide() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-800">
          SOP
        </h1>
        <p className="text-sm text-zinc-500">
          How to turn a QuickBooks Time timesheet into a Republic Supply Company
          general ledger.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purpose</CardTitle>
          <CardDescription>
            Weekly payroll automation for Republic Supply Company.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-700">
          <p>
            Each week, export the Gusto general ledger with only the{" "}
            <strong>Basic</strong> and <strong>Detailed</strong> sheets, then
            generate the full Republic Supply workbook: Basic, Detailed, WC, HZ
            &amp; EL, and Paul.
          </p>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700">
            Gusto Basic + Detailed.xlsx
            <span className="mx-2 text-zinc-400">→</span>
            general_ledger_republic-supply-company_2026-08-28.xlsx
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to run the automation</CardTitle>
          <CardDescription>
            Follow these steps in order each pay week on{" "}
            <Link
              href="/gusto-generation"
              className="font-medium text-employee-name underline-offset-2 hover:underline"
            >
              Gusto Generation
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-800">{step.title}</p>
                  <p className="text-sm leading-relaxed text-zinc-600">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Input file requirements</CardTitle>
          <CardDescription>
            The upload must be a Gusto <code className="font-mono">.xlsx</code>{" "}
            file, 10 MB or smaller.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-700">
          <p>These two sheets are required:</p>
          <div className="flex flex-wrap gap-1.5">
            {["Basic", "Detailed"].map((sheet) => (
              <Badge key={sheet} variant="secondary">
                {sheet}
              </Badge>
            ))}
          </div>
          <ul className="list-disc space-y-1.5 pl-5 text-zinc-600">
            <li>
              Detailed must list regular and overtime wages by person, for
              example <em>Regular Wages for Carlos Silva</em>.
            </li>
            <li>
              Sick time off on Detailed is folded into Hazel regular pay on HZ
              &amp; EL and into the WC sheet.
            </li>
            <li>
              The check date on Basic (row 4) becomes the output file name.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What the Excel file contains</CardTitle>
          <CardDescription>
            Open the downloaded workbook and confirm all five sheets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-zinc-700">
            <li>
              <strong>Basic</strong> and <strong>Detailed</strong> — copied from
              the Gusto upload, unchanged.
            </li>
            <li>
              <strong>WC</strong> — workers compensation by employee, plus sick
              time off from Detailed.
            </li>
            <li>
              <strong>HZ &amp; EL</strong> — Hazel and Elysia cost sheet. Hazel
              regular pay includes sick time off.
            </li>
            <li>
              <strong>Paul</strong> — Paul Bates cost sheet, including employee
              tax and the LXP / Bravura split.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>If something looks wrong</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-zinc-600">
            <li>
              <strong className="text-zinc-800">Missing sheets</strong> — the
              file must include worksheets named Basic and Detailed.
            </li>
            <li>
              <strong className="text-zinc-800">Wrong check date</strong> —
              confirm Basic cell A4 looks like{" "}
              <code className="font-mono text-[13px]">Check date: 2026-08-28</code>.
            </li>
            <li>
              <strong className="text-zinc-800">Someone missing on WC</strong> —
              their wage line on Detailed must be{" "}
              <code className="font-mono text-[13px]">Regular Wages for First Last</code>.
            </li>
            <li>
              <strong className="text-zinc-800">Generate fails</strong> — confirm
              the API is running and that{" "}
              <code className="font-mono text-[13px]">NEXT_PUBLIC_API_URL</code>{" "}
              points at it.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
