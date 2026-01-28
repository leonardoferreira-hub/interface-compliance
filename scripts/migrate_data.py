"""
Script de Migração de Dados - Excel para Supabase
Data: 24 de Janeiro de 2026
Descrição: Migra dados da planilha Excel para o schema estruturacao no Supabase
"""

import pandas as pd
from supabase import create_client, Client
from datetime import datetime
import os
import sys

# Configuração do Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] ERRO: Variaveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_KEY nao configuradas!")
    print("\nConfigure-as executando:")
    print("  export SUPABASE_URL='sua_url'")
    print("  export SUPABASE_SERVICE_KEY='sua_chave'")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def carregar_planilha(caminho: str) -> dict:
    """Carrega todas as abas relevantes da planilha."""
    print(f"[*] Carregando planilha: {caminho}")

    try:
        # Tenta carregar diferentes abas
        abas_disponiveis = pd.ExcelFile(caminho).sheet_names
        print(f"   Abas encontradas: {abas_disponiveis}")

        dados = {}

        # Carregar Histórico (operações liquidadas)
        if 'Histórico' in abas_disponiveis:
            dados['historico'] = {
                'df': pd.read_excel(caminho, sheet_name='Histórico'),
                'status_padrao': 'Liquidada'
            }
            print(f"   [OK] Aba 'Historico' carregada com {len(dados['historico']['df'])} linhas (status: Liquidada)")
        else:
            print(f"   [!] Aba 'Historico' nao encontrada")

        # Carregar Pipe (operações em estruturação) - header na linha 6
        if 'Pipe' in abas_disponiveis:
            dados['pipe'] = {
                'df': pd.read_excel(caminho, sheet_name='Pipe', header=6),
                'status_padrao': 'Em Estruturação'
            }
            print(f"   [OK] Aba 'Pipe' carregada com {len(dados['pipe']['df'])} linhas (status: Em Estruturacao)")
        else:
            print(f"   [!] Aba 'Pipe' nao encontrada")

        # Carregar Pendências (operações liquidadas com pendências)
        if 'Pendências' in abas_disponiveis:
            dados['pendencias'] = {
                'df': pd.read_excel(caminho, sheet_name='Pendências'),
                'status_padrao': 'Liquidada'
            }
            print(f"   [OK] Aba 'Pendencias' carregada com {len(dados['pendencias']['df'])} linhas (status: Liquidada)")
        else:
            print(f"   [!] Aba 'Pendencias' nao encontrada")

        return dados
    except Exception as e:
        print(f"[ERROR] Erro ao carregar planilha: {e}")
        sys.exit(1)

def buscar_referencias():
    """Busca IDs das tabelas de referência."""
    print("\n[*] Buscando referencias do banco de dados...")

    try:
        # Buscar categorias
        categorias_res = supabase.table('categorias').select('id, codigo').execute()
        categorias = {r['codigo']: r['id'] for r in categorias_res.data} if categorias_res.data else {}
        print(f"   Categorias: {len(categorias)} encontradas")

        # Buscar veículos
        veiculos_res = supabase.table('veiculos').select('id, sigla').execute()
        veiculos = {r['sigla']: r['id'] for r in veiculos_res.data} if veiculos_res.data else {}
        print(f"   Veículos: {len(veiculos)} encontrados")

        # Buscar usuários
        usuarios_res = supabase.table('user_profiles').select('id, nome').execute()
        usuarios = {r['nome']: r['id'] for r in usuarios_res.data} if usuarios_res.data else {}
        print(f"   Usuários: {len(usuarios)} encontrados")

        # Buscar analistas
        analistas_res = supabase.schema('estruturacao').table('analistas_gestao').select('id, nome').execute()
        analistas = {r['nome']: r['id'] for r in analistas_res.data} if analistas_res.data else {}
        print(f"   Analistas: {len(analistas)} encontrados")

        return categorias, veiculos, usuarios, analistas
    except Exception as e:
        print(f"[ERROR] Erro ao buscar referencias: {e}")
        return {}, {}, {}, {}

