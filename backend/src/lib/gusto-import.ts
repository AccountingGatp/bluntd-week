import ExcelJS from "exceljs";

import {
  addDerivedSheets,
  type LedgerEmployee,
  type LedgerResult,
} from "./ledger.js";

const DERIVED_SHEETS = new Set(["wc", "hz & el", "paul"]);
const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("text" in value && typeof value.text === "string") {
      return value.text;
    }
    if ("result" in value) {
      return cellText(value.result as ExcelJS.CellValue);
    }
    if ("formula" in value) {
      return "";
    }
  }
  return "";
}

function cellNumber(value: ExcelJS.CellValue): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value && typeof value === "object" && "result" in value) {
    return cellNumber(value.result as ExcelJS.CellValue);
  }
  return 0;
}

function splitName(displayName: string) {
  const parts = displayName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function emptyEmployee(displayName: string): LedgerEmployee {
  const { firstName, lastName } = splitName(displayName);
  return {
    firstName,
    lastName,
    displayName,
    regularHours: 0,
    overtimeHours: 0,
    doubleOvertimeHours: 0,
    regularWages: 0,
    overtimeWages: 0,
    doubleOvertimeWages: 0,
    employerSs: 0,
    employerMedicare: 0,
    employerTax: 0,
    grossWages: 0,
    sickWages: 0,
    rate: 0,
    skipped: false,
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parseCheckDate(text: string, filename?: string) {
  const iso = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso) {
    return iso[1];
  }
  const us = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (us) {
    return isoDate(Number(us[3]), Number(us[1]), Number(us[2]));
  }
  const fromName = filename?.match(
    /general_ledger_republic-supply-company_(\d{4}-\d{2}-\d{2})/i,
  );
  return fromName?.[1] ?? "";
}

function parsePeriod(text: string, year: number) {
  const match = text.match(
    /Payroll\s+([A-Za-z]{3})\s+(\d{1,2})\s*[–-]\s*([A-Za-z]{3})\s+(\d{1,2})/i,
  );
  if (!match) {
    return { start: "", end: "" };
  }
  const startMonth = MONTHS[match[1].toLowerCase()];
  const endMonth = MONTHS[match[3].toLowerCase()];
  if (!startMonth || !endMonth) {
    return { start: "", end: "" };
  }
  return {
    start: isoDate(year, startMonth, Number(match[2])),
    end: isoDate(year, endMonth, Number(match[4])),
  };
}

function findSheet(workbook: ExcelJS.Workbook, name: string) {
  const wanted = name.toLowerCase();
  return workbook.worksheets.find((sheet) => sheet.name.trim().toLowerCase() === wanted);
}

function parseDetailedEmployees(sheet: ExcelJS.Worksheet) {
  const byName = new Map<string, LedgerEmployee>();
  const order: string[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < 8) {
      return;
    }
    const type = cellText(row.getCell(1).value).trim();
    const description = cellText(row.getCell(2).value).trim();
    const amount = money(cellNumber(row.getCell(3).value));

    if (!type || type.toLowerCase() === "account type") {
      return;
    }
    if (
      /debit|check|garnishment|totals/i.test(type) ||
      /^totals$/i.test(description)
    ) {
      return;
    }

    const wageMatch = description.match(
      /^(Regular Wages|Overtime Wages|Double Overtime Wages|Sick Time Off) for (.+)$/i,
    );
    if (wageMatch) {
      const kind = wageMatch[1].toLowerCase();
      const displayName = wageMatch[2].trim();
      const key = displayName.toLowerCase();
      let employee = byName.get(key);
      if (!employee) {
        employee = emptyEmployee(displayName);
        byName.set(key, employee);
        order.push(key);
      }
      if (kind.startsWith("regular")) {
        employee.regularWages = money(employee.regularWages + amount);
      } else if (kind.startsWith("double")) {
        employee.doubleOvertimeWages = money(employee.doubleOvertimeWages + amount);
      } else if (kind.startsWith("overtime")) {
        employee.overtimeWages = money(employee.overtimeWages + amount);
      } else {
        employee.sickWages = money(employee.sickWages + amount);
      }
    }
  });

  const taxPairs: { ss: number; medicare: number }[] = [];
  let pendingSs: number | null = null;
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < 8) {
      return;
    }
    const type = cellText(row.getCell(1).value).trim();
    const description = cellText(row.getCell(2).value).trim();
    const amount = money(cellNumber(row.getCell(3).value));
    if (type !== "EmployerTax") {
      return;
    }
    if (/social security/i.test(description)) {
      pendingSs = amount;
      return;
    }
    if (/medicare/i.test(description) && pendingSs !== null) {
      taxPairs.push({ ss: pendingSs, medicare: amount });
      pendingSs = null;
    }
  });

  const employees = order.map((key, index) => {
    const employee = byName.get(key)!;
    const tax = taxPairs[index];
    if (tax) {
      employee.employerSs = tax.ss;
      employee.employerMedicare = tax.medicare;
      employee.employerTax = money(tax.ss + tax.medicare);
    }
    employee.grossWages = money(
      employee.regularWages +
        employee.overtimeWages +
        employee.doubleOvertimeWages +
        employee.sickWages,
    );
    return employee;
  });

  if (!employees.length) {
    throw new Error("No employee wage lines were found on the Detailed sheet.");
  }

  return employees;
}

export async function completeGustoLedger(
  file: Buffer,
  filename?: string,
): Promise<LedgerResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file);

  const basic = findSheet(workbook, "Basic");
  const detailed = findSheet(workbook, "Detailed");
  if (!basic || !detailed) {
    throw new Error("The Gusto file must include Basic and Detailed sheets.");
  }

  for (const sheet of [...workbook.worksheets]) {
    if (DERIVED_SHEETS.has(sheet.name.trim().toLowerCase())) {
      workbook.removeWorksheet(sheet.id);
    }
  }

  const checkDate = parseCheckDate(cellText(basic.getCell("A4").value), filename);
  const year = Number(checkDate.slice(0, 4)) || new Date().getFullYear();
  const period = parsePeriod(cellText(basic.getCell("A3").value), year);
  const employees = parseDetailedEmployees(detailed);

  addDerivedSheets(workbook, employees);

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    filename: checkDate
      ? `general_ledger_republic-supply-company_${checkDate}.xlsx`
      : "general_ledger_republic-supply-company.xlsx",
    checkDate,
    period: {
      start: period.start || checkDate,
      end: period.end || checkDate,
    },
    fileBase64: Buffer.from(buffer).toString("base64"),
    employees,
  };
}
