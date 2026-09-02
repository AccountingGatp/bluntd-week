import ExcelJS from "exceljs";
import { parse } from "csv-parse/sync";

import type { EmployeeJSON } from "../models/employee.js";
import { namesMatch } from "./timesheet.js";

const FILENAME_PERIOD =
  /timesheet_report_(\d{4}-\d{2}-\d{2})_thru_(\d{4}-\d{2}-\d{2})/i;
const HEADER_FILL = "CCCCCC";
const DEFAULT_RATE = 17.78;

const DEFAULT_RATES: { name: string; rate: number }[] = [
  { name: "Adrian Rodriguez", rate: 17.87 },
  { name: "Adriana Lopez", rate: 18 },
  { name: "Alexander Torres", rate: 17.87 },
  { name: "Angie Hernandez", rate: 17.87 },
  { name: "Anielka Cano", rate: 17.87 },
  { name: "Arlin Sepulveda", rate: 17.87 },
  { name: "Blanca Mendoza", rate: 17.87 },
  { name: "Carlos Silva", rate: 30 },
  { name: "Crystal Aguilar", rate: 17.87 },
  { name: "Daniel Valle", rate: 17.87 },
  { name: "Deborah Duarte", rate: 17.87 },
  { name: "Dina Ceto", rate: 17.87 },
  { name: "Emily Hernandez", rate: 17.87 },
  { name: "Emmanuel Martinez", rate: 17.87 },
  { name: "Frank Saucedo", rate: 17.87 },
  { name: "Geidi Lopez", rate: 17.87 },
  { name: "Genesis Lopez", rate: 19 },
  { name: "Hazel", rate: 19 },
  { name: "Irene Herrera", rate: 17.87 },
  { name: "Iris Ruiz", rate: 17.87 },
  { name: "Jasmine Solis", rate: 17.87 },
  { name: "Jennifer Hernandez", rate: 17.87 },
  { name: "Jesus Alaniz", rate: 19 },
  { name: "Jonathon Ramirez", rate: 17.87 },
  { name: "Jorge Hernandez", rate: 17.87 },
  { name: "Joselyn Raymundo", rate: 17.87 },
  { name: "Juan Salgado", rate: 17.87 },
  { name: "Karla Bonilla", rate: 17.87 },
  { name: "Katy Gonzalez", rate: 17.87 },
  { name: "Larry Raymond", rate: 25 },
  { name: "Leah Lovos", rate: 17.87 },
  { name: "Leticia Valdez", rate: 19 },
  { name: "Lucia Lopez", rate: 17.87 },
  { name: "Marco Garcia", rate: 17.87 },
  { name: "Natalie Cardona", rate: 17.75 },
  { name: "Nicolas Andrade", rate: 17.87 },
  { name: "Nubia Cruz", rate: 17.87 },
  { name: "Eddy Lopez", rate: 17.78 },
  { name: "Justin Lopez", rate: 17.78 },
  { name: "Lissette Mejia", rate: 17.78 },
  { name: "Tracy pea", rate: 17.78 },
  { name: "winston Sanchez", rate: 17.78 },
  { name: "Paola Sanchez", rate: 20 },
  { name: "Paul Bates", rate: 21 },
  { name: "Rommel Hernandez", rate: 17.87 },
  { name: "Rosa Santini", rate: 17.87 },
  { name: "Sandra Martinez", rate: 17.87 },
  { name: "Sergio Urbina", rate: 17.87 },
  { name: "Silvia Zelaya", rate: 17.87 },
  { name: "Valery Moreno", rate: 21 },
  { name: "Velinda Ordonez", rate: 17.87 },
  { name: "Vilma Cruz", rate: 17.87 },
  { name: "Yohana Rivas", rate: 17.87 },
  { name: "Yvette Chavez", rate: 17.87 },
  { name: "Yvette Oropeza", rate: 17.87 },
  { name: "Zaira Castaneda", rate: 17.87 },
  { name: "Aishley Mendoza", rate: 17.87 },
  { name: "Alba Espinoza", rate: 17.87 },
  { name: "Gloria Cajina", rate: 17.87 },
  { name: "Gloria Espinoza", rate: 17.87 },
  { name: "Adriana Rivera", rate: 17.87 },
  { name: "Hazel Herrera", rate: 25 },
  { name: "Gringel Gonzalez", rate: 17.87 },
  { name: "Tamas Pazsicky", rate: 17.87 },
  { name: "Julie Garcia", rate: 17.87 },
  { name: "Azucena Gomez", rate: 17.87 },
  { name: "Elysia Castro", rate: 20 },
  { name: "Alejandro Armenta", rate: 17.87 },
  { name: "Sylvia Lopez", rate: 19.87 },
  { name: "Bryan Centeno", rate: 17.78 },
  { name: "Scarlette Chacon", rate: 17.78 },
  { name: "Azucena Zuceth", rate: 20 },
  { name: "German Jimenez", rate: 17.78 },
];