def converter_data(valor):
    """Converte diferentes formatos de data para ISO."""
    if pd.isna(valor):
        return None
    if isinstance(valor, datetime):
        return valor.isoformat()
    try:
        return pd.to_datetime(valor).isoformat()
    except:
        return None

def mapear_status(status_planilha: str) -> str:
    """Mapeia status da planilha para o banco."""
    if pd.isna(status_planilha):
        return 'Em Estruturação'

    mapeamento = {
        'Em Estruturação': 'Em Estruturação',
        'Liquidada': 'Liquidada',
        'On hold': 'On Hold',
        'On Hold': 'On Hold',
        'Abortada': 'Abortada',
        'Finalizada': 'Finalizada'
    }
    return mapeamento.get(str(status_planilha), 'Em Estruturação')

def converter_volume(valor):
    """Converte volume para float, tratando textos."""
    if pd.isna(valor):
        return 0

    # Se for número, retornar
    if isinstance(valor, (int, float)):
        return float(valor)

    # Se for texto, tentar converter
    valor_str = str(valor).strip()
    if valor_str in ['Pendente', 'A confirmar', 'Confirmar', 'A definir', '-', '']:
        return 0

    # Tentar converter removendo caracteres especiais
    try:
        valor_limpo = valor_str.replace(',', '').replace('.', '')
        if valor_limpo.isdigit():
            return float(valor_limpo)
        return 0
    except:
        return 0

def migrar_operacao(row, refs, status_padrao='Em Estruturação'):
    """Converte uma linha da planilha para o formato do banco."""
    categorias, veiculos, usuarios, analistas = refs

    # Usar UID ou Emissao como identificador - priorizar Emissão se UID estiver vazio
    uid = row.get('UID')
    if pd.isna(uid) or str(uid).strip() == '' or uid == '':
        uid = row.get('Emissão', row.get('Numero Emissao', ''))

    # Validar se é numero valido
    numero_emissao = ''
    if pd.notna(uid) and str(uid).strip() != '':
        try:
            # Tentar converter para numero
            numero_emissao = str(int(float(uid)))
        except (ValueError, TypeError):
            # Se não for numero, usar como string mesmo
            uid_str = str(uid).strip()
            # Remover caracteres inválidos
            if uid_str not in ['nan', 'NaT', 'None', '1°', '2°', '3°', 'N.A', 'Confirmar', '-']:
                numero_emissao = uid_str

    # Pegar data de entrada - usar data de liquidacao se nao tiver
    data_entrada = converter_data(row.get('Data de Entrada no Pipe', row.get('Data Entrada')))
    if not data_entrada:
        # Se nao tem data de entrada, usar data de liquidacao ou data atual
        data_entrada = converter_data(row.get('Data de Liquidação'))
        if not data_entrada:
            data_entrada = datetime.now().isoformat()

    # Nome da operacao - buscar em diferentes colunas
    nome_op = row.get('Operação', row.get('Nome Operacao', ''))
    if pd.isna(nome_op) or str(nome_op).strip() == '':
        nome_op = f"Operação {numero_emissao}"

    # Status: usar da planilha se existir, senão usar status padrão
    status_row = row.get('Status')
    if pd.notna(status_row) and str(status_row).strip():
        status = mapear_status(status_row)
    else:
        status = status_padrao

    # Mapeamento de colunas
    return {
        'numero_emissao': numero_emissao,
        'nome_operacao': str(nome_op),
        'status': status,
        'pmo_id': usuarios.get(row.get('PMO')),
        'analista_gestao_id': analistas.get(row.get('Analista Gestão', row.get('Analista Gestao'))),
        'categoria_id': categorias.get(row.get('Categoria')),
        'veiculo_id': veiculos.get(row.get('Veículo', row.get('Veiculo'))),
        'volume': converter_volume(row.get('Volume')),
        'empresa_cnpj': str(row.get('CNPJ', '')) if pd.notna(row.get('CNPJ')) else None,
        'empresa_razao_social': str(row.get('Razão Social', row.get('Razao Social', ''))) if pd.notna(row.get('Razão Social', row.get('Razao Social'))) else None,
        'data_entrada_pipe': data_entrada,
        'data_previsao_liquidacao': converter_data(row.get('Previsão de Liquidação', row.get('Previsao Liquidacao'))),
        'data_liquidacao': converter_data(row.get('Data de Liquidação', row.get('Data Liquidacao'))),
        'data_primeira_pagamento': converter_data(row.get('1ª Data de Pagamento', row.get('Primeira Data Pagamento'))),
        'floating': bool(row.get('Floating')) if pd.notna(row.get('Floating')) else False,
        'proximos_passos': str(row.get('Próximos Passos', row.get('Proximos Passos', ''))) if pd.notna(row.get('Próximos Passos', row.get('Proximos Passos'))) else None,
        'alertas': str(row.get('Alertas', '')) if pd.notna(row.get('Alertas')) else None,
        'resumo': str(row.get('Resumo', '')) if pd.notna(row.get('Resumo')) else None,
        'fee_estruturacao': float(row.get('Fee Estruturação', 0)) if pd.notna(row.get('Fee Estruturação')) and str(row.get('Fee Estruturação')).replace('.','').replace(',','').isdigit() else None,
        'fee_gestao': None,  # Ignorar Remuneracao por enquanto (e texto)
        'boletagem': str(row.get('Boletagem', '')) if pd.notna(row.get('Boletagem')) else None,
    }

