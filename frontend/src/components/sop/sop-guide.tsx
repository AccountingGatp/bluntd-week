import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const GUSTO_STEPS = [
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

const QBO_STEPS = [
  {
    title: "Export the timesheet CSV",
    body: (
      <>
        From QuickBooks Time, download{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[13px]">
          timesheet_report_YYYY-MM-DD_thru_YYYY-MM-DD.csv
        </code>
        .
      </>
    ),
  },
  {
    title: "Upload on QBO Generation",
    body: (
      <>
        Go to{" "}
        <Link
          href="/qbo-generation"
          className="font-medium text-employee-name underline-offset-2 hover:underline"
        >
          QBO Generation
        </Link>
        , drop or browse the CSV, then click{" "}
        <strong>Generate QBO workbook</strong>.
      </>
    ),
  },
  {
    title: "Review the preview, then download",
    body: (
      <>
        Confirm hours and pay, then download{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[13px]">
          Week MM.DD.YYYY to MM.DD.YYYY.xlsx
        </code>
        . The dates come from the CSV file name.
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
          Each pay week, run QBO Generation from the QuickBooks Time CSV, then
          Gusto Generation from Basic + Detailed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purpose</CardTitle>
          <CardDescription>
            Weekly payroll files for Republic Supply Company.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-700">
          <p>
            Use the two pages in the header. Do not use the old CSV Generation
            page.
          </p>
          <div className="space-y-2">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700">
              timesheet_report_2026-08-17_thru_2026-08-23.csv
              <span className="mx-2 text-zinc-400">→</span>
              Week 08.17.2026 to 08.23.2026.xlsx
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700">
              Gusto Basic + Detailed.xlsx
              <span className="mx-2 text-zinc-400">→</span>
              general_ledger_republic-supply-company_2026-08-28.xlsx
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>QBO Generation</CardTitle>
          <CardDescription>
            Follow these steps on{" "}
            <Link
              href="/qbo-generation"
              className="font-medium text-employee-name underline-offset-2 hover:underline"
            >
              QBO Generation
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-4">
            {QBO_STEPS.map((step, index) => (
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
          <div>
            <p className="mb-2 text-sm text-zinc-700">The workbook has five sheets:</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Summary",
                "Data",
                "Overtime Calculation",
                "RSC and REST",
                "Hourly Rates",
              ].map((sheet) => (
                <Badge key={sheet} variant="secondary">
                  {sheet}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gusto Generation</CardTitle>
          <CardDescription>
            Follow these steps on{" "}
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
            {GUSTO_STEPS.map((step, index) => (
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
            Each page accepts one file type, 10 MB or smaller.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-700">
          <div className="space-y-2">
            <p className="font-medium text-zinc-800">QBO Generation</p>
            <p>
              Upload a QuickBooks Time{" "}
              <code className="font-mono">.csv</code> named like{" "}
              <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[13px]">
                timesheet_report_YYYY-MM-DD_thru_YYYY-MM-DD.csv
              </code>
              .
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-zinc-600">
              <li>Lunch is unpaid. Rest breaks are paid.</li>
              <li>
                RSC punches go on RSC and REST. Gusto employees go on Overtime
                Calculation.
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-zinc-800">Gusto Generation</p>
            <p>
              Upload a Gusto <code className="font-mono">.xlsx</code> with these
              two sheets:
            </p>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What the Excel files contain</CardTitle>
          <CardDescription>
            Confirm sheets after each download.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-700">
          <div className="space-y-2">
            <p className="font-medium text-zinc-800">QBO week workbook</p>
            <ul className="space-y-2">
              <li>
                <strong>Summary</strong> — Gusto hours, RSC hours, hours by job,
                overtime hours, each with a Grand Total.
              </li>
              <li>
                <strong>Data</strong> — timesheet punches, pay rate, and total
                pay.
              </li>
              <li>
                <strong>Overtime Calculation</strong> — daily regular, overtime,
                and double hours for Gusto employees.
              </li>
              <li>
                <strong>RSC and REST</strong> — RSC and rest-break hours and pay.
              </li>
              <li>
                <strong>Hourly Rates</strong> — name and rate lookup used by the
                other sheets.
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-zinc-800">Gusto general ledger</p>
            <ul className="space-y-2">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>If something looks wrong</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-zinc-600">
            <li>
              <strong className="text-zinc-800">QBO file name is wrong</strong> —
              the CSV must be named{" "}
              <code className="font-mono text-[13px]">
                timesheet_report_YYYY-MM-DD_thru_YYYY-MM-DD.csv
              </code>
              .
            </li>
            <li>
              <strong className="text-zinc-800">Grand Total is blank</strong> —
              generate again from QBO Generation. Totals are written into the
              file.
            </li>
            <li>
              <strong className="text-zinc-800">Missing Gusto sheets</strong> —
              the upload must include worksheets named Basic and Detailed.
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
