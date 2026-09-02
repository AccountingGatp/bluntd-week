"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  downloadXlsx,
  generateGustoLedgerFile,
  type GenerateResponse,
} from "@/lib/generate";
import { cn } from "@/lib/utils";

function formatMoney(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function GustoGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GenerateResponse | null>(null);

  function onFileChosen(next: File | undefined) {
    if (!next) {
      return;
    }
    setFile(next);
    setResult(null);
    setError("");
  }

  async function handleGenerate() {
    if (!file) {
      setError("Choose a Gusto Excel file first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const generated = await generateGustoLedgerFile(file);
      setResult(generated);
    } catch (generateError) {
      setResult(null);
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Could not complete the ledger",
      );
    } finally {
      setLoading(false);
    }
  }

  const totals = (result?.employees ?? []).reduce(
    (sum, employee) => ({
      regular: sum.regular + employee.regularWages,
      overtime: sum.overtime + employee.overtimeWages,
      tax: sum.tax + employee.employerTax,
      gross: sum.gross + employee.grossWages,
    }),
    { regular: 0, overtime: 0, tax: 0, gross: 0 },
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-800">
          Gusto Generation
        </h1>
        <p className="text-sm text-zinc-500">
          Upload a Gusto general ledger that has only the Basic and Detailed
          sheets. The API keeps those sheets and adds WC, HZ &amp; EL, and Paul.
          Nothing is saved on the server.{" "}
          <Link
            href="/sop"
            className="font-medium text-employee-name underline-offset-2 hover:underline"
          >
            How to use
          </Link>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gusto Excel</CardTitle>
          <CardDescription>
            Input: Basic + Detailed only. Output:{" "}
            <code className="font-mono text-foreground">
              general_ledger_republic-supply-company_YYYY-MM-DD.xlsx
            </code>{" "}
            with Basic, Detailed, WC, HZ &amp; EL, and Paul.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label
            className={cn(
              "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center transition-colors",
              dragging
                ? "border-employee-name bg-teal-50/60"
                : "border-zinc-300 bg-zinc-50 hover:bg-zinc-100",
            )}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              onFileChosen(event.dataTransfer.files[0]);
            }}
          >
            <Upload className="size-5 text-zinc-500" />
            <div className="text-sm font-medium text-zinc-800">
              Drop a Gusto .xlsx here or click to browse
            </div>
            <div className="text-xs text-zinc-500">
              {file ? file.name : "No file selected"}
            </div>
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(event) => onFileChosen(event.target.files?.[0])}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void handleGenerate()} disabled={loading || !file}>
              <FileSpreadsheet />
              {loading ? "Generating..." : "Generate full ledger"}
            </Button>
            {result ? (
              <Button
                variant="outline"
                onClick={() => downloadXlsx(result.filename, result.fileBase64)}
              >
                <Download />
                Download {result.filename}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not complete file</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {result ? (
        <section className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-4 py-3">
            <p className="text-sm font-semibold text-zinc-800">
              Ledger {result.period.start} to {result.period.end}
            </p>
            <p className="text-xs text-zinc-500">
              Check date {result.checkDate} · {result.filename} · sheets Basic,
              Detailed, WC, HZ &amp; EL, Paul
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Regular</TableHead>
                <TableHead className="text-right">Overtime</TableHead>
                <TableHead className="text-right">Employer tax</TableHead>
                <TableHead className="text-right">Gross</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.employees.map((employee) => (
                <TableRow key={employee.displayName}>
                  <TableCell>
                    <div className="font-semibold text-employee-name">
                      {employee.lastName}, {employee.firstName}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMoney(employee.regularWages)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMoney(employee.overtimeWages)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMoney(employee.employerTax)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMoney(employee.grossWages)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatMoney(totals.regular)}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatMoney(totals.overtime)}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatMoney(totals.tax)}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatMoney(totals.gross)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </section>
      ) : null}
    </div>
  );
}
