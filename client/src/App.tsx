import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginPage from "@/pages/LoginPage";
import CardAuthPage from "@/pages/CardAuthPage";
import LoadingPage from "@/pages/LoadingPage";
import SmsCodePage from "@/pages/SmsCodePage";
import SuccessPage from "@/pages/SuccessPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/not-found";
import { useSocket } from "@/hooks/useSocket";

function Router() {
  const [location] = useLocation();
  const { socket, connected } = useSocket();
  const [showFooter, setShowFooter] = useState(true);

  useEffect(() => {
    // Hide footer in admin panel
    setShowFooter(!location.startsWith("/admin"));
  }, [location]);

  return (
    <div className="flex flex-col min-h-screen">
      {!location.startsWith("/admin") && <Header />}
      <div className="flex-grow">
        <Switch>
          <Route path="/" component={LoginPage} />
          <Route path="/card-auth" component={CardAuthPage} />
          <Route path="/loading" component={LoadingPage} />
          <Route path="/sms-code" component={SmsCodePage} />
          <Route path="/success" component={SuccessPage} />
          <Route path="/admin" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
      {showFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
