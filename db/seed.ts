import { db } from "./index";
import * as schema from "@shared/schema";
import { formatDocument, formatCardNumber } from "../client/src/lib/utils";
import { randomUUID } from "crypto";

async function seed() {
  try {
    console.log("Seeding database...");

    // We don't need to create tables manually since we're using drizzle-kit push

    // Create admin user if not exists
    const adminExists = await db.query.admins.findFirst({
      where: (admins, { eq }) => eq(admins.username, "admin")
    });

    if (!adminExists) {
      console.log("Creating admin user...");
      await db.insert(schema.admins).values({
        id: randomUUID(),
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
          id: randomUUID(),
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
