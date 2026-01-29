import { motion } from 'framer-motion';
import { CheckCircle, Mail, Clock, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'react-router-dom';

export default function ObrigadoInvestidorPage() {
  const [searchParams] = useSearchParams();
  const emissaoId = searchParams.get('emissao');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card className="shadow-xl">
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="h-10 w-10 text-green-600" />
            </motion.div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Cadastro Enviado!
            </h1>
            
            <p className="text-slate-500 mb-6">
              Os investidores foram cadastrados com sucesso. 
              Eles receberão um email para completar o processo de compliance.
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-blue-900">Email enviado</p>
                    <p className="text-sm text-blue-700">Link para KYC e documentos</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <div className="text-left">
                    <p className="font-medium text-amber-900">Prazo de análise</p>
                    <p className="text-sm text-amber-700">Até 2 dias úteis</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-slate-600" />
                  <div className="text-left">
                    <p className="font-medium text-slate-900">Status na emissão</p>
                    <p className="text-sm text-slate-600">
                      Você poderá acompanhar o status de cada investidor na página da emissão
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => window.close()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Fechar
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
