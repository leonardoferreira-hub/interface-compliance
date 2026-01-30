import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DadosInstitucional } from '@/types/onboarding';

interface InstitucionalFormProps {
  value: Partial<DadosInstitucional>;
  onChange: (dados: DadosInstitucional) => void;
}

export function InstitucionalForm({ value, onChange }: InstitucionalFormProps) {
  // Usar any para flexibilidade com campos extras do formulário
  const [localData, setLocalData] = useState<any>(value || {});

  const handleChange = (field: string, valor: string) => {
    const updated = { ...localData, [field]: valor };
    setLocalData(updated);
  };

  const handleNestedChange = (parent: string, field: string, valor: string) => {
    const updated = {
      ...localData,
      [parent]: {
        ...(localData[parent] || {}),
        [field]: valor,
      },
    };
    setLocalData(updated);
  };

  const handleBlur = () => {
    // Mapear para o formato esperado pelo tipo
    const mapped: DadosInstitucional = {
      nomeInstituicao: localData.nome_instituicao || localData.nomeInstituicao || '',
      cnpj: localData.cnpj || '',
      tipoInstituicao: localData.tipo_instituicao || localData.tipoInstituicao || '',
      endereco: {
        cep: localData.cep || '',
        logradouro: localData.endereco || '',
        numero: localData.numero || '',
        bairro: localData.bairro || '',
        cidade: localData.cidade || '',
        estado: localData.estado || '',
      },
      telefone: localData.telefone || '',
      email: localData.email || '',
      responsavelNome: localData.administrador?.nome || '',
      responsavelCargo: 'Administrador',
      responsavelEmail: localData.email || '',
    };
    if (mapped.nomeInstituicao && mapped.cnpj) {
      onChange(mapped);
    }
  };

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const tiposInstituicao = [
    'Fundo de Investimento',
    'Club de Investimento',
    'Previdência Complementar',
    'Seguradora',
    'Banco',
    'Distribuidora',
    'Gestora de Recursos',
    'Outros',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Institucionais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome_instituicao">Nome da Instituição *</Label>
            <Input
              id="nome_instituicao"
              value={localData.nome_instituicao || ''}
              onChange={(e) => handleChange('nome_instituicao', e.target.value)}
              onBlur={handleBlur}
              placeholder="Nome da instituição"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cnpj_inst">CNPJ *</Label>
            <Input
              id="cnpj_inst"
              value={localData.cnpj || ''}
              onChange={(e) => handleChange('cnpj', e.target.value)}
              onBlur={handleBlur}
              placeholder="00.000.000/0000-00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tipo_instituicao">Tipo de Instituição *</Label>
            <select
              id="tipo_instituicao"
              value={localData.tipo_instituicao || ''}
              onChange={(e) => handleChange('tipo_instituicao', e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Selecione</option>
              {tiposInstituicao.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reg_cvm">Registro CVM (se aplicável)</Label>
            <Input
              id="reg_cvm"
              value={localData.reg_cvm || ''}
              onChange={(e) => handleChange('reg_cvm', e.target.value)}
              placeholder="Número de registro na CVM"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email_inst">E-mail *</Label>
            <Input
              id="email_inst"
              type="email"
              value={localData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="instituicao@email.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="telefone_inst">Telefone *</Label>
            <Input
              id="telefone_inst"
              value={localData.telefone || ''}
              onChange={(e) => handleChange('telefone', e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-4">Endereço</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cep_inst">CEP *</Label>
              <Input
                id="cep_inst"
                value={localData.cep || ''}
                onChange={(e) => handleChange('cep', e.target.value)}
                placeholder="00000-000"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endereco_inst">Endereço *</Label>
              <Input
                id="endereco_inst"
                value={localData.endereco || ''}
                onChange={(e) => handleChange('endereco', e.target.value)}
                placeholder="Rua, Avenida, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="numero_inst">Número *</Label>
              <Input
                id="numero_inst"
                value={localData.numero || ''}
                onChange={(e) => handleChange('numero', e.target.value)}
                placeholder="123"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bairro_inst">Bairro *</Label>
              <Input
                id="bairro_inst"
                value={localData.bairro || ''}
                onChange={(e) => handleChange('bairro', e.target.value)}
                placeholder="Bairro"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estado_inst">Estado *</Label>
              <select
                id="estado_inst"
                value={localData.estado || ''}
                onChange={(e) => handleChange('estado', e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Selecione</option>
                {estados.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="cidade_inst">Cidade *</Label>
            <Input
              id="cidade_inst"
              value={localData.cidade || ''}
              onChange={(e) => handleChange('cidade', e.target.value)}
              placeholder="Cidade"
            />
          </div>
        </div>

        {/* Administrador */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-4">Administrador</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adm_nome">Nome *</Label>
              <Input
                id="adm_nome"
                value={localData.administrador?.nome || ''}
                onChange={(e) => handleNestedChange('administrador', 'nome', e.target.value)}
                placeholder="Nome do administrador"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adm_cnpj">CNPJ *</Label>
              <Input
                id="adm_cnpj"
                value={localData.administrador?.cnpj || ''}
                onChange={(e) => handleNestedChange('administrador', 'cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>
        </div>

        {/* Gestor */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-4">Gestor</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gestor_nome">Nome *</Label>
              <Input
                id="gestor_nome"
                value={localData.gestor?.nome || ''}
                onChange={(e) => handleNestedChange('gestor', 'nome', e.target.value)}
                placeholder="Nome do gestor"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gestor_cnpj">CNPJ *</Label>
              <Input
                id="gestor_cnpj"
                value={localData.gestor?.cnpj || ''}
                onChange={(e) => handleNestedChange('gestor', 'cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mandato">Mandato/Regulamento *</Label>
          <textarea
            id="mandato"
            value={localData.mandato || ''}
            onChange={(e) => handleChange('mandato', e.target.value)}
            placeholder="Descreva o mandato ou regulamento da instituição"
            className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
          />
        </div>
      </CardContent>
    </Card>
  );
}