export type QboEmployee = {
  firstName: string;
  lastName: string;
  displayName: string;
  regularHours: number;
  overtimeHours: number;
  doubleOvertimeHours: number;
  regularWages: number;
  overtimeWages: number;
  doubleOvertimeWages: number;
  employerTax: number;
  grossWages: number;
  skipped: boolean;
};

export type QboResult = {
  filename: string;
  checkDate: string;
  period: { start: string; end: string };
  fileBase64: string;
  employees: QboEmployee[];
};

type Punch = {
  firstName: string;
  lastName: string;
  fullName: string;
  number: string;
  group: string;
  date: string;
  day: string;
  start: Date | null;
  end: Date | null;
  tz: number | string;
  hours: number;
  jobcode1: string;
  jobcode2: string;
  jobcode3: string;
  location: string;
};

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundHours(value: number) {
  return Math.round(value * 100) / 100;
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

function isLunch(jobcode: string) {
  return /lunch/i.test(jobcode);
}

function isRest(jobcode: string) {
  return /rest/i.test(jobcode);
}

function isRsc(jobcode: string) {
  return /^rsc$/i.test(jobcode.trim());
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, day));
}

function parseDateTime(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/,
  );
  if (!match) {
    return parseDateOnly(value);
  }
  return new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6] ?? 0),
    ),
  );
}

function titleCaseName(name: string) {
  return name.replace(/\b([a-z])/g, (letter) => letter.toUpperCase());
}

function rscEmployeeNames(punches: Punch[]) {
  return uniqueNames(punches).filter((name) =>
    punches.some((row) => row.fullName === name && isRsc(row.jobcode1)),
  );
}

function weekFilename(start: string, end: string) {
  const format = (iso: string) => {
    const [year, month, day] = iso.split("-");
    return `${month}.${day}.${year}`;
  };
  return `Week ${format(start)} to ${format(end)}.xlsx`;
}

function grayCell(cell: ExcelJS.Cell) {
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: `FF${HEADER_FILL}` },
  };
}

function rateFor(
  fullName: string,
  rates: { name: string; rate: number }[],
) {
  const person = splitName(fullName);
  const match = rates.find((row) => namesMatch(splitName(row.name), person));
  return match?.rate ?? DEFAULT_RATE;
}

function mergeRates(directory: EmployeeJSON[], punches: Punch[]) {
  const rates = DEFAULT_RATES.map((row) => ({ ...row }));
  for (const employee of directory) {
    const fullName = `${employee.firstName} ${employee.lastName}`.trim();
    const existing = rates.find((row) =>
      namesMatch(splitName(row.name), employee),
    );
    if (existing) {
      existing.rate = employee.rate;
    } else {
      rates.push({ name: fullName, rate: employee.rate });
    }
  }
  for (const punch of punches) {
    const existing = rates.find((row) =>
      namesMatch(splitName(row.name), punch),
    );
    if (!existing) {
      rates.push({ name: punch.fullName, rate: DEFAULT_RATE });
    }
  }
  return rates;
}

