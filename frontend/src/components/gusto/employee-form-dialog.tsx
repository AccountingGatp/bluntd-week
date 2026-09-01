"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createEmployee,
  updateEmployee,
  type Employee,
  type EmployeeInput,
  type PayFrequency,
} from "@/lib/employees";

type EmployeeFormDialogProps = {
  open: boolean;
  employee: Employee | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function EmployeeFormDialog({
  open,
  employee,
  onOpenChange,
  onSaved,
}: EmployeeFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <EmployeeForm
          key={employee?.id ?? "new"}
          employee={employee}
          onCancel={() => onOpenChange(false)}
          onSaved={() => {
            onOpenChange(false);
            onSaved();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function EmployeeForm({
  employee,
  onCancel,
  onSaved,
}: {
  employee: Employee | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState(employee?.firstName ?? "");
  const [lastName, setLastName] = useState(employee?.lastName ?? "");
  const [rate, setRate] = useState(employee ? String(employee.rate) : "");
  const [frequency, setFrequency] = useState<PayFrequency>(
    employee?.frequency ?? "hourly",
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const input: EmployeeInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      rate: Number(rate),
      frequency,
    };

    try {
      if (employee) {
        await updateEmployee(employee.id, input);
      } else {
        await createEmployee(input);
      }
      onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save employee",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{employee ? "Edit employee" : "Add employee"}</DialogTitle>
        <DialogDescription>
          Names appear as Last, First. Rates can be hourly or monthly.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="rate">Rate</Label>
            <Input
              id="rate"
              type="number"
              min="0"
              step="0.01"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(value) => setFrequency(value as PayFrequency)}
            >
              <SelectTrigger id="frequency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : employee ? "Save changes" : "Add employee"}
        </Button>
      </DialogFooter>
    </form>
  );
}
