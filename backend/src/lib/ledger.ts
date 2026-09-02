import ExcelJS from "exceljs";

import type { HoursRow } from "./timesheet.js";
import { namesMatch } from "./timesheet.js";
import type { EmployeeJSON } from "../models/employee.js";

const COMPANY = "Republic Supply Company";
const CURRENCY = '"$"#,##0.00_);("$"#,##0.00)';
const ACCOUNTING = '_("$"* #,##0.00_);_("$"* (#,##0.00);_("$"* "-"??_);_(@_)';
const HEADER_FILL = "DFDEDF";
const TOTAL_PAY_FILL = "FFFF00";
const SS_RATE = 0.062;
const MEDICARE_RATE = 0.0145;
const SDI_RATE = 0.013;
const DEFAULT_WC_RATE = 0.041133;
const CARLOS_WC_RATE = 0.004996;
const ELYSIA_WC_RATE = 0.00244;
const JOEY_WC_RATE = 0.002286;
const LEDGER_ORDER = [
  "carlos silva",
  "paola sanchez",
  "genesis lopez pagoada",
  "paul bates",
  "hazel herrera",
  "sylvia lopez",
];
const CHECK_PAY_EMPLOYEES = [
  "genesis lopez pagoada",
  "paul bates",
  "hazel herrera",
];
const CHILD_SUPPORT = {
  key: "carlos silva",
  amount: 93.75,
  description:
    "Garnishment Liability for Child support - 200000000885099 (Carlos Silva)",
};
const PRIOR_OVERPAYMENTS = [
  { key: "genesis lopez pagoada", amount: 4.46 },
  { key: "paul bates", amount: 15.4 },
  { key: "hazel herrera", amount: 30.16 },
] as const;
const HAZEL_SICK_TIME_OFF = 113.25;

export type LedgerEmployee = {
  firstName: string;
  lastName: string;
  displayName: string;
  regularHours: number;
  overtimeHours: number;
  doubleOvertimeHours: number;
  regularWages: number;
  overtimeWages: number;
  doubleOvertimeWages: number;
  employerSs: number;
  employerMedicare: number;
  employerTax: number;
  grossWages: number;
  sickWages: number;
  rate: number;
  skipped: boolean;
  skipReason?: string;
};