function parsePunches(csvText: string, filename?: string) {
  const records = parse(csvText.replace(/^\uFEFF/, ""), {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as Record<string, string>[];

  if (!records.length) {
    throw new Error("The CSV file has no timesheet rows.");
  }

  const punches: Punch[] = [];
  for (const record of records) {
    const firstName = (record.fname ?? "").trim();
    const lastName = (record.lname ?? "").trim();
    if (!firstName || !lastName) {
      continue;
    }
    const hours = Number(record.hours);
    punches.push({
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      number: (record.number ?? "").trim(),
      group: (record.group ?? "").trim(),
      date: (record.local_date ?? "").trim().slice(0, 10),
      day: (record.local_day ?? "").trim(),
      start: parseDateTime(record.local_start_time ?? ""),
      end: parseDateTime(record.local_end_time ?? ""),
      tz: record.tz?.trim() ? Number(record.tz) : "",
      hours: Number.isFinite(hours) ? hours : 0,
      jobcode1: (record.jobcode_1 ?? "").trim(),
      jobcode2: (record.jobcode_2 ?? "").trim(),
      jobcode3: (record.jobcode_3 ?? "").trim(),
      location: (record.location ?? "").trim(),
    });
  }

  if (!punches.length) {
    throw new Error("No timesheet rows were found.");
  }

  const filenamePeriod = filename?.match(FILENAME_PERIOD);
  const dates = punches.map((row) => row.date).filter(Boolean).sort();
  return {
    punches,
    period: {
      start: filenamePeriod?.[1] ?? dates[0] ?? "",
      end: filenamePeriod?.[2] ?? dates[dates.length - 1] ?? "",
    },
  };
}

function uniqueNames(punches: Punch[]) {
  const names: string[] = [];
  for (const punch of punches) {
    if (!names.includes(punch.fullName)) {
      names.push(punch.fullName);
    }
  }
  return names;
}

function writeHourlyRates(
  sheet: ExcelJS.Worksheet,
  rates: { name: string; rate: number }[],
) {
  sheet.getColumn(2).width = 22;
  sheet.getColumn(3).width = 12;
  sheet.getCell("B2").value = "Full Name";
  sheet.getCell("C2").value = "Pay Rate";
  sheet.getCell("B2").font = { bold: true };
  sheet.getCell("C2").font = { bold: true };
  rates.forEach((row, index) => {
    const excelRow = index + 4;
    sheet.getCell(excelRow, 2).value = row.name;
    sheet.getCell(excelRow, 3).value = row.rate;
  });
  return rates.length + 3;
}

function writeDataSheet(
  sheet: ExcelJS.Worksheet,
  punches: Punch[],
  rateLastRow: number,
) {
  const headers = [
    "fullname",
    "fname",
    "lname",
    "number",
    "group",
    "local_date",
    "local_day",
    "local_start_time",
    "local_end_time",
    "tz",
    "hours",
    "jobcode_1",
    "jobcode_2",
    "jobcode_3",
    "location",
    "payrate",
    "total pay",
  ];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(1, index + 1);
    cell.value = header;
    cell.font = { name: "Calibri", size: 11, bold: true };
    if (index === 0 || index >= 15) {
      grayCell(cell);
    }
  });
  sheet.getColumn(1).width = 18;
  sheet.getColumn(6).width = 14;
  sheet.getColumn(8).width = 20;
  sheet.getColumn(9).width = 20;
  sheet.getColumn(12).width = 18;

  punches.forEach((punch, index) => {
    const row = index + 2;
    const nameCell = sheet.getCell(row, 1);
    nameCell.value = { formula: `B${row}&" "&C${row}`, result: punch.fullName };
    grayCell(nameCell);
    sheet.getCell(row, 2).value = punch.firstName;
    sheet.getCell(row, 3).value = punch.lastName;
    sheet.getCell(row, 4).value = punch.number === "" ? 0 : Number(punch.number) || punch.number;
    sheet.getCell(row, 5).value = punch.group;
    const dateCell = sheet.getCell(row, 6);
    const dateValue = parseDateOnly(punch.date);
    dateCell.value = dateValue ?? punch.date;
    dateCell.numFmt = "yyyy-mm-dd";
    sheet.getCell(row, 7).value = punch.day;
    const startCell = sheet.getCell(row, 8);
    startCell.value = punch.start;
    startCell.numFmt = "yyyy-mm-dd hh:mm";
    const endCell = sheet.getCell(row, 9);
    endCell.value = punch.end;
    endCell.numFmt = "yyyy-mm-dd hh:mm";
    sheet.getCell(row, 10).value = punch.tz;
    sheet.getCell(row, 11).value = punch.hours;
    sheet.getCell(row, 12).value = punch.jobcode1;
    sheet.getCell(row, 13).value = punch.jobcode2;
    sheet.getCell(row, 14).value = punch.jobcode3;
    sheet.getCell(row, 15).value = punch.location;
    const rateCell = sheet.getCell(row, 16);
    rateCell.value = {
      formula: `VLOOKUP(A${row},'Hourly Rates'!$B$4:$C$${rateLastRow},2,FALSE)`,
    };
    grayCell(rateCell);
    const payCell = sheet.getCell(row, 17);
    payCell.value = { formula: `K${row}*P${row}` };
    grayCell(payCell);
  });
}

