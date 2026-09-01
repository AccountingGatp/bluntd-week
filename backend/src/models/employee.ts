import mongoose, { Schema } from "mongoose";

export const PAY_FREQUENCIES = ["hourly", "monthly"] as const;
export type PayFrequency = (typeof PAY_FREQUENCIES)[number];

export type EmployeeJSON = {
  id: string;
  firstName: string;
  lastName: string;
  rate: number;
  frequency: PayFrequency;
};

type EmployeeDoc = {
  firstName: string;
  lastName: string;
  rate: number;
  frequency: PayFrequency;
};

const employeeSchema = new Schema<EmployeeDoc>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    rate: { type: Number, required: true, min: 0 },
    frequency: { type: String, enum: PAY_FREQUENCIES, required: true },
  },
  { timestamps: true },
);

employeeSchema.index({ lastName: 1, firstName: 1 });

export const Employee = mongoose.model("Employee", employeeSchema);

export function toEmployeeJSON(doc: {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  rate: number;
  frequency: PayFrequency;
}): EmployeeJSON {
  return {
    id: String(doc._id),
    firstName: doc.firstName,
    lastName: doc.lastName,
    rate: doc.rate,
    frequency: doc.frequency,
  };
}
