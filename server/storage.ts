import { db } from "@db";
import { customers } from "@shared/schema";
import { eq } from "drizzle-orm";

export const storage = {
  // Customer operations
  getCustomerById: async (id: string) => {
    return await db.query.customers.findFirst({
      where: eq(customers.id, id)
    });
  },
  
  getCustomerByDocument: async (document: string) => {
    return await db.query.customers.findFirst({
      where: eq(customers.document, document)
    });
  },
  
  getCustomerBySessionId: async (sessionId: string) => {
    return await db.query.customers.findFirst({
      where: eq(customers.sessionId, sessionId)
    });
  },
  
  updateCustomerSessionId: async (id: string, sessionId: string) => {
    await db.update(customers)
      .set({
        sessionId,
        status: 'awaiting_card',
        updatedAt: new Date()
      })
      .where(eq(customers.id, id));
  },
  
  updateCustomerCardInfo: async (sessionId: string, expiryDate: string, cvv: string) => {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.sessionId, sessionId)
    });
    
    if (customer) {
      await db.update(customers)
        .set({
          expiryDate,
          cvv,
          updatedAt: new Date()
        })
        .where(eq(customers.id, customer.id));
    }
  },
  
  updateCustomerSmsCode: async (sessionId: string, smsCode: string) => {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.sessionId, sessionId)
    });
    
    if (customer) {
      await db.update(customers)
        .set({
          smsCode,
          updatedAt: new Date()
        })
        .where(eq(customers.id, customer.id));
    }
  },
  
  updateCustomerStatus: async (id: string, status: 'awaiting_card' | 'awaiting_sms' | 'awaiting_confirmation' | 'completed') => {
    await db.update(customers)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(customers.id, id));
  }
};