export type LedgerResult = {
  filename: string;
  checkDate: string;
  period: { start: string; end: string };
  fileBase64: string;
  employees: LedgerEmployee[];
};

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function employerFica(gross: number) {
  return {
    ss: money(gross * SS_RATE),
    medicare: money(gross * MEDICARE_RATE),
  };
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(iso: string) {
  return parseIsoDate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function nextFridayAfter(iso: string) {
  const date = parseIsoDate(iso);
  const add = ((5 - date.getDay() + 7) % 7) || 7;
  date.setDate(date.getDate() + add);
  return formatIsoDate(date);
}

function wcRateFor(displayName: string) {
  const key = displayName.toLowerCase();
  if (key.includes("carlos silva")) {
    return CARLOS_WC_RATE;
  }
  if (key.includes("elysia castro")) {
    return ELYSIA_WC_RATE;
  }
  return DEFAULT_WC_RATE;
}

function sortLedgerEmployees(employees: LedgerEmployee[]) {
  return [...employees].sort((left, right) => {
    const leftIndex = LEDGER_ORDER.indexOf(left.displayName.toLowerCase());
    const rightIndex = LEDGER_ORDER.indexOf(right.displayName.toLowerCase());
    if (leftIndex === -1 && rightIndex === -1) {
      const last = left.lastName.localeCompare(right.lastName);
      return last !== 0 ? last : left.firstName.localeCompare(right.firstName);
    }
    if (leftIndex === -1) {
      return 1;
    }
    if (rightIndex === -1) {
      return -1;
    }
    return leftIndex - rightIndex;
  });
}

function priorPayrollLabel(checkDate: string) {
  const date = parseIsoDate(checkDate);
  date.setDate(date.getDate() - 7);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}`;
}

function paidByKey(paid: LedgerEmployee[], key: string) {
  return paid.find((employee) => employee.displayName.toLowerCase().includes(key));
}

function isCheckPay(employee: LedgerEmployee) {
  const key = employee.displayName.toLowerCase();
  return CHECK_PAY_EMPLOYEES.some((name) => key.includes(name));
}

type CreditLine = {
  type: string;
  description: string;
  amount: number;
};

function buildPayrollCredits(
  paid: LedgerEmployee[],
  checkDate: string,
  debitTotal: number,
): CreditLine[] {
  const prior = priorPayrollLabel(checkDate);
  const garnishmentByName = new Map<string, number>();
  const garnishments: CreditLine[] = [];

  const carlos = paidByKey(paid, CHILD_SUPPORT.key);
  if (carlos) {
    garnishments.push({
      type: "Garnishment",
      description: CHILD_SUPPORT.description,
      amount: CHILD_SUPPORT.amount,
    });
    garnishmentByName.set(carlos.displayName, CHILD_SUPPORT.amount);
  }

  for (const item of PRIOR_OVERPAYMENTS) {
    const employee = paidByKey(paid, item.key);
    if (!employee) {
      continue;
    }
    garnishments.push({
      type: "Garnishment",
      description: `Deduction Liability for Prior period overpayment correction – ${prior} payroll (${employee.displayName})`,
      amount: item.amount,
    });
    garnishmentByName.set(
      employee.displayName,
      money((garnishmentByName.get(employee.displayName) ?? 0) + item.amount),
    );
  }

  const checks: CreditLine[] = [];
  let debitNetPay = 0;
  for (const employee of paid) {
    const garnished = garnishmentByName.get(employee.displayName) ?? 0;
    const net = money(
      Math.max(employee.grossWages - employee.employerTax - garnished, 0),
    );
    if (isCheckPay(employee)) {
      checks.push({
        type: "EmployeePaymentCheck",
        description: `Check for ${employee.displayName}`,
        amount: net,
      });
    } else {
      debitNetPay = money(debitNetPay + net);
    }
  }

  checks.sort((left, right) => {
    const leftIndex = CHECK_PAY_EMPLOYEES.findIndex((key) =>
      left.description.toLowerCase().includes(key),
    );
    const rightIndex = CHECK_PAY_EMPLOYEES.findIndex((key) =>
      right.description.toLowerCase().includes(key),
    );
    return leftIndex - rightIndex;
  });

  const lines: CreditLine[] = [
    {
      type: "DebitNetPay",
      description: "Debit net pay",
      amount: money(debitNetPay),
    },
    {
      type: "DebitTax",
      description: "Debit tax",
      amount: money(paid.reduce((sum, employee) => sum + employee.employerTax * 2, 0)),
    },
    ...checks,
    ...garnishments,
  ];

  const creditTotal = money(lines.reduce((sum, line) => sum + line.amount, 0));
  const drift = money(debitTotal - creditTotal);
  if (drift !== 0 && lines[0]) {
    lines[0].amount = money(lines[0].amount + drift);
  }

  return lines;
}

function writeCredits(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  credits: CreditLine[],
) {
  let row = startRow;
  for (const line of credits) {
    writeLine(sheet, row, line.type, line.description, null, line.amount);
    row += 1;
  }
  return row;
}

function columnLetter(col: number) {
  let letter = "";
  let value = col;
  while (value > 0) {
    const rem = (value - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    value = Math.floor((value - 1) / 26);
  }
  return letter;
}

function formulaCell(
  sheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  formula: string,
  options?: { money?: boolean; accounting?: boolean; result?: number },
) {
  const cell = sheet.getCell(row, col);
  cell.value =
    options?.result === undefined
      ? { formula }
      : { formula, result: options.result };
  cell.font = { name: "Arial", size: 11 };
  if (options?.accounting) {
    cell.numFmt = ACCOUNTING;
  } else if (options?.money) {
    cell.numFmt = CURRENCY;
  }
}

function fillYellow(sheet: ExcelJS.Worksheet, row: number, cols: number[]) {
  for (const col of cols) {
    sheet.getCell(row, col).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${TOTAL_PAY_FILL}` },
    };
  }
}