function writeOvertimeSheet(
  sheet: ExcelJS.Worksheet,
  punches: Punch[],
  rscNames: string[],
) {
  ["fname", "local_date", "Sum of hours", "Regular Hours", "Overtime Hours", "Double Hours"].forEach(
    (header, index) => {
      const cell = sheet.getCell(1, index + 1);
      cell.value = header;
      cell.font = { name: "Calibri", size: 11 };
    },
  );
  sheet.getColumn(1).width = 18;
  sheet.getColumn(2).width = 14;

  const byDay = new Map<string, { name: string; date: string; hours: number }>();
  for (const punch of punches) {
    if (
      !punch.date ||
      isLunch(punch.jobcode1) ||
      isRsc(punch.jobcode1) ||
      rscNames.includes(punch.fullName)
    ) {
      continue;
    }
    const key = `${punch.fullName}|${punch.date}`;
    const existing = byDay.get(key);
    if (existing) {
      existing.hours += punch.hours;
    } else {
      byDay.set(key, {
        name: punch.fullName,
        date: punch.date,
        hours: punch.hours,
      });
    }
  }

  const days = [...byDay.values()].sort((left, right) => {
    const name = left.name.localeCompare(right.name);
    return name !== 0 ? name : left.date.localeCompare(right.date);
  });

  days.forEach((day, index) => {
    const row = index + 2;
    const total = roundHours(day.hours);
    const regular = roundHours(Math.min(total, 8));
    const overtime = roundHours(total <= 8 ? 0 : Math.min(total - 8, 4));
    const doubleOvertime = roundHours(total - regular - overtime);
    sheet.getCell(row, 1).value = day.name;
    const dateCell = sheet.getCell(row, 2);
    dateCell.value = parseDateOnly(day.date);
    dateCell.numFmt = "yyyy-mm-dd";
    sheet.getCell(row, 3).value = total;
    sheet.getCell(row, 4).value = {
      formula: `MIN(C${row},8)`,
      result: regular,
    };
    sheet.getCell(row, 5).value = {
      formula: `IF(C${row}<=8,0,MIN(C${row}-8,4))`,
      result: overtime,
    };
    sheet.getCell(row, 6).value = {
      formula: `C${row}-(D${row}+E${row})`,
      result: doubleOvertime,
    };
  });

  return days;
}

