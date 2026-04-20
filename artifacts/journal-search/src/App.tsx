/**
 * Application root.
 * Wraps the app in providers and renders the Header + SearchPage layout.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "./components/Header";
import { SearchPage } from "./pages/SearchPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Full-height flex column layout */}
        <div className="min-h-screen flex flex-col bg-background">
          <Header />
          {/* SearchPage fills remaining height */}
          <div className="flex flex-1 overflow-hidden">
            <SearchPage />
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