def limpar_dados_antigos():
    """Remove todos os dados existentes da tabela operacoes."""
    print("\n[*] Limpando dados antigos...")
    try:
        # Deletar todos os registros
        result = supabase.schema('estruturacao').table('operacoes').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        print("[OK] Dados antigos removidos com sucesso")
        return True
    except Exception as e:
        print(f"[!] Aviso: Erro ao limpar dados antigos: {e}")
        print("   Continuando mesmo assim...")
        return False

def executar_migracao(caminho_planilha: str, limpar_antes=True):
    """Executa a migração completa."""
    print("\n" + "="*60)
    print(">> INICIANDO MIGRACAO DE DADOS")
    print("="*60)

    # Limpar dados antigos se solicitado
    if limpar_antes:
        limpar_dados_antigos()

    # Carregar dados
    dados = carregar_planilha(caminho_planilha)

    if not dados:
        print("[ERROR] Nenhuma aba valida encontrada na planilha!")
        return

    # Buscar referências
    refs = buscar_referencias()

    # Contador de sucessos e erros
    total_sucessos = 0
    total_erros = 0

    # Migrar cada aba
    for nome_aba, config in dados.items():
        df = config['df']
        status_padrao = config['status_padrao']

        print(f"\n[*] Processando aba: {nome_aba.upper()}")
        print(f"   Total de linhas: {len(df)}")
        print(f"   Status padrao: {status_padrao}")

        for idx, row in df.iterrows():
            try:
                operacao = migrar_operacao(row, refs, status_padrao)

                # Validar campos obrigatórios
                if not operacao['numero_emissao'] or operacao['numero_emissao'] == 'nan':
                    print(f"   [!] Linha {idx+2}: Pulando (sem numero de emissao)")
                    continue

                # Inserir no Supabase
                result = supabase.schema('estruturacao').table('operacoes').insert(operacao).execute()

                print(f"   [OK] Linha {idx+2}: {operacao['numero_emissao']} - {operacao['nome_operacao']} ({operacao['status']})")
                total_sucessos += 1

            except Exception as e:
                print(f"   [X] Linha {idx+2}: ERRO - {str(e)}")
                total_erros += 1

    # Resumo
    print("\n" + "="*60)
    print(">> RESUMO DA MIGRACAO")
    print("="*60)
    print(f"[OK] Sucessos: {total_sucessos}")
    print(f"[X] Erros: {total_erros}")
    print(f"[*] Total processado: {total_sucessos + total_erros}")
    print("="*60)

if __name__ == "__main__":
    # Caminho da planilha
    caminho = "Pipe - Overview (3).xlsx"

    if not os.path.exists(caminho):
        print(f"[ERROR] Arquivo nao encontrado: {caminho}")
        print(f"   Procurando em: {os.getcwd()}")
        sys.exit(1)

    executar_migracao(caminho)
    print("\n[*] Migracao concluida!")
