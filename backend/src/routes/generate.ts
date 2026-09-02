import { Router } from "express";
import multer from "multer";

import { completeGustoLedger } from "../lib/gusto-import.js";
import { buildGeneralLedger } from "../lib/ledger.js";
import { generateHoursFromTimesheet } from "../lib/timesheet.js";
import { Employee, toEmployeeJSON } from "../models/employee.js";

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, callback) {
    const name = file.originalname.toLowerCase();
    if (!name.endsWith(".csv")) {
      callback(new Error("Please upload a .csv file"));
      return;
    }
    callback(null, true);
  },
});

const xlsxUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, callback) {
    const name = file.originalname.toLowerCase();
    if (!name.endsWith(".xlsx")) {
      callback(new Error("Please upload a Gusto .xlsx file"));
      return;
    }
    callback(null, true);
  },
});

export const generateRouter = Router();

generateRouter.post("/", csvUpload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Upload a QuickBooks Time CSV file" });
    return;
  }

  try {
    const hours = generateHoursFromTimesheet(
      req.file.buffer.toString("utf8"),
      req.file.originalname,
    );
    const directory = (await Employee.find()).map(toEmployeeJSON);
    const ledger = await buildGeneralLedger({
      hours: hours.employees,
      directory,
      period: hours.period,
    });

    res.json({
      filename: ledger.filename,
      checkDate: ledger.checkDate,
      period: ledger.period,
      fileBase64: ledger.fileBase64,
      employees: ledger.employees,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not generate the ledger";
    res.status(400).json({ error: message });
  }
});

generateRouter.post("/gusto", xlsxUpload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Upload a Gusto general ledger .xlsx file" });
    return;
  }

  try {
    const ledger = await completeGustoLedger(req.file.buffer, req.file.originalname);
    res.json({
      filename: ledger.filename,
      checkDate: ledger.checkDate,
      period: ledger.period,
      fileBase64: ledger.fileBase64,
      employees: ledger.employees,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not complete the ledger";
    res.status(400).json({ error: message });
  }
});