function applyHeaderRow(row: ExcelJS.Row, values: (string | number | null)[]) {
  values.forEach((value, index) => {
    const cell = row.getCell(index + 1);
    cell.value = value;
    cell.font = { name: "Arial", size: 11, bold: true };
    cell.alignment = { horizontal: "center" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${HEADER_FILL}` },
    };
  });
}

function titleCell(sheet: ExcelJS.Worksheet, cell: string, value: string) {
  sheet.getCell(cell).value = value;
  sheet.getCell(cell).font = { name: "Arial", size: 11, bold: true };
  sheet.getCell(cell).alignment = { horizontal: "center" };
}

function textCell(
  sheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  value: string | number | null,
  options?: { bold?: boolean; money?: boolean },
) {
  const cell = sheet.getCell(row, col);
  cell.value = value;
  cell.font = { name: "Arial", size: 11, bold: options?.bold ?? false };
  if (options?.money && typeof value === "number") {
    cell.numFmt = CURRENCY;
  }
}

function setLedgerColumns(sheet: ExcelJS.Worksheet) {
  sheet.getColumn(1).width = 74.25;
  sheet.getColumn(2).width = 112.25;
  sheet.getColumn(3).width = 16.5;
  sheet.getColumn(4).width = 16.5;
  sheet.pageSetup.orientation = "landscape";
}

function writeLedgerHeader(
  sheet: ExcelJS.Worksheet,
  period: { start: string; end: string },
  checkDate: string,
) {
  titleCell(sheet, "A2", COMPANY);
  titleCell(
    sheet,
    "A3",
    `Ledger for Regular Payroll ${formatShortDate(period.start)} – ${formatShortDate(period.end)}`,
  );
  titleCell(sheet, "A4", `Check date: ${checkDate}`);
  applyHeaderRow(sheet.getRow(7), [
    "Account Type",
    "Account Description",
    "Debit",
    "Credit",
  ]);
}

function writeLine(
  sheet: ExcelJS.Worksheet,
  row: number,
  type: string,
  description: string,
  debit: number | null,
  credit: number | null,
) {
  textCell(sheet, row, 1, type);
  textCell(sheet, row, 2, description);
  if (debit !== null) {
    textCell(sheet, row, 3, debit, { money: true });
  }
  if (credit !== null) {
    textCell(sheet, row, 4, credit, { money: true });
  }
}

function buildEmployees(
  hours: HoursRow[],
  directory: EmployeeJSON[],
): LedgerEmployee[] {
  return hours.map((row) => {
    const match = directory.find((person) => namesMatch(person, row));
    if (!match) {
      return {
        firstName: row.firstName,
        lastName: row.lastName,
        displayName: `${row.firstName} ${row.lastName}`,
        regularHours: row.regularHours,
        overtimeHours: row.overtimeHours,
        doubleOvertimeHours: row.doubleOvertimeHours,
        regularWages: 0,
        overtimeWages: 0,
        doubleOvertimeWages: 0,
        employerSs: 0,
        employerMedicare: 0,
        employerTax: 0,
        grossWages: 0,
        sickWages: 0,
        rate: 0,
        skipped: true,
        skipReason: "not in Gusto",
      };
    }

    if (match.frequency !== "hourly") {
      return {
        firstName: match.firstName,
        lastName: match.lastName,
        displayName: `${match.firstName} ${match.lastName}`,
        regularHours: row.regularHours,
        overtimeHours: row.overtimeHours,
        doubleOvertimeHours: row.doubleOvertimeHours,
        regularWages: 0,
        overtimeWages: 0,
        doubleOvertimeWages: 0,
        employerSs: 0,
        employerMedicare: 0,
        employerTax: 0,
        grossWages: 0,
        sickWages: 0,
        rate: match.rate,
        skipped: true,
        skipReason: "monthly salary",
      };
    }

    const regularWages = money(row.regularHours * match.rate);
    const overtimeWages = money(row.overtimeHours * match.rate * 1.5);
    const doubleOvertimeWages = money(row.doubleOvertimeHours * match.rate * 2);
    const grossWages = money(regularWages + overtimeWages + doubleOvertimeWages);
    const employerSs = money(grossWages * SS_RATE);
    const employerMedicare = money(grossWages * MEDICARE_RATE);

    return {
      firstName: match.firstName,
      lastName: match.lastName,
      displayName: `${match.firstName} ${match.lastName}`,
      regularHours: row.regularHours,
      overtimeHours: row.overtimeHours,
      doubleOvertimeHours: row.doubleOvertimeHours,
      regularWages,
      overtimeWages,
      doubleOvertimeWages,
      employerSs,
      employerMedicare,
      employerTax: money(employerSs + employerMedicare),
      grossWages,
      sickWages: 0,
      rate: match.rate,
      skipped: false,
    };
  });
}

function taxFromPaycheck(employee: LedgerEmployee | undefined, gross: number) {
  const recomputed = employerFica(gross);
  const storedSs = employee?.employerSs ?? 0;
  const storedMedicare = employee?.employerMedicare ?? 0;
  const storedTotal = money(storedSs + storedMedicare);
  const recomputedTotal = money(recomputed.ss + recomputed.medicare);
  if (storedTotal >= recomputedTotal && storedTotal > 0) {
    return { ss: storedSs, medicare: storedMedicare };
  }
  return recomputed;
}

function writePersonCostBlock(
  sheet: ExcelJS.Worksheet,
  col: number,
  options: {
    regularLabel: string;
    otLabel: string;
    regular: number;
    overtime: number;
    wcRate: number;
    wcNote?: string;
    employerSs: number;
    employerMedicare: number;
    serviceFee: boolean;
    splits: boolean;
  },
) {
  const amountCol = col + 1;
  const noteCol = col + 2;
  const amountLetter = columnLetter(amountCol);
  const exempt = options.overtime / 3;
  const otAfter = options.overtime - exempt;
  const totalHours = options.regular + otAfter;
  const wc = totalHours * options.wcRate;
  const employerTax = options.employerSs + options.employerMedicare;
  const totalCost = totalHours + wc + employerTax;
  const wages = options.regular + options.overtime;
  const feeOnCost = totalCost * 0.1;
  const invoiceSubtotal = wages + employerTax + wc;

  textCell(sheet, 1, col, options.regularLabel);
  textCell(sheet, 1, amountCol, options.regular, { money: true });
  textCell(sheet, 2, col, options.otLabel);
  textCell(sheet, 2, amountCol, options.overtime, { money: true });
  textCell(sheet, 3, col, col === 1 ? "WC Rate" : "Wc rate");
  sheet.getCell(3, amountCol).value = options.wcRate;
  if (options.wcNote) {
    textCell(sheet, 3, noteCol, options.wcNote);
  }
  textCell(sheet, 4, col, col === 1 ? "1/3% WC Exempt" : "1/3% of Wc exempt");
  formulaCell(sheet, 4, amountCol, `${amountLetter}2*1/3`, {
    money: true,
    result: exempt,
  });
  textCell(sheet, 5, col, col === 1 ? "OT After Exemption" : "Overtime after exemption");
  formulaCell(sheet, 5, amountCol, `${amountLetter}2-${amountLetter}4`, {
    money: true,
    result: otAfter,
  });
  textCell(sheet, 6, col, "Total Hours");
  formulaCell(sheet, 6, amountCol, `${amountLetter}1+${amountLetter}5`, {
    money: true,
    result: totalHours,
  });
  textCell(sheet, 7, col, "WC");
  formulaCell(sheet, 7, amountCol, `${amountLetter}6*${amountLetter}3`, {
    money: true,
    result: wc,
  });
  textCell(sheet, 8, col, "Employer's tax Part");
  formulaCell(
    sheet,
    8,
    amountCol,
    `${options.employerSs}+${options.employerMedicare}`,
    { money: true, result: employerTax },
  );
  textCell(sheet, 8, noteCol, "From paycheck");
  textCell(sheet, 9, col, "Total Cost");
  formulaCell(
    sheet,
    9,
    amountCol,
    `${amountLetter}6+${amountLetter}7+${amountLetter}8`,
    { money: true, result: totalCost },
  );
  if (options.serviceFee || col !== 1) {
    textCell(sheet, 10, col, col === 1 ? "10%service fee" : "10% Service Charge");
    formulaCell(sheet, 10, amountCol, `${amountLetter}9*10%`, {
      money: true,
      result: feeOnCost,
    });
  }

  textCell(sheet, 13, col, "RSC Invoice (LXP  Enterprises LLC)", { bold: true });
  if (options.splits) {
    textCell(sheet, 13, amountCol, "Total Amount", { bold: true });
    textCell(sheet, 13, amountCol + 1, "LXP - 35%", { bold: true });
    textCell(sheet, 13, amountCol + 2, "Bravura - 35%", { bold: true });
  }

  textCell(sheet, 14, col, "Wages");
  formulaCell(sheet, 14, amountCol, `${amountLetter}1+${amountLetter}2`, {
    money: true,
    result: wages,
  });
  textCell(sheet, 15, col, "Employer Tax");
  formulaCell(sheet, 15, amountCol, `${amountLetter}8`, {
    money: true,
    result: employerTax,
  });
  textCell(sheet, 16, col, "WC");
  formulaCell(sheet, 16, amountCol, `${amountLetter}7`, {
    money: true,
    result: wc,
  });

  if (options.splits) {
    textCell(sheet, 17, col, "Total");
    formulaCell(sheet, 17, amountCol, `SUM(${amountLetter}14:${amountLetter}16)`, {
      money: true,
      result: invoiceSubtotal,
    });
    textCell(sheet, 18, col, "Fee");
    formulaCell(sheet, 18, amountCol, `${amountLetter}17*10%`, {
      money: true,
      result: invoiceSubtotal * 0.1,
    });
    textCell(sheet, 19, col, "Total Pay");
    formulaCell(sheet, 19, amountCol, `${amountLetter}17+${amountLetter}18`, {
      money: true,
      result: invoiceSubtotal * 1.1,
    });
    const sdi = money(wages * SDI_RATE);
    const employeeTax = money(
      options.employerSs + options.employerMedicare + sdi,
    );
    textCell(sheet, 20, col, "Employee tax");
    formulaCell(
      sheet,
      20,
      amountCol,
      `${options.employerSs}+${options.employerMedicare}+${sdi}`,
      { accounting: true, result: employeeTax },
    );
    fillYellow(sheet, 19, [col, amountCol, amountCol + 1, amountCol + 2]);
    for (const row of [14, 15, 16, 17, 18, 19, 20]) {
      const base =
        row === 14
          ? wages
          : row === 15
            ? employerTax
            : row === 16
              ? wc
              : row === 17
                ? invoiceSubtotal
                : row === 18
                  ? invoiceSubtotal * 0.1
                  : row === 19
                    ? invoiceSubtotal * 1.1
                    : employeeTax;
      formulaCell(sheet, row, amountCol + 1, `${amountLetter}${row}*0.35`, {
        money: row !== 20,
        accounting: row === 20,
        result: base * 0.35,
      });
      formulaCell(sheet, row, amountCol + 2, `${amountLetter}${row}*0.35`, {
        money: row !== 20,
        accounting: row === 20,
        result: base * 0.35,
      });
    }
    sheet.getColumn(amountCol + 1).width = 18;
    sheet.getColumn(amountCol + 2).width = 18;
  } else {
    const fee = options.serviceFee || col !== 1 ? feeOnCost : 0;
    textCell(sheet, 17, col, "Fee");
    formulaCell(sheet, 17, amountCol, `${amountLetter}10`, {
      money: true,
      result: fee,
    });
    textCell(sheet, 18, col, "Total");
    formulaCell(sheet, 18, amountCol, `SUM(${amountLetter}14:${amountLetter}17)`, {
      money: true,
      result: wages + employerTax + wc + fee,
    });
  }

  sheet.getColumn(col).width = 40;
  sheet.getColumn(amountCol).width = 18;
  sheet.getColumn(noteCol).width = 28;
}

export function addDerivedSheets(
  workbook: ExcelJS.Workbook,
  paid: LedgerEmployee[],
) {
  const wc = workbook.addWorksheet("WC");
  wc.getColumn(1).width = 22;
  wc.getColumn(2).width = 48;
  wc.getColumn(3).width = 14;
  applyHeaderRow(wc.getRow(1), [
    "Account Type",
    "Account Description",
    "Debit",
    null,
    "Code",
    "Regular Pay",
    "Overtime",
    "2/3 OT for WC",
    "Total pay",
    "Pay for ",
    "WC Rate",
  ]);
  const wcClasses = [
    { code: 4611, label: "Other than below mentioned", rate: DEFAULT_WC_RATE, regular: [] as string[], overtime: [] as string[] },
    { code: 8810, label: "Carlos + Ryan", rate: CARLOS_WC_RATE, regular: [] as string[], overtime: [] as string[] },
    { code: 8871, label: "Meaghan+Elysia", rate: ELYSIA_WC_RATE, regular: [] as string[], overtime: [] as string[] },
    { code: 8742, label: "Joey", rate: JOEY_WC_RATE, regular: [] as string[], overtime: [] as string[] },
  ];
  let wcRow = 2;
  for (const employee of paid) {
    const key = employee.displayName.toLowerCase();
    const bucket = key.includes("carlos silva")
      ? wcClasses[1]
      : key.includes("elysia castro")
        ? wcClasses[2]
        : wcClasses[0];
    writeLine(
      wc,
      wcRow,
      "RegularWages",
      `Regular Wages for ${employee.displayName}`,
      employee.regularWages,
      null,
    );
    bucket.regular.push(`C${wcRow}`);
    wcRow += 1;
    if (employee.overtimeWages > 0 || employee.doubleOvertimeWages > 0) {
      writeLine(
        wc,
        wcRow,
        "OvertimeWages",
        `Overtime Wages for ${employee.displayName}`,
        money(employee.overtimeWages + employee.doubleOvertimeWages),
        null,
      );
      bucket.overtime.push(`C${wcRow}`);
      wcRow += 1;
    }
  }
  for (const employee of paid) {
    if (employee.sickWages <= 0) {
      continue;
    }
    writeLine(
      wc,
      wcRow,
      "SickTimeOff",
      `Sick Time Off for ${employee.displayName}`,
      employee.sickWages,
      null,
    );
    const key = employee.displayName.toLowerCase();
    const bucket = key.includes("carlos silva")
      ? wcClasses[1]
      : key.includes("elysia castro")
        ? wcClasses[2]
        : wcClasses[0];
    bucket.regular.push(`C${wcRow}`);
    wcRow += 1;
  }
  wcClasses.forEach((row, index) => {
    const excelRow = 2 + index;
    textCell(wc, excelRow, 5, row.code);
    textCell(wc, excelRow, 10, row.label);
    wc.getCell(excelRow, 11).value = row.rate;
    formulaCell(wc, excelRow, 6, row.regular.join("+") || "0", { money: true });
    formulaCell(wc, excelRow, 7, row.overtime.join("+") || "0", { money: true });
    formulaCell(wc, excelRow, 8, `G${excelRow}*2/3`, { money: true });
    formulaCell(wc, excelRow, 9, `F${excelRow}+H${excelRow}`, { money: true });
  });

  const hazel = paid.find((employee) => employee.displayName.toLowerCase().includes("hazel herrera"));
  const elysia = paid.find((employee) =>
    employee.displayName.toLowerCase().includes("elysia castro"),
  );
  const paul = paid.find((employee) => employee.displayName.toLowerCase().includes("paul bates"));

  const hz = workbook.addWorksheet("HZ & EL");
  const hazelRegular = money((hazel?.regularWages ?? 0) + (hazel?.sickWages ?? 0));
  const hazelOvertime = money((hazel?.overtimeWages ?? 0) + (hazel?.doubleOvertimeWages ?? 0));
  const hazelTax = taxFromPaycheck(
    hazel,
    money(hazelRegular + hazelOvertime),
  );
  writePersonCostBlock(hz, 1, {
    regularLabel: "Hazel Regualr wages",
    otLabel: "OT",
    regular: hazelRegular,
    overtime: hazelOvertime,
    wcRate: wcRateFor("Hazel Herrera"),
    wcNote: "As per Smartpay code 4611",
    employerSs: hazelTax.ss,
    employerMedicare: hazelTax.medicare,
    serviceFee: false,
    splits: false,
  });
  const elysiaRegular = elysia?.regularWages ?? 0;
  const elysiaOvertime = money((elysia?.overtimeWages ?? 0) + (elysia?.doubleOvertimeWages ?? 0));
  const elysiaTax = taxFromPaycheck(elysia, money(elysiaRegular + elysiaOvertime));
  writePersonCostBlock(hz, 5, {
    regularLabel: "Regular Wages for Elysia Castro",
    otLabel: "Overtime Wages for Elysia Castro",
    regular: elysiaRegular,
    overtime: elysiaOvertime,
    wcRate: wcRateFor("Elysia Castro"),
    wcNote: "As per Righsum code 8871",
    employerSs: elysiaTax.ss,
    employerMedicare: elysiaTax.medicare,
    serviceFee: false,
    splits: false,
  });

  const paulSheet = workbook.addWorksheet("Paul");
  writePersonCostBlock(paulSheet, 1, {
    regularLabel: "Paul Regualr wages",
    otLabel: "OT wage",
    regular: paul?.regularWages ?? 0,
    overtime: money((paul?.overtimeWages ?? 0) + (paul?.doubleOvertimeWages ?? 0)),
    wcRate: wcRateFor("Paul Bates"),
    employerSs: paul?.employerSs ?? 0,
    employerMedicare: paul?.employerMedicare ?? 0,
    serviceFee: true,
    splits: true,
  });
  textCell(paulSheet, 22, 1, "*New Calculation");
}

export async function buildGeneralLedger(options: {
  hours: HoursRow[];
  directory: EmployeeJSON[];
  period: { start: string; end: string };
}): Promise<LedgerResult> {
  const checkDate = nextFridayAfter(options.period.end);
  const employees = buildEmployees(options.hours, options.directory);
  const paid = sortLedgerEmployees(
    employees.filter((employee) => !employee.skipped && employee.grossWages > 0),
  );

  for (const employee of paid) {
    if (employee.displayName.toLowerCase().includes("hazel herrera")) {
      employee.sickWages = HAZEL_SICK_TIME_OFF;
    }
  }

  if (!paid.length) {
    throw new Error("No hourly employees with pay rates were found for this timesheet.");
  }

  const regularTotal = money(paid.reduce((sum, row) => sum + row.regularWages, 0));
  const overtimeTotal = money(paid.reduce((sum, row) => sum + row.overtimeWages, 0));
  const doubleTotal = money(paid.reduce((sum, row) => sum + row.doubleOvertimeWages, 0));
  const ssTotal = money(paid.reduce((sum, row) => sum + row.employerSs, 0));
  const medicareTotal = money(paid.reduce((sum, row) => sum + row.employerMedicare, 0));
  const sickTotal = money(paid.reduce((sum, row) => sum + row.sickWages, 0));
  const debitTotal = money(
    regularTotal + overtimeTotal + doubleTotal + ssTotal + medicareTotal + sickTotal,
  );
  const credits = buildPayrollCredits(paid, checkDate, debitTotal);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = COMPANY;

  const basic = workbook.addWorksheet("Basic");
  setLedgerColumns(basic);
  writeLedgerHeader(basic, options.period, checkDate);
  let basicRow = 8;
  writeLine(basic, basicRow, "EmployerTax", "Social Security - employer tax", ssTotal, null);
  basicRow += 1;
  writeLine(basic, basicRow, "EmployerTax", "Medicare - employer tax", medicareTotal, null);
  basicRow += 1;
  if (overtimeTotal > 0) {
    writeLine(basic, basicRow, "OvertimeWages", "Overtime Wages", overtimeTotal, null);
    basicRow += 1;
  }
  writeLine(basic, basicRow, "RegularWages", "Regular Wages", regularTotal, null);
  basicRow += 1;
  if (doubleTotal > 0) {
    writeLine(
      basic,
      basicRow,
      "DoubleOvertimeWages",
      "Double Overtime Wages",
      doubleTotal,
      null,
    );
    basicRow += 1;
  }
  if (sickTotal > 0) {
    writeLine(basic, basicRow, "SickTimeOff", "Sick Time Off", sickTotal, null);
    basicRow += 1;
  }
  basicRow = writeCredits(basic, basicRow, credits);
  basicRow += 1;
  textCell(basic, basicRow, 2, "Totals", { bold: true });
  textCell(basic, basicRow, 3, debitTotal, { bold: true, money: true });
  textCell(basic, basicRow, 4, debitTotal, { bold: true, money: true });

  const detailed = workbook.addWorksheet("Detailed");
  setLedgerColumns(detailed);
  writeLedgerHeader(detailed, options.period, checkDate);
  let detailedRow = 8;
  for (const employee of paid) {
    writeLine(
      detailed,
      detailedRow,
      "RegularWages",
      `Regular Wages for ${employee.displayName}`,
      employee.regularWages,
      null,
    );
    detailedRow += 1;
    if (employee.overtimeWages > 0) {
      writeLine(
        detailed,
        detailedRow,
        "OvertimeWages",
        `Overtime Wages for ${employee.displayName}`,
        employee.overtimeWages,
        null,
      );
      detailedRow += 1;
    }
    if (employee.doubleOvertimeWages > 0) {
      writeLine(
        detailed,
        detailedRow,
        "DoubleOvertimeWages",
        `Double Overtime Wages for ${employee.displayName}`,
        employee.doubleOvertimeWages,
        null,
      );
      detailedRow += 1;
    }
  }
  for (const employee of paid) {
    writeLine(
      detailed,
      detailedRow,
      "EmployerTax",
      "Social Security - employer tax",
      employee.employerSs,
      null,
    );
    detailedRow += 1;
    writeLine(
      detailed,
      detailedRow,
      "EmployerTax",
      "Medicare - employer tax",
      employee.employerMedicare,
      null,
    );
    detailedRow += 1;
  }
  detailedRow = writeCredits(detailed, detailedRow, credits);
  detailedRow += 1;
  textCell(detailed, detailedRow, 2, "Totals", { bold: true });
  textCell(detailed, detailedRow, 3, debitTotal, { bold: true, money: true });
  textCell(detailed, detailedRow, 4, debitTotal, { bold: true, money: true });

  addDerivedSheets(workbook, paid);

  const buffer = await workbook.xlsx.writeBuffer();
  const fileBase64 = Buffer.from(buffer).toString("base64");

  return {
    filename: `general_ledger_republic-supply-company_${checkDate}.xlsx`,
    checkDate,
    period: options.period,
    fileBase64,
    employees,
  };
}
