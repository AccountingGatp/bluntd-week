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
    title: "Confirm pay rates",
    body: (
      <>
        Open{" "}
        <Link href="/gusto" className="font-medium text-employee-name underline-offset-2 hover:underline">
          Employees
        </Link>{" "}
        and check that every hourly person who should be paid is listed with the
        correct first name, last name, and hourly rate. Monthly salary people
        are not included in the ledger.
      </>
    ),
  },
  {
    title: "Export the timesheet from QuickBooks Time",
    body: (
      <>
        Export the weekly timesheet as a CSV. Keep the default file name{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[13px]">
          timesheet_report_YYYY-MM-DD_thru_YYYY-MM-DD.csv
        </code>
        . The dates in the name become the pay period. The check date is the
        Friday after the period end.
      </>
    ),
  },
  {
    title: "Upload and generate",
    body: (
      <>
        Go to{" "}
        <Link
          href="/generation"
          className="font-medium text-employee-name underline-offset-2 hover:underline"
        >
          Generation
        </Link>
        , drop or browse the CSV, then click <strong>Generate ledger</strong>.
        The file stays in memory and is not saved on the server.
      </>
    ),
  },
  {
    title: "Review the preview, then download",
    body: (
      <>
        Confirm included employees, wages, and skipped rows. Click{" "}
        <strong>Download</strong> to save{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[13px]">
          general_ledger_republic-supply-company_YYYY-MM-DD.xlsx
        </code>
        .
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
            Each week, export hours from QuickBooks Time and generate the Gusto
            general ledger Excel file. The workbook matches the existing
            Republic Supply format: Basic, Detailed, WC, HZ &amp; EL, and Paul.
          </p>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700">
            timesheet_report_2026-08-10_thru_2026-08-16.csv
            <span className="mx-2 text-zinc-400">→</span>
            general_ledger_republic-supply-company_2026-08-21.xlsx
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to run the automation</CardTitle>
          <CardDescription>Follow these steps in order each pay week.</CardDescription>
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
          <CardTitle>Timesheet CSV requirements</CardTitle>
          <CardDescription>
            The upload must be a <code className="font-mono">.csv</code> file,
            10 MB or smaller.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-700">
          <p>These columns are required and must keep their QuickBooks Time names:</p>
          <div className="flex flex-wrap gap-1.5">
            {["fname", "lname", "local_date", "hours", "jobcode_1"].map((column) => (
              <Badge key={column} variant="secondary" className="font-mono">
                {column}
              </Badge>
            ))}
          </div>
          <ul className="list-disc space-y-1.5 pl-5 text-zinc-600">
            <li>
              Leave the file name as{" "}
              <code className="rounded bg-zinc-100 px-1 font-mono text-[13px]">
                timesheet_report_YYYY-MM-DD_thru_YYYY-MM-DD.csv
              </code>{" "}
              so the pay period is read from the name.
            </li>
            <li>
              Job codes that contain <strong>lunch</strong> are unpaid. Rest
              breaks and other time are paid.
            </li>
            <li>
              Employee names on the CSV must match the Employees directory.
              Partial last names are accepted (for example Genesis Lopez matches
              Genesis Lopez Pagoada).
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Who is paid</CardTitle>
          <CardDescription>
            Only hourly employees in the Gusto directory receive ledger lines.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-600">
          <p>
            The preview table lists everyone on the timesheet. Check the Status
            column before you download:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="text-zinc-800">included</strong> — hourly,
              found in Employees, and has a pay rate.
            </li>
            <li>
              <strong className="text-zinc-800">not in Gusto</strong> — on the
              timesheet but missing from Employees. Add them on Employees and
              generate again if they should be paid.
            </li>
            <li>
              <strong className="text-zinc-800">monthly salary</strong> — skipped
              on purpose (for example Cody Baldwin and Issa Madanat).
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
              <strong>Basic</strong> — company totals: regular wages, overtime,
              sick time off, employer taxes, net pay, checks, and garnishments.
            </li>
            <li>
              <strong>Detailed</strong> — the same ledger broken out by employee.
            </li>
            <li>
              <strong>WC</strong> — workers compensation by employee, plus Hazel
              sick time off.
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
          <CardTitle>How hours and pay are calculated</CardTitle>
          <CardDescription>
            California overtime rules and Gusto directory rates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-600">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Regular time is the first 8 paid hours in a day.</li>
            <li>Overtime is 1.5× after 8 hours, and after 40 regular hours in a week.</li>
            <li>Double overtime is 2× after 12 hours in a day.</li>
            <li>A 7th consecutive work day is overtime (first 8) then double overtime.</li>
            <li>Wages use the hourly rate on Employees. Overtime is 1.5× that rate.</li>
            <li>Employer Social Security is 6.2%. Employer Medicare is 1.45%.</li>
          </ul>
          <p>
            The ledger also applies recurring Gusto items that are not on the
            timesheet: Hazel sick time off ($113.25), Carlos child support
            ($93.75), and prior-period overpayment deductions for Genesis, Paul,
            and Hazel. Genesis, Paul, and Hazel are paid by check; everyone else
            is DebitNetPay.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>If something looks wrong</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-zinc-600">
            <li>
              <strong className="text-zinc-800">Missing columns</strong> — export
              again from QuickBooks Time. Do not rename{" "}
              <code className="font-mono text-[13px]">fname</code>,{" "}
              <code className="font-mono text-[13px]">lname</code>,{" "}
              <code className="font-mono text-[13px]">local_date</code>,{" "}
              <code className="font-mono text-[13px]">hours</code>, or{" "}
              <code className="font-mono text-[13px]">jobcode_1</code>.
            </li>
            <li>
              <strong className="text-zinc-800">Wrong check date</strong> —
              keep the standard timesheet file name so the period is read from
              it.
            </li>
            <li>
              <strong className="text-zinc-800">Someone skipped</strong> — add or
              correct their name and hourly rate on Employees, then generate
              again.
            </li>
            <li>
              <strong className="text-zinc-800">Wages look low or high</strong> —
              confirm the rate on Employees and that lunch rows were exported
              (they are unpaid).
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
