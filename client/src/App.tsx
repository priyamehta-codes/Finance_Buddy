import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import MoneyTransfer from "@/pages/MoneyTransfer";
import FinancialTools from "@/pages/FinancialTools";
import Settings from "@/pages/Settings";
import Auth from "@/pages/Auth";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;
  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/transactions">
        <ProtectedRoute component={Transactions} />
      </Route>
      <Route path="/money">
        <ProtectedRoute component={MoneyTransfer} />
      </Route>
      <Route path="/tools">
        <ProtectedRoute component={FinancialTools} />
      </Route>
      
      {/* Placeholder pages for navigation items */}
      <Route path="/budget">
         <ProtectedRoute component={Dashboard} />
      </Route>
       <Route path="/goals">
         <ProtectedRoute component={Dashboard} />
      </Route>
       <Route path="/settings">
         <ProtectedRoute component={Settings} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const setUser = useStore((state) => state.setUser);
  const hydrateData = useStore((state) => state.hydrateData);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check authentication on app load - must happen before rendering routes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          // Set user from server - this is the source of truth
          setUser(data.user);
          await hydrateData();
        } else {
          // Not authenticated, ensure user is null
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Not authenticated, user will be redirected to login
        setUser(null);
      } finally {
        setIsInitialized(true);
      }
    };

    checkAuth();
  }, [setUser]);

  if (!isInitialized) {
    return null; // Or a loading spinner if desired
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
