import { Employee, type PayFrequency } from "./models/employee.js";

const SEED_EMPLOYEES: {
  firstName: string;
  lastName: string;
  rate: number;
  frequency: PayFrequency;
}[] = [
  { firstName: "Cody", lastName: "Baldwin", rate: 6000, frequency: "monthly" },
  { firstName: "Paul", lastName: "Bates", rate: 21, frequency: "hourly" },
  { firstName: "Elysia", lastName: "Castro", rate: 20, frequency: "hourly" },
  { firstName: "Hazel", lastName: "Herrera", rate: 25, frequency: "hourly" },
  { firstName: "Sylvia", lastName: "Lopez", rate: 19.87, frequency: "hourly" },
  {
    firstName: "Genesis",
    lastName: "Lopez Pagoada",
    rate: 19,
    frequency: "hourly",
  },
  { firstName: "Issa", lastName: "Madanat", rate: 6000, frequency: "monthly" },
  { firstName: "Paola", lastName: "Sanchez", rate: 20, frequency: "hourly" },
  { firstName: "Carlos", lastName: "Silva", rate: 30, frequency: "hourly" },
];

export async function seedEmployees() {
  const count = await Employee.estimatedDocumentCount();
  if (count > 0) {
    return;
  }

  await Employee.insertMany(SEED_EMPLOYEES);
  console.log(`Seeded ${SEED_EMPLOYEES.length} employees`);
}
