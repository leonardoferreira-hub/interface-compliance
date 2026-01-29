import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  FileText, 
  Image as ImageIcon, 
  File, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Documento } from '../../types/onboarding';

interface DocumentUploadProps {
  investorType: 'PF' | 'PJ' | 'INSTITUCIONAL';
  initialData?: Documento[];
  onSubmit: (documentos: Documento[]) => void;
}

type TipoDocumento = Documento['tipo'];

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

const documentosPF: { tipo: TipoDocumento; label: string; obrigatorio: boolean }[] = [
  { tipo: 'RG', label: 'RG ou CNH', obrigatorio: true },
  { tipo: 'COMPROVANTE_ENDERECO', label: 'Comprovante de Endereço', obrigatorio: true },
  { tipo: 'COMPROVANTE_RENDA', label: 'Comprovante de Renda/Patrimônio', obrigatorio: true },
  { tipo: 'OUTROS', label: 'Outros Documentos', obrigatorio: false },
];

const documentosPJ: { tipo: TipoDocumento; label: string; obrigatorio: boolean }[] = [
  { tipo: 'CONTRATO_SOCIAL', label: 'Contrato Social', obrigatorio: true },
  { tipo: 'CARTAO_CNPJ', label: 'Cartão CNPJ', obrigatorio: true },
  { tipo: 'COMPROVANTE_ENDERECO', label: 'Comprovante de Endereço', obrigatorio: true },
  { tipo: 'RG', label: 'RG do Representante Legal', obrigatorio: true },
  { tipo: 'COMPROVANTE_RENDA', label: 'Comprovante de Renda/Patrimônio', obrigatorio: true },
  { tipo: 'OUTROS', label: 'Outros Documentos', obrigatorio: false },
];

function getFileIcon(tipo: string) {
  if (tipo.startsWith('image/')) return ImageIcon;
  if (tipo.includes('pdf')) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function DocumentUpload({ investorType, initialData, onSubmit }: DocumentUploadProps) {
  const [documentos, setDocumentos] = useState<Documento[]>(initialData || []);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const documentosNecessarios = investorType === 'PF' ? documentosPF : documentosPJ;

  const processFile = async (file: File, tipo: TipoDocumento) => {
    const id = Math.random().toString(36).substring(7);
    
    // Adicionar à lista de uploads
    setUploadingFiles((prev) => [...prev, { id, file, progress: 0, status: 'uploading' }]);

    // Simular upload progressivo
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, progress } : f))
      );
    }

    // Completar upload
    setUploadingFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'completed' } : f))
    );

    // Adicionar documento
    const novoDocumento: Documento = {
      tipo,
      nome: file.name,
      file,
      url: URL.createObjectURL(file),
    };

    setDocumentos((prev) => [...prev, novoDocumento]);

    // Remover da lista de uploads após um tempo
    setTimeout(() => {
      setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
    }, 1000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, tipo: TipoDocumento) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      await processFile(file, tipo);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent, tipo: TipoDocumento) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    for (const file of Array.from(files)) {
      await processFile(file, tipo);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const removeDocumento = (index: number) => {
    setDocumentos((prev) => {
      const novo = [...prev];
      if (novo[index].url) {
        URL.revokeObjectURL(novo[index].url!);
      }
      novo.splice(index, 1);
      return novo;
    });
  };

  const getDocumentosPorTipo = (tipo: TipoDocumento) => {
    return documentos.filter((d) => d.tipo === tipo);
  };

  const todosObrigatoriosPreenchidos = documentosNecessarios
    .filter((d) => d.obrigatorio)
    .every((d) => getDocumentosPorTipo(d.tipo).length > 0);

  const handleSubmit = () => {
    onSubmit(documentos);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-[#008080]">
            Upload de Documentos
          </CardTitle>
          <p className="text-gray-600">
            Anexe os documentos necessários para completar seu cadastro.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Uploads em andamento */}
          <AnimatePresence>
            {uploadingFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <h4 className="font-medium text-gray-700">Enviando...</h4>
                {uploadingFiles.map((file) => (
                  <div key={file.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {file.file.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {file.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                      </span>
                    </div>
                    <Progress value={file.progress} className="h-2" />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Categorias de documentos */}
          <div className="space-y-6">
            {documentosNecessarios.map(({ tipo, label, obrigatorio }) => {
              const docsDoTipo = getDocumentosPorTipo(tipo);
              const Icon = getFileIcon(docsDoTipo[0]?.file?.type || '');

              return (
                <motion.div
                  key={tipo}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-700">{label}</h4>
                      {obrigatorio && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                          Obrigatório
                        </span>
                      )}
                    </div>
                    {docsDoTipo.length > 0 && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {docsDoTipo.length} arquivo(s)
                      </span>
                    )}
                  </div>

                  {/* Área de drop */}
                  <div
                    onDrop={(e) => handleDrop(e, tipo)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center transition-all",
                      dragActive
                        ? "border-[#008080] bg-[#008080]/5"
                        : "border-gray-300 hover:border-gray-400"
                    )}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Arraste arquivos aqui ou{' '}
                      <label className="text-[#008080] cursor-pointer hover:underline">
                        clique para selecionar
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e, tipo)}
                        />
                      </label>
                    </p>
                    <p className="text-xs text-gray-400">
                      PDF, JPG, PNG (máx. 10MB)
                    </p>
                  </div>

                  {/* Lista de arquivos */}
                  <AnimatePresence>
                    {docsDoTipo.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        {docsDoTipo.map((doc, idx) => {
                          const globalIndex = documentos.findIndex((d) => d === doc);
                          return (
                            <motion.div
                              key={`${doc.nome}-${idx}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#008080]/10 flex items-center justify-center">
                                  <Icon className="w-5 h-5 text-[#008080]" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium truncate max-w-[200px]">
                                    {doc.nome}
                                  </p>
                                  {doc.file && (
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(doc.file.size)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {doc.url && (
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-[#008080] hover:underline"
                                  >
                                    Visualizar
                                  </a>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeDocumento(globalIndex)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Status */}
          <div className="pt-4 border-t">
            {todosObrigatoriosPreenchidos ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-800">
                  Todos os documentos obrigatórios foram anexados
                </p>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <p className="text-sm text-amber-800">
                  Anexe todos os documentos obrigatórios marcados para continuar
                </p>
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!todosObrigatoriosPreenchidos}
            className="w-full bg-[#008080] hover:bg-[#006666] text-white"
          >
            {documentos.length > 0 
              ? `Continuar com ${documentos.length} documento(s)` 
              : 'Continuar'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
