import { Router } from "express";
import mongoose from "mongoose";

import {
  Employee,
  PAY_FREQUENCIES,
  toEmployeeJSON,
  type PayFrequency,
} from "../models/employee.js";

export const employeeRouter = Router();

type EmployeeInput = {
  firstName?: unknown;
  lastName?: unknown;
  rate?: unknown;
  frequency?: unknown;
};

function parseEmployee(body: EmployeeInput) {
  const firstName =
    typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName =
    typeof body.lastName === "string" ? body.lastName.trim() : "";
  const rate = typeof body.rate === "number" ? body.rate : Number(body.rate);
  const frequency =
    typeof body.frequency === "string" ? body.frequency : undefined;

  if (!firstName) {
    return { error: "First name is required" } as const;
  }
  if (!lastName) {
    return { error: "Last name is required" } as const;
  }
  if (!Number.isFinite(rate) || rate < 0) {
    return { error: "Rate must be a number 0 or greater" } as const;
  }
  if (!PAY_FREQUENCIES.includes(frequency as PayFrequency)) {
    return { error: "Frequency must be hourly or monthly" } as const;
  }

  return {
    value: {
      firstName,
      lastName,
      rate,
      frequency: frequency as PayFrequency,
    },
  } as const;
}

employeeRouter.get("/", async (_req, res) => {
  const docs = await Employee.find().sort({ lastName: 1, firstName: 1 });
  res.json({
    employees: docs.map(toEmployeeJSON),
    total: docs.length,
  });
});

employeeRouter.post("/bulk-delete", async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  if (!ids.length || ids.some((id: unknown) => !mongoose.isValidObjectId(id))) {
    res.status(400).json({ error: "Provide an array of valid employee ids" });
    return;
  }

  const result = await Employee.deleteMany({ _id: { $in: ids } });
  res.json({ deleted: result.deletedCount });
});

employeeRouter.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid employee id" });
    return;
  }

  const doc = await Employee.findById(req.params.id);
  if (!doc) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  res.json(toEmployeeJSON(doc));
});

employeeRouter.post("/", async (req, res) => {
  const parsed = parseEmployee(req.body);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const doc = await Employee.create(parsed.value);
  res.status(201).json(toEmployeeJSON(doc));
});

employeeRouter.put("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid employee id" });
    return;
  }

  const parsed = parseEmployee(req.body);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const doc = await Employee.findByIdAndUpdate(req.params.id, parsed.value, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!doc) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  res.json(toEmployeeJSON(doc));
});

employeeRouter.delete("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid employee id" });
    return;
  }

  const doc = await Employee.findByIdAndDelete(req.params.id);
  if (!doc) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  res.status(204).send();
});
