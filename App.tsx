import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import WorkOrdersPage from "@/pages/work-orders";
import AIAssistantPage from "@/pages/ai-assistant";
import CameraARPage from "@/pages/camera-ar";
import TrainingPage from "@/pages/training";
import DashboardPage from "@/pages/dashboard";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/work-orders" component={WorkOrdersPage} />
          <Route path="/ai-assistant" component={AIAssistantPage} />
          <Route path="/camera-ar" component={CameraARPage} />
          <Route path="/training" component={TrainingPage} />
          <Route path="/dashboard" component={DashboardPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
