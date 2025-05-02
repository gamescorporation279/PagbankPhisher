import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { SocketProvider } from "@/hooks/useSocket";

createRoot(document.getElementById("root")!).render(
  <SocketProvider>
    <App />
  </SocketProvider>
);
