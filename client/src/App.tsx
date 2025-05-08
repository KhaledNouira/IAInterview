import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import DashboardPage from "@/pages/dashboard-page";
import AuthPage from "@/pages/auth-page";
import InterviewPage from "@/pages/interview-page";
import FeedbackPage from "@/pages/feedback-page";
import LandingPage from "@/pages/landing-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { ThemeProvider } from "./components/theme-provider";

function Router() {
  const { user, isLoading } = useAuth();
  
  // Use LandingPage as main entry point for unauthenticated users
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/interview/:id" component={InterviewPage} />
      <ProtectedRoute path="/feedback/:id" component={FeedbackPage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <Route component={LandingPage} path="/landing" />
      <Route>
        {/* Default route - show landing page if not logged in, otherwise not found */}
        {!isLoading && !user ? <LandingPage /> : <NotFound />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="interview-ai-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
