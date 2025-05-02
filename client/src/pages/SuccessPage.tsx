import { useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle } from "lucide-react";

export default function SuccessPage() {
  const [, navigate] = useLocation();

  const handleBackToHome = () => {
    navigate("/");
  };

  // Clear session on success page
  useEffect(() => {
    // Send a request to clear session data
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(err => console.error("Failed to logout:", err));
  }, []);

  return (
    <div className="flex-grow flex flex-col items-center justify-center py-8 px-4">
      <div className="w-full max-w-md mx-auto text-center">
        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
          <div className="text-green-500 mb-4">
            <CheckCircle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-medium mb-4">Obrigado!</h2>
          <p className="text-gray-600 mb-6">Seu acesso foi validado com sucesso.</p>
          <button 
            onClick={handleBackToHome}
            className="bg-primary text-white rounded py-3 px-6 font-medium hover:bg-primary/90 transition inline-block"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
}
