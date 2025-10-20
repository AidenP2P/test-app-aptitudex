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
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const App = () => (
  <ErrorBoundary>
    <Web3Provider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/claim" element={<Claim />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </TooltipProvider>
    </Web3Provider>
  </ErrorBoundary>
);

export default App;
