import { parse } from "csv-parse/sync";

const REQUIRED_COLUMNS = ["fname", "lname", "local_date", "hours", "jobcode_1"];

export type HoursRow = {
  firstName: string;
  lastName: string;
  regularHours: number;
  overtimeHours: number;
  doubleOvertimeHours: number;
  unpaidBreakHours: number;
  paidHours: number;
  daysWorked: number;
};

export type HoursResult = {
  period: { start: string; end: string };
  employees: HoursRow[];
};

type TimesheetRecord = {
  fname?: string;
  lname?: string;
  local_date?: string;
  hours?: string;
  jobcode_1?: string;
};

type DailySplit = {
  date: string;
  paid: number;
  unpaid: number;
  regular: number;
  overtime: number;
  doubleOvertime: number;
};

function roundHours(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isUnpaidBreak(jobcode: string) {
  return /lunch/i.test(jobcode);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function weekStartMonday(dateStr: string) {
  const date = parseLocalDate(dateStr);
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + offset);
  return formatDate(date);
}

function previousDate(dateStr: string) {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() - 1);
  return formatDate(date);
}

function consecutiveWorkDays(workDates: Set<string>, date: string) {
  let count = 0;
  let cursor = date;
  while (workDates.has(cursor)) {
    count += 1;
    cursor = previousDate(cursor);
  }
  return count;
}

function splitDailyHours(paid: number, seventhDay: boolean) {
  if (seventhDay) {
    return {
      regular: 0,
      overtime: Math.min(paid, 8),
      doubleOvertime: Math.max(paid - 8, 0),
    };
  }

  return {
    regular: Math.min(paid, 8),
    overtime: Math.min(Math.max(paid - 8, 0), 4),
    doubleOvertime: Math.max(paid - 12, 0),
  };
}

function applyWeeklyOvertime(days: DailySplit[]) {
  const byWeek = new Map<string, DailySplit[]>();
  for (const day of days) {
    const key = weekStartMonday(day.date);
    const week = byWeek.get(key) ?? [];
    week.push(day);
    byWeek.set(key, week);
  }

  for (const week of byWeek.values()) {
    week.sort((a, b) => a.date.localeCompare(b.date));
    let weeklyRegular = week.reduce((sum, day) => sum + day.regular, 0);
    let excess = weeklyRegular - 40;
    if (excess <= 0) {
      continue;
    }

    for (let index = week.length - 1; index >= 0 && excess > 0; index -= 1) {
      const take = Math.min(week[index].regular, excess);
      week[index].regular -= take;
      week[index].overtime += take;
      excess -= take;
    }
  }
}

function personKey(firstName: string, lastName: string) {
  return `${normalizeName(lastName)}|${normalizeName(firstName)}`;
}

const FILENAME_PERIOD =
  /timesheet_report_(\d{4}-\d{2}-\d{2})_thru_(\d{4}-\d{2}-\d{2})/i;

export function generateHoursFromTimesheet(
  csvText: string,
  filename?: string,
): HoursResult {
  const records = parse(csvText.replace(/^\uFEFF/, ""), {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as TimesheetRecord[];

  if (!records.length) {
    throw new Error("The CSV file has no timesheet rows.");
  }

  const columns = Object.keys(records[0]).map((column) => column.trim());
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.includes(column));
  if (missing.length) {
    throw new Error(`Missing required columns: ${missing.join(", ")}`);
  }

  const grouped = new Map<
    string,
    { firstName: string; lastName: string; rows: TimesheetRecord[] }
  >();

  for (const record of records) {
    const firstName = (record.fname ?? "").trim();
    const lastName = (record.lname ?? "").trim();
    if (!firstName || !lastName) {
      continue;
    }

    const key = personKey(firstName, lastName);
    const existing = grouped.get(key);
    if (existing) {
      existing.rows.push(record);
    } else {
      grouped.set(key, { firstName, lastName, rows: [record] });
    }
  }

  const employees: HoursRow[] = [];
  const filenamePeriod = filename?.match(FILENAME_PERIOD);
  let periodStart = filenamePeriod?.[1] ?? "";
  let periodEnd = filenamePeriod?.[2] ?? "";

  for (const person of grouped.values()) {
    const paidByDate = new Map<string, number>();
    let unpaidBreakHours = 0;

    for (const row of person.rows) {
      const date = (row.local_date ?? "").trim();
      const hours = Number(row.hours);
      const jobcode = (row.jobcode_1 ?? "").trim();

      if (date && !filenamePeriod) {
        if (!periodStart || date < periodStart) {
          periodStart = date;
        }
        if (!periodEnd || date > periodEnd) {
          periodEnd = date;
        }
      }

      if (!date || !Number.isFinite(hours) || hours <= 0) {
        continue;
      }

      if (isUnpaidBreak(jobcode)) {
        unpaidBreakHours += hours;
        continue;
      }

      paidByDate.set(date, (paidByDate.get(date) ?? 0) + hours);
    }

    const workDates = new Set(paidByDate.keys());
    const days: DailySplit[] = [...paidByDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, paid]) => {
        const split = splitDailyHours(paid, consecutiveWorkDays(workDates, date) >= 7);
        return {
          date,
          paid,
          unpaid: 0,
          ...split,
        };
      });

    applyWeeklyOvertime(days);

    const regularHours = roundHours(days.reduce((sum, day) => sum + day.regular, 0));
    const overtimeHours = roundHours(days.reduce((sum, day) => sum + day.overtime, 0));
    const doubleOvertimeHours = roundHours(
      days.reduce((sum, day) => sum + day.doubleOvertime, 0),
    );
    const paidHours = roundHours(days.reduce((sum, day) => sum + day.paid, 0));

    if (paidHours <= 0 && unpaidBreakHours <= 0) {
      continue;
    }

    employees.push({
      firstName: person.firstName,
      lastName: person.lastName,
      regularHours,
      overtimeHours,
      doubleOvertimeHours,
      unpaidBreakHours: roundHours(unpaidBreakHours),
      paidHours,
      daysWorked: days.length,
    });
  }

  employees.sort((a, b) => {
    const last = a.lastName.localeCompare(b.lastName);
    return last !== 0 ? last : a.firstName.localeCompare(b.firstName);
  });

  if (!employees.length) {
    throw new Error("No paid hours were found in this timesheet.");
  }

  return {
    period: { start: periodStart, end: periodEnd },
    employees,
  };
}

export function namesMatch(
  a: { firstName: string; lastName: string },
  b: { firstName: string; lastName: string },
) {
  const firstA = normalizeName(a.firstName);
  const lastA = normalizeName(a.lastName);
  const firstB = normalizeName(b.firstName);
  const lastB = normalizeName(b.lastName);

  if (firstA === firstB && lastA === lastB) {
    return true;
  }

  return firstA === firstB && (lastA.startsWith(lastB) || lastB.startsWith(lastA));
}
