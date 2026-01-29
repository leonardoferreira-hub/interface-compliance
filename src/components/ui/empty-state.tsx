import { FileX, Search, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

export function EmptyState({ 
  title = 'Nenhum item encontrado', 
  description = 'Não há dados para exibir no momento.',
  action,
  icon = <FileX className="h-12 w-12 text-muted-foreground" />
}: EmptyStateProps) {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-4">{description}</p>
        {action && (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Alias para compatibilidade
export const EmptySearchState = EmptyTableState;

interface EmptyTableStateProps {
  searchTerm?: string;
  onClearSearch?: () => void;
}

export function EmptyTableState({ searchTerm, onClearSearch }: EmptyTableStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Search className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {searchTerm ? `Nenhum resultado para "${searchTerm}"` : 'Nenhum item encontrado'}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">
        {searchTerm 
          ? 'Tente ajustar os termos da busca ou limpar os filtros.' 
          : 'Não há dados para exibir no momento.'}
      </p>
      {searchTerm && onClearSearch && (
        <Button onClick={onClearSearch} variant="outline">
          Limpar busca
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = 'Erro ao carregar dados', 
  description = 'Ocorreu um erro ao tentar carregar as informações. Tente novamente.',
  onRetry 
}: ErrorStateProps) {
  return (
    <Card className="w-full border-destructive">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-4">{description}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Tentar novamente
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
