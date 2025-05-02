import React, { createContext, useState, useEffect, useContext, useCallback } from "react";

type SocketContextType = {
  socket: WebSocket | null;
  connected: boolean;
  sendMessage: (data: any) => void;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  sendMessage: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    // Connection opened
    ws.addEventListener("open", () => {
      console.log("WebSocket connection established");
      setConnected(true);
    });

    // Connection closed
    ws.addEventListener("close", () => {
      console.log("WebSocket connection closed");
      setConnected(false);
      
      // Try to reconnect after 3 seconds
      setTimeout(() => {
        setSocket(null);
      }, 3000);
    });

    // Connection error
    ws.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
    });

    // Save socket instance
    setSocket(ws);

    // Cleanup on unmount
    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = useCallback((data: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    } else {
      console.error("WebSocket not connected");
    }
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, connected, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