function writeRscSheet(
  sheet: ExcelJS.Worksheet,
  punches: Punch[],
  rates: { name: string; rate: number }[],
) {
  [
    "Name",
    "RSC hour",
    "Rest Break Hours",
    "Total Hours",
    "RSC Pay",
    "Rest Break Pay",
    "Total Pay",
  ].forEach((header, index) => {
    const cell = sheet.getCell(1, index + 1);
    cell.value = header;
    cell.font = { bold: true };
  });
  sheet.getColumn(1).width = 18;
  sheet.getColumn(3).width = 18;

  const rscNames = rscEmployeeNames(punches);

  rscNames.forEach((name, index) => {
    const row = index + 2;
    const rscHours = roundHours(
      punches
        .filter((punch) => punch.fullName === name && isRsc(punch.jobcode1))
        .reduce((sum, punch) => sum + punch.hours, 0),
    );
    const restHours = roundHours(
      punches
        .filter((punch) => punch.fullName === name && isRest(punch.jobcode1))
        .reduce((sum, punch) => sum + punch.hours, 0),
    );
    const rate = rateFor(name, rates);
    sheet.getCell(row, 1).value = titleCaseName(name);
    sheet.getCell(row, 2).value = rscHours;
    sheet.getCell(row, 3).value = restHours;
    sheet.getCell(row, 4).value = {
      formula: `B${row}+C${row}`,
      result: roundHours(rscHours + restHours),
    };
    sheet.getCell(row, 5).value = {
      formula: `PRODUCT(VLOOKUP(A${row},'Hourly Rates'!B:C,2,0),B${row})`,
      result: money(rscHours * rate),
    };
    sheet.getCell(row, 6).value = {
      formula: `PRODUCT(VLOOKUP(A${row},'Hourly Rates'!B:C,2,0),C${row})`,
      result: money(restHours * rate),
    };
    sheet.getCell(row, 7).value = {
      formula: `E${row}+F${row}`,
      result: money(rscHours * rate + restHours * rate),
    };
  });

  if (rscNames.length) {
    const totalRow = rscNames.length + 2;
    const last = rscNames.length + 1;
    sheet.getCell(totalRow, 1).value = "Grand Total";
    sheet.getCell(totalRow, 1).font = { bold: true };
    for (const col of [2, 3, 4, 5, 6, 7]) {
      const letter = String.fromCharCode(64 + col);
      const cell = sheet.getCell(totalRow, col);
      cell.value = { formula: `SUM(${letter}2:${letter}${last})` };
      cell.font = { bold: true };
    }
  }

  return rscNames;
}

