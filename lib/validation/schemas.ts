import { z } from "zod";

export const incomeSchema = z.object({
  amount: z.coerce.number().positive("יש להזין סכום חיובי"),
  activity_id: z.string().uuid().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  payment_method_id: z.string().uuid().optional().nullable(),
  transaction_date: z.string().min(1),
  description: z.string().max(500).optional().nullable(),
  status: z.enum(["draft", "received", "cancelled", "refunded"]).default("received"),
});

export const expenseSchema = z.object({
  amount: z.coerce.number().positive("יש להזין סכום חיובי"),
  expense_date: z.string().min(1),
  supplier_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  payment_method_id: z.string().uuid().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
});

export const onboardingSchema = z.object({
  businessName: z.string().min(1, "יש להזין שם עסק"),
  activities: z.array(z.string().min(1)).min(1, "יש להוסיף לפחות תחום פעילות אחד"),
  tax_status: z.enum(["EXEMPT_DEALER", "AUTHORIZED_DEALER", "OTHER"]),
  income_tax_status: z.enum(["SMALL_BUSINESS_OWNER", "STANDARD", "OTHER"]),
  tax_year: z.coerce.number().int().min(2020).max(2100),
});

export const clientSchema = z.object({
  name: z.string().min(1),
  tax_id: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable(),
});

export const supplierSchema = clientSchema.extend({
  tax_id: z.string().optional().nullable(),
});

export type IncomeInput = z.infer<typeof incomeSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
