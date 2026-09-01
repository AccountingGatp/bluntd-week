import { API_URL } from "@/lib/api";

export type GeneratedEmployee = {
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
  skipReason?: string;
};

export type GenerateResponse = {
  filename: string;
  checkDate: string;
  period: { start: string; end: string };
  fileBase64: string;
  employees: GeneratedEmployee[];
};

export async function generateLedgerFile(file: File) {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch(`${API_URL}/api/generate`, {
    method: "POST",
    body,
  });

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data as GenerateResponse;
}

export function downloadXlsx(filename: string, fileBase64: string) {
  const binary = atob(fileBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