function writeSummary(
  sheet: ExcelJS.Worksheet,
  punches: Punch[],
  rates: { name: string; rate: number }[],
  overtimeDays: { name: string; hours: number }[],
  rscNames: string[],
) {
  sheet.getColumn(2).width = 18;
  sheet.getColumn(3).width = 14;
  sheet.getColumn(4).width = 14;
  sheet.getColumn(6).width = 18;
  sheet.getColumn(10).width = 22;
  sheet.getColumn(11).width = 28;

  const gustoNames = uniqueNames(punches)
    .filter((name) => !rscNames.includes(name))
    .sort((left, right) => left.localeCompare(right));

  sheet.getCell("B1").value = "Gusto Hours";
  sheet.getCell("B1").font = { bold: true };
  sheet.getCell("B3").value = "Name";
  sheet.getCell("C3").value = "Hours";
  sheet.getCell("D3").value = "Pay";
  ["B3", "C3", "D3"].forEach((cell) => {
    sheet.getCell(cell).font = { bold: true };
  });

  gustoNames.forEach((name, index) => {
    const rows = punches.filter(
      (punch) => punch.fullName === name && !isLunch(punch.jobcode1) && !isRsc(punch.jobcode1),
    );
    const hours = roundHours(rows.reduce((sum, row) => sum + row.hours, 0));
    const pay = money(hours * rateFor(name, rates));
    const excelRow = index + 4;
    sheet.getCell(excelRow, 2).value = name;
    sheet.getCell(excelRow, 3).value = hours;
    sheet.getCell(excelRow, 4).value = pay;
  });
  const gustoTotalRow = gustoNames.length + 4;
  sheet.getCell(gustoTotalRow, 2).value = "Grand Total";
  sheet.getCell(gustoTotalRow, 2).font = { bold: true };
  sheet.getCell(gustoTotalRow, 3).value = {
    formula: `SUM(C4:C${gustoTotalRow - 1})`,
  };
  sheet.getCell(gustoTotalRow, 4).value = {
    formula: `SUM(D4:D${gustoTotalRow - 1})`,
  };
  sheet.getCell(gustoTotalRow, 3).font = { bold: true };
  sheet.getCell(gustoTotalRow, 4).font = { bold: true };

  sheet.getCell("F1").value = "RSC Hours";
  sheet.getCell("F1").font = { bold: true };
  sheet.getCell("F3").value = "Name";
  sheet.getCell("G3").value = "Hours";
  sheet.getCell("H3").value = "Pay";
  ["F3", "G3", "H3"].forEach((cell) => {
    sheet.getCell(cell).font = { bold: true };
  });
  rscNames.forEach((name, index) => {
    const hours = roundHours(
      punches
        .filter((punch) => punch.fullName === name && isRsc(punch.jobcode1))
        .reduce((sum, punch) => sum + punch.hours, 0),
    );
    const excelRow = index + 4;
    sheet.getCell(excelRow, 6).value = titleCaseName(name);
    sheet.getCell(excelRow, 7).value = hours;
    sheet.getCell(excelRow, 8).value = money(hours * rateFor(name, rates));
  });

  sheet.getCell("J1").value = "RSC/OF by Job";
  sheet.getCell("J1").font = { bold: true };
  sheet.getCell("J3").value = "Job";
  sheet.getCell("K3").value = "Sub-job";
  sheet.getCell("L3").value = "Hours";
  sheet.getCell("M3").value = "Pay";
  ["J3", "K3", "L3", "M3"].forEach((cell) => {
    sheet.getCell(cell).font = { bold: true };
  });
  const jobs = new Map<string, { job: string; sub: string; hours: number; pay: number }>();
  for (const punch of punches) {
    if (!punch.jobcode1 || isLunch(punch.jobcode1)) {
      continue;
    }
    const key = `${punch.jobcode1}|${punch.jobcode2}`;
    const existing = jobs.get(key);
    const pay = punch.hours * rateFor(punch.fullName, rates);
    if (existing) {
      existing.hours += punch.hours;
      existing.pay += pay;
    } else {
      jobs.set(key, {
        job: punch.jobcode1,
        sub: punch.jobcode2,
        hours: punch.hours,
        pay,
      });
    }
  }
  [...jobs.values()]
    .sort((left, right) => {
      const job = left.job.localeCompare(right.job);
      return job !== 0 ? job : left.sub.localeCompare(right.sub);
    })
    .forEach((row, index) => {
      const excelRow = index + 4;
      sheet.getCell(excelRow, 10).value = row.job;
      sheet.getCell(excelRow, 11).value = row.sub;
      sheet.getCell(excelRow, 12).value = roundHours(row.hours);
      sheet.getCell(excelRow, 13).value = money(row.pay);
    });

  sheet.getCell("B13").value =
    "*The Rest break hours are added to checks as advised by the client.";

  sheet.getCell("B24").value = "Overtime hours";
  sheet.getCell("B24").font = { bold: true };
  sheet.getCell("B26").value = "Name";
  sheet.getCell("C26").value = "Hours";
  sheet.getCell("D26").value = "Regular";
  sheet.getCell("E26").value = "Overtime";
  sheet.getCell("F26").value = "Double";
  ["B26", "C26", "D26", "E26", "F26"].forEach((cell) => {
    sheet.getCell(cell).font = { bold: true };
  });

  const overtimeByName = new Map<
    string,
    { hours: number; regular: number; overtime: number; double: number }
  >();
  for (const day of overtimeDays) {
    const regular = Math.min(day.hours, 8);
    const overtime = day.hours <= 8 ? 0 : Math.min(day.hours - 8, 4);
    const doubleOvertime = roundHours(day.hours - regular - overtime);
    const existing = overtimeByName.get(day.name);
    if (existing) {
      existing.hours += day.hours;
      existing.regular += regular;
      existing.overtime += overtime;
      existing.double += doubleOvertime;
    } else {
      overtimeByName.set(day.name, {
        hours: day.hours,
        regular,
        overtime,
        double: doubleOvertime,
      });
    }
  }
  [...overtimeByName.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([name, totals], index) => {
      const excelRow = index + 27;
      sheet.getCell(excelRow, 2).value = name;
      sheet.getCell(excelRow, 3).value = roundHours(totals.hours);
      sheet.getCell(excelRow, 4).value = roundHours(totals.regular);
      sheet.getCell(excelRow, 5).value = roundHours(totals.overtime);
      sheet.getCell(excelRow, 6).value = roundHours(totals.double);
    });
}

