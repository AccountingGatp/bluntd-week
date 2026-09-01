import { API_URL } from "@/lib/api";

export const PAY_FREQUENCIES = ["hourly", "monthly"] as const;
export type PayFrequency = (typeof PAY_FREQUENCIES)[number];

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  rate: number;
  frequency: PayFrequency;
};

export type EmployeeInput = {
  firstName: string;
  lastName: string;
  rate: number;
  frequency: PayFrequency;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

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

  return data as T;
}

export function formatPay(rate: number, frequency: PayFrequency) {
  const suffix = frequency === "hourly" ? "hr" : "mo";
  const amount =
    frequency === "hourly" || !Number.isInteger(rate)
      ? rate.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : rate.toLocaleString("en-US");

  return `$${amount}/${suffix}`;
}

export function listEmployees() {
  return request<{ employees: Employee[]; total: number }>("/api/employees");
}

export function createEmployee(input: EmployeeInput) {
  return request<Employee>("/api/employees", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateEmployee(id: string, input: EmployeeInput) {
  return request<Employee>(`/api/employees/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteEmployees(ids: string[]) {
  if (ids.length === 1) {
    return request<void>(`/api/employees/${ids[0]}`, { method: "DELETE" });
  }

  return request<{ deleted: number }>("/api/employees/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}
