import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { Web3Provider } from "./providers/Web3Provider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Home from "./pages/Home";
import Rewards from "./pages/Rewards";
import Claim from "./pages/Claim";
import Activity from "./pages/Activity";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const App = () => (
  <ErrorBoundary>
    <Web3Provider>
      <ErrorBoundary>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <AppShell>
                <Routes>
                  <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
                  <Route path="/rewards" element={<ErrorBoundary><Rewards /></ErrorBoundary>} />
                  <Route path="/claim" element={<ErrorBoundary><Claim /></ErrorBoundary>} />
                  <Route path="/activity" element={<ErrorBoundary><Activity /></ErrorBoundary>} />
                  <Route path="/admin" element={<ErrorBoundary><Admin /></ErrorBoundary>} />
                  <Route path="*" element={<ErrorBoundary><NotFound /></ErrorBoundary>} />
                </Routes>
              </AppShell>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </ErrorBoundary>
    </Web3Provider>
  </ErrorBoundary>
);

export default App;