export async function buildQboWorkbook(
  csvText: string,
  filename: string | undefined,
  directory: EmployeeJSON[],
): Promise<QboResult> {
  const { punches, period } = parsePunches(csvText, filename);
  const rates = mergeRates(directory, punches);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Bluntd";

  const summary = workbook.addWorksheet("Summary");
  const data = workbook.addWorksheet("Data");
  const overtime = workbook.addWorksheet("Overtime Calculation");
  const rsc = workbook.addWorksheet("RSC and REST");
  const hourly = workbook.addWorksheet("Hourly Rates");

  const rateLastRow = writeHourlyRates(hourly, rates);
  writeDataSheet(data, punches, Math.max(rateLastRow, 105));
  const rscNames = writeRscSheet(rsc, punches, rates);
  const overtimeDays = writeOvertimeSheet(overtime, punches, rscNames);
  writeSummary(summary, punches, rates, overtimeDays, rscNames);

  const employees: QboEmployee[] = uniqueNames(punches).map((name) => {
    const { firstName, lastName } = splitName(name);
    const isRscEmployee = rscNames.includes(name);
    const days = overtimeDays.filter((day) => day.name === name);
    const overtimeHours = isRscEmployee
      ? 0
      : roundHours(
          days.reduce(
            (sum, day) => sum + (day.hours <= 8 ? 0 : Math.min(day.hours - 8, 4)),
            0,
          ),
        );
    const regularHours = isRscEmployee
      ? roundHours(
          punches
            .filter(
              (punch) =>
                punch.fullName === name &&
                (isRsc(punch.jobcode1) || isRest(punch.jobcode1)),
            )
            .reduce((sum, punch) => sum + punch.hours, 0),
        )
      : roundHours(days.reduce((sum, day) => sum + Math.min(day.hours, 8), 0));
    const paidHours = roundHours(
      punches
        .filter((punch) => punch.fullName === name && !isLunch(punch.jobcode1))
        .reduce((sum, punch) => sum + punch.hours, 0),
    );
    const rate = rateFor(name, rates);
    return {
      firstName,
      lastName,
      displayName: name,
      regularHours,
      overtimeHours,
      doubleOvertimeHours: 0,
      regularWages: money(regularHours * rate),
      overtimeWages: money(overtimeHours * rate * 1.5),
      doubleOvertimeWages: 0,
      employerTax: 0,
      grossWages: money(paidHours * rate),
      skipped: false,
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    filename: weekFilename(period.start, period.end),
    checkDate: period.end,
    period,
    fileBase64: Buffer.from(buffer).toString("base64"),
    employees,
  };
}
