import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function OnboardingPage() {
  const { token } = useParams<{ token: string }>();
  const { 
    isLoading, 
    validacao, 
    validarToken 
  } = useOnboarding();

  useEffect(() => {
    if (token) {
      validarToken(token);
    }
  }, [token, validarToken]);

  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-[#008080] mb-4" />
            <p className="text-gray-600">Validando seu cadastro...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Token inválido
  if (!validacao?.valido) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              Link Inválido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              {validacao?.message || 'O link de cadastro é inválido ou expirou.'}
            </p>
            <p className="text-sm text-gray-500">
              Entre em contato com o time de estruturação para obter um novo link de cadastro.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Token válido - renderizar wizard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#008080] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Compliance - Onboarding</h1>
                <p className="text-sm text-gray-500">Cadastro de Investidores</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Link verificado</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <OnboardingWizard />
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2025 Compliance Platform. Todos os direitos reservados.</p>
          <p className="mt-1">
            Em caso de dúvidas, entre em contato com o time de estruturação.
          </p>
        </div>
      </footer>
    </div>
  );
}
