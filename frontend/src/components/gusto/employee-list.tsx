"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";

import { EmployeeFormDialog } from "@/components/gusto/employee-form-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteEmployees,
  formatPay,
  listEmployees,
  type Employee,
} from "@/lib/employees";

type ListFilter = "all" | "hourly" | "monthly";

const FILTER_LABELS: Record<ListFilter, string> = {
  all: "Employees",
  hourly: "Hourly",
  monthly: "Monthly",
};

export function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filter, setFilter] = useState<ListFilter>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadEmployees = useCallback(async () => {
    try {
      const data = await listEmployees();
      setEmployees(data.employees);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load employees",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const visibleEmployees = useMemo(() => {
    if (filter === "all") {
      return employees;
    }
    return employees.filter((employee) => employee.frequency === filter);
  }, [employees, filter]);

  const selectedOnPage = selected.filter((id) =>
    visibleEmployees.some((employee) => employee.id === id),
  );

  function toggleSelected(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id),
    );
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditing(employee);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (selectedOnPage.length === 0) {
      return;
    }

    setDeleting(true);
    try {
      await deleteEmployees(selectedOnPage);
      setSelected([]);
      setDeleteOpen(false);
      await loadEmployees();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete employees",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto gap-1 px-1 text-base font-semibold text-zinc-700 hover:bg-transparent"
            >
              {FILTER_LABELS[filter]}
              <ChevronDown className="size-4 text-zinc-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={filter}
              onValueChange={(value) => setFilter(value as ListFilter)}
            >
              <DropdownMenuRadioItem value="all">Employees</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="hourly">Hourly</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="monthly">Monthly</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">
          {selectedOnPage.length === 1 ? (
            <Button
              variant="outline"
              onClick={() => {
                const employee = visibleEmployees.find(
                  (item) => item.id === selectedOnPage[0],
                );
                if (employee) {
                  openEdit(employee);
                }
              }}
            >
              <Pencil />
              Edit
            </Button>
          ) : null}
          {selectedOnPage.length > 0 ? (
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 />
              Delete
            </Button>
          ) : null}
          <Button onClick={openCreate}>
            <Plus />
            Add employee
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <section className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="divide-y divide-zinc-200">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="size-4 rounded-[4px]" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleEmployees.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            No employees yet. Add one to get started.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {visibleEmployees.map((employee) => {
              const checked = selected.includes(employee.id);
              return (
                <li
                  key={employee.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50"
                >
                    <Checkbox
                      className="mt-1"
                      checked={checked}
                      onCheckedChange={(value) =>
                        toggleSelected(employee.id, value === true)
                      }
                      aria-label={`Select ${employee.lastName}, ${employee.firstName}`}
                    />
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => openEdit(employee)}
                    >
                      <div className="text-[15px] font-semibold text-employee-name">
                        {employee.lastName}, {employee.firstName}
                      </div>
                      <div className="text-sm text-zinc-600">
                        {formatPay(employee.rate, employee.frequency)}
                      </div>
                    </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center justify-between bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-800">
          <span>Total</span>
          <span>{loading ? "—" : visibleEmployees.length}</span>
        </div>
      </section>

      <EmployeeFormDialog
        open={formOpen}
        employee={editing}
        onOpenChange={setFormOpen}
        onSaved={() => {
          setSelected([]);
          void loadEmployees();
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employees?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {selectedOnPage.length} employee
              {selectedOnPage.length === 1 ? "" : "s"} from payroll.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
