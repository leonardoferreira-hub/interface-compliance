import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy loading das páginas
const Index = lazy(() => import("./pages/Index"));
const Verificacoes = lazy(() => import("./pages/Verificacoes"));
const Investidores = lazy(() => import("./pages/Investidores"));
const Historico = lazy(() => import("./pages/Historico"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const OnboardingObrigado = lazy(() => import("./pages/OnboardingObrigado"));
const CadastroInvestidoresEmissao = lazy(() => import("./pages/CadastroInvestidoresEmissao"));
const ObrigadoInvestidor = lazy(() => import("./pages/ObrigadoInvestidor"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Fallback de loading
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="space-y-4 w-full max-w-md px-4">
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6 mx-auto" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/verificacoes" element={<Verificacoes />} />
            <Route path="/investidores" element={<Investidores />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/onboarding/:token" element={<Onboarding />} />
            <Route path="/obrigado" element={<OnboardingObrigado />} />
            <Route path="/cadastro-investidores/:emissaoId" element={<CadastroInvestidoresEmissao />} />
            <Route path="/obrigado-investidor" element={<ObrigadoInvestidor />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
