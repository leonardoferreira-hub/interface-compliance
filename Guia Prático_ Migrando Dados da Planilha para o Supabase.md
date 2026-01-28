# Guia Prático: Migrando Dados da Planilha para o Supabase

**Autor**: Manus AI  
**Data**: 24 de Janeiro de 2026

---

Este guia fornece um passo a passo completo para popular sua base de dados no Supabase com as informações da planilha `Pipe-Overview.xlsx`. O processo utiliza um script Python que automatiza a leitura, transformação e envio dos dados.

## Sumário

1. [Pré-requisitos](#1-pré-requisitos)
2. [Passo 1: Preparar o Ambiente](#2-passo-1-preparar-o-ambiente)
3. [Passo 2: Configurar o Script](#3-passo-2-configurar-o-script)
4. [Passo 3: Executar a Migração](#4-passo-3-executar-a-migração)
5. [Passo 4: Verificação Pós-Migração](#5-passo-4-verificação-pós-migração)
6. [Código Completo do Script](#6-código-completo-do-script)

---

## 1. Pré-requisitos

Antes de começar, garanta que você tem o seguinte instalado em sua máquina:

- **Python 3**: Se não tiver, baixe em [python.org](https://python.org).
- **pip**: Geralmente vem instalado com o Python.

---

## 2. Passo 1: Preparar o Ambiente

Abra o terminal (ou Prompt de Comando/PowerShell no Windows) e instale as bibliotecas Python necessárias com o seguinte comando:

```bash
pip install pandas openpyxl supabase
```

- **pandas**: Para ler e manipular a planilha Excel.
- **openpyxl**: Motor para o pandas ler arquivos `.xlsx`.
- **supabase**: Cliente oficial do Supabase para Python.

---

## 3. Passo 2: Configurar o Script

O script de migração precisa das suas credenciais do Supabase para se conectar ao seu projeto.

### 3.1. Obter as Credenciais do Supabase

1.  Acesse o [Dashboard do Supabase](https://supabase.com/dashboard).
2.  Vá para o seu projeto.
3.  No menu lateral, clique em **Settings** (ícone de engrenagem) > **API**.
4.  Você precisará de duas informações:
    *   **Project URL**: Encontre na seção "Project URL".
    *   **Service Role Key**: Na seção "Project API Keys", encontre a chave `service_role`. **NÃO use a chave `anon`**, pois ela não tem permissão para escrever no banco de dados. Clique em "reveal" para ver a chave completa.

    > **Aviso de Segurança**: A chave `service_role` tem superpoderes. Trate-a como uma senha e nunca a exponha no código do seu frontend ou em um repositório público.

### 3.2. Salvar o Script e Configurar

1.  Salve o código completo do script (disponível na [Seção 6](#6-código-completo-do-script)) em um arquivo chamado `migracao_supabase.py`.
2.  Abra o arquivo `migracao_supabase.py` em um editor de texto.
3.  Localize a seção de **CONFIGURAÇÃO** e substitua o valor de `SUPABASE_SERVICE_KEY` pela chave que você copiou do dashboard:

    ```python
    # ...
    # Credenciais do Supabase (preencha ou use variáveis de ambiente)
    SUPABASE_URL = "https://gthtvpujwukbfgokghne.supabase.co"
    SUPABASE_SERVICE_KEY = "SUA_SERVICE_KEY_AQUI" # <-- COLE SUA CHAVE AQUI
    # ...
    ```

4.  Coloque sua planilha `Pipe-Overview(3).xlsx` no mesmo diretório onde você salvou o script `migracao_supabase.py`.

---

## 4. Passo 3: Executar a Migração

É altamente recomendável executar o script em modo de teste primeiro para garantir que ele está lendo e processando os dados corretamente antes de enviá-los ao banco.

### 4.1. Modo de Teste (Recomendado)

No terminal, navegue até o diretório onde você salvou os arquivos e execute:

```bash
python migracao_supabase.py --teste
```

O script irá:
- Conectar ao Supabase (apenas para verificar a chave).
- Carregar a planilha e mostrar quantas linhas encontrou em cada aba.
- Exibir uma amostra de 3 operações transformadas, mostrando como os dados serão formatados.
- **Não irá inserir nenhum dado no banco.**

Se a saída mostrar "✅ Dados parecem corretos!", você está pronto para a migração real.

### 4.2. Migração Real

Quando estiver pronto para popular o banco de dados, execute o script sem o argumento `--teste`:

```bash
python migracao_supabase.py
```

O script irá:
1.  Conectar ao Supabase.
2.  Carregar e transformar os dados das abas "Histórico" e "Pipe".
3.  Inserir os dados nas tabelas `operacoes` e `pendencias` do schema `estruturacao`.
4.  Exibir um resumo da migração no final.

O processo pode levar alguns segundos, dependendo da quantidade de dados.

---

## 5. Passo 4: Verificação Pós-Migração

Após a conclusão do script, acesse o **Table Editor** no seu Supabase Dashboard e verifique se as tabelas `operacoes` e `pendencias` (dentro do schema `estruturacao`) foram populadas com os dados.

### Tarefas Manuais (Opcional)

O script foi projetado para migrar a maior parte dos dados, mas não lida com o relacionamento de IDs (como `pmo_id`), pois isso exigiria uma lógica mais complexa de busca de usuários. Ele salva os nomes (ex: `pmo_nome`) para referência.

Se precisar, você pode criar um segundo script ou fazer manualmente a atualização dos campos de ID (`pmo_id`, `analista_gestao_id`, etc.) com base nos nomes migrados.

---

## 6. Código Completo do Script

Copie e cole este código no seu arquivo `migracao_supabase.py`.

```python
"""
Script de Migração: Planilha Excel → Supabase
=============================================
Este script migra os dados da planilha Pipe-Overview.xlsx para o Supabase.

Autor: Manus AI
Data: 24/01/2026

INSTRUÇÕES DE USO:
1. Instale as dependências: pip install pandas openpyxl supabase
2. Configure as variáveis de ambiente:
   - SUPABASE_URL: URL do seu projeto Supabase
   - SUPABASE_SERVICE_KEY: Chave de serviço (service_role) do Supabase
3. Coloque a planilha no mesmo diretório do script
4. Execute: python migracao_supabase.py
"""

import pandas as pd
from supabase import create_client, Client
from datetime import datetime
import os
import sys
import uuid

# =====================================================
# CONFIGURAÇÃO
# =====================================================

# Credenciais do Supabase (preencha ou use variáveis de ambiente)
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://gthtvpujwukbfgokghne.supabase.co")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "SUA_SERVICE_KEY_AQUI")

# Caminho da planilha
CAMINHO_PLANILHA = "Pipe-Overview(3).xlsx"

# Schema do Supabase
SCHEMA = "estruturacao"

# =====================================================
# FUNÇÕES AUXILIARES
# =====================================================

def conectar_supabase() -> Client:
    """Conecta ao Supabase e retorna o cliente."""
    if SUPABASE_SERVICE_KEY == "SUA_SERVICE_KEY_AQUI":
        print("❌ ERRO: Configure a SUPABASE_SERVICE_KEY antes de executar!")
        print("   Você pode encontrá-la em: Supabase Dashboard > Settings > API > service_role")
        sys.exit(1)
    
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def converter_data(valor):
    """Converte diferentes formatos de data para ISO 8601."""
    if pd.isna(valor) or valor is None:
        return None
    if isinstance(valor, datetime):
        return valor.strftime("%Y-%m-%d")
    if isinstance(valor, str):
        try:
            return pd.to_datetime(valor).strftime("%Y-%m-%d")
        except:
            return None
    try:
        return pd.to_datetime(valor).strftime("%Y-%m-%d")
    except:
        return None

def converter_numero(valor):
    """Converte valor para número, retornando 0 se inválido."""
    if pd.isna(valor) or valor is None:
        return 0
    if isinstance(valor, (int, float)):
        return float(valor)
    if isinstance(valor, str):
        valor_limpo = valor.replace("R$", "").replace(" ", "").replace(".", "").replace(",", ".")
        try:
            return float(valor_limpo)
        except:
            return 0
    return 0

def normalizar_status(status):
    """Normaliza o status para os valores aceitos pelo banco."""
    if pd.isna(status) or status is None:
        return "Em Estruturação"
    
    status_str = str(status).strip().lower()
    
    mapeamento = {
        "liquidada": "Liquidada",
        "em estruturação": "Em Estruturação",
        "em estruturacao": "Em Estruturação",
        "on hold": "On Hold",
        "abortada": "Abortada",
        "finalizada": "Finalizada"
    }
    
    return mapeamento.get(status_str, "Em Estruturação")

def normalizar_categoria(categoria):
    """Normaliza a categoria removendo espaços extras."""
    if pd.isna(categoria) or categoria is None:
        return None
    return str(categoria).strip().upper()

def normalizar_pendencia(valor):
    """Normaliza valores de pendência para OK, Pendente ou N/A."""
    if pd.isna(valor) or valor is None:
        return "Pendente"
    
    valor_str = str(valor).strip().lower()
    
    if valor_str in ["ok", "sim", "yes", "true", "1"]:
        return "OK"
    elif valor_str in ["n/a", "na", "não aplicável", "não se aplica"]:
        return "N/A"
    else:
        return "Pendente"

def texto_ou_none(valor):
    """Retorna o texto ou None se vazio."""
    if pd.isna(valor) or valor is None:
        return None
    texto = str(valor).strip()
    return texto if texto else None

def bool_ou_false(valor):
    """Converte para boolean."""
    if pd.isna(valor) or valor is None:
        return False
    if isinstance(valor, bool):
        return valor
    valor_str = str(valor).strip().lower()
    return valor_str in ["sim", "yes", "true", "1", "incluir"]

# =====================================================
# FUNÇÕES DE MIGRAÇÃO
# =====================================================

def carregar_planilha(caminho: str) -> dict:
    """Carrega as abas relevantes da planilha."""
    print(f"📂 Carregando planilha: {caminho}")
    
    try:
        xlsx = pd.ExcelFile(caminho)
        
        df_historico = pd.read_excel(xlsx, sheet_name="Histórico")
        print(f"   ✓ Histórico: {len(df_historico)} linhas")
        
        df_pipe = pd.read_excel(xlsx, sheet_name="Pipe", header=6)
        df_pipe.columns = df_historico.columns[:len(df_pipe.columns)]
        df_pipe = df_pipe[df_pipe["PMO"].notna()]
        print(f"   ✓ Pipe: {len(df_pipe)} linhas")
        
        df_pendencias = pd.read_excel(xlsx, sheet_name="Pendências")
        df_pendencias = df_pendencias[df_pendencias["PMO"].notna()]
        print(f"   ✓ Pendências: {len(df_pendencias)} linhas")
        
        return {
            "historico": df_historico,
            "pipe": df_pipe,
            "pendencias": df_pendencias
        }
    except Exception as e:
        print(f"❌ Erro ao carregar planilha: {e}")
        sys.exit(1)

def transformar_operacao(row, origem="historico") -> dict:
    """Transforma uma linha da planilha em um registro de operação."""
    
    operacao_id = str(uuid.uuid4())
    
    if origem == "historico":
        status = normalizar_status(row.get("Status", "Liquidada"))
        if status == "Em Estruturação":
            status = "Liquidada"
    else:
        status = normalizar_status(row.get("Status", "Em Estruturação"))
    
    return {
        "id": operacao_id,
        "numero_emissao": texto_ou_none(row.get("Emissão")),
        "nome_operacao": texto_ou_none(row.get("Operação")) or "Sem nome",
        "status": status,
        "categoria": normalizar_categoria(row.get("Categoria")),
        "veiculo": texto_ou_none(row.get("Veículo")),
        "volume": converter_numero(row.get("Volume")),
        "fee_estruturacao": converter_numero(row.get("Estruturação")),
        "fee_gestao": converter_numero(row.get("Gestão")),
        "fee_originacao": converter_numero(row.get("Originação")),
        "lastro": texto_ou_none(row.get("Lastro")),
        "tipo_operacao": texto_ou_none(row.get("Tipo Operação")),
        "boletagem": texto_ou_none(row.get("Boletagem")),
        "banco": texto_ou_none(row.get("Banco")),
        "agencia": texto_ou_none(row.get("Agência")),
        "conta_bancaria": texto_ou_none(row.get("Conta Bancária")),
        "data_entrada_pipe": converter_data(row.get("Data de Entrada no Pipe")),
        "data_previsao_liquidacao": converter_data(row.get("Previsão de Liquidação")),
        "data_liquidacao": converter_data(row.get("Data de Liquidação")),
        "data_primeira_pagamento": converter_data(row.get("1ª Data de Pagamento")),
        "floating": bool_ou_false(row.get("Floating")),
        "proximos_passos": texto_ou_none(row.get("Próximos Passos")),
        "alertas": texto_ou_none(row.get("Alertas")),
        "resumo": texto_ou_none(row.get("Resumo")),
        "status_tech": texto_ou_none(row.get("Tech")),
        "investidores_obs": texto_ou_none(row.get("Investidores")),
        "pmo_nome": texto_ou_none(row.get("PMO")),
        "analista_gestao_nome": texto_ou_none(row.get("Analista Gestão")),
        "analista_financeiro_nome": texto_ou_none(row.get("Analista Financeiro")),
        "analista_contabil_nome": texto_ou_none(row.get("Analista Contábil")),
        "series_info": texto_ou_none(row.get("Séries")),
        "compliance_status": texto_ou_none(row.get("Compliance")),
        "remuneracao": texto_ou_none(row.get("Remuneração")),
    }

def transformar_pendencia(row, operacao_id: str) -> dict:
    """Transforma campos de pendência em um registro."""
    return {
        "operacao_id": operacao_id,
        "mapa_liquidacao": normalizar_pendencia(row.get("Mapa de Liquidação")),
        "mapa_registros": normalizar_pendencia(row.get("Mapa de Registros")),
        "lo": normalizar_pendencia(row.get("LO ")),
        "dd": normalizar_pendencia(row.get("DD")),
        "envio_email_prestadores": normalizar_pendencia(row.get("Envio e-mail prestadores")),
        "passagem_bastao": normalizar_pendencia(row.get("Passagem de Bastão")),
        "kick_off": normalizar_pendencia(row.get("Kick off")),
    }

def verificar_pendencias_resolvidas(pendencia: dict) -> bool:
    """Verifica se todas as pendências estão resolvidas (OK ou N/A)."""
    campos = ["mapa_liquidacao", "mapa_registros", "lo", "dd", 
              "envio_email_prestadores", "passagem_bastao", "kick_off"]
    
    for campo in campos:
        if pendencia.get(campo) == "Pendente":
            return False
    return True

# =====================================================
# EXECUÇÃO PRINCIPAL
# =====================================================

def executar_migracao():
    """Executa a migração completa."""
    
    print("\n" + "="*60)
    print("🚀 MIGRAÇÃO: Planilha Excel → Supabase")
    print("="*60 + "\n")
    
    print("1️⃣  Conectando ao Supabase...")
    supabase = conectar_supabase()
    print("   ✓ Conectado!\n")
    
    print("2️⃣  Carregando planilha...")
    dados = carregar_planilha(CAMINHO_PLANILHA)
    print()
    
    print("3️⃣  Transformando dados...")
    
    operacoes = []
    pendencias = []
    
    for _, row in dados["historico"].iterrows():
        op = transformar_operacao(row, origem="historico")
        operacoes.append(op)
        
        pend = transformar_pendencia(row, op["id"])
        pend["todas_resolvidas"] = verificar_pendencias_resolvidas(pend)
        pendencias.append(pend)
    
    for _, row in dados["pipe"].iterrows():
        op = transformar_operacao(row, origem="pipe")
        operacoes.append(op)
        
        pend = transformar_pendencia(row, op["id"])
        pend["todas_resolvidas"] = verificar_pendencias_resolvidas(pend)
        pendencias.append(pend)
    
    print(f"   ✓ {len(operacoes)} operações preparadas")
    print(f"   ✓ {len(pendencias)} registros de pendência preparados\n")
    
    print("4️⃣  Inserindo dados no Supabase...")
    
    lote_size = 50
    sucesso_ops = 0
    erro_ops = 0
    
    for i in range(0, len(operacoes), lote_size):
        lote = operacoes[i:i+lote_size]
        try:
            lote_limpo = []
            for op in lote:
                op_limpo = {
                    "id": op["id"],
                    "numero_emissao": op["numero_emissao"],
                    "nome_operacao": op["nome_operacao"],
                    "status": op["status"],
                    "volume": op["volume"],
                    "floating": op["floating"],
                    "proximos_passos": op["proximos_passos"],
                    "alertas": op["alertas"],
                    "resumo": op["resumo"],
                    "data_entrada_pipe": op["data_entrada_pipe"],
                    "data_previsao_liquidacao": op["data_previsao_liquidacao"],
                    "data_liquidacao": op["data_liquidacao"],
                }
                lote_limpo.append(op_limpo)
            
            response = supabase.schema(SCHEMA).table("operacoes").insert(lote_limpo).execute()
            sucesso_ops += len(lote)
            print(f"   ✓ Lote {i//lote_size + 1}: {len(lote)} operações inseridas")
        except Exception as e:
            erro_ops += len(lote)
            print(f"   ❌ Lote {i//lote_size + 1}: Erro - {str(e)[:100]}")
    
    print(f"\n   Operações: {sucesso_ops} sucesso, {erro_ops} erros")
    
    sucesso_pend = 0
    erro_pend = 0
    
    for i in range(0, len(pendencias), lote_size):
        lote = pendencias[i:i+lote_size]
        try:
            response = supabase.schema(SCHEMA).table("pendencias").insert(lote).execute()
            sucesso_pend += len(lote)
        except Exception as e:
            erro_pend += len(lote)
            print(f"   ❌ Pendências lote {i//lote_size + 1}: Erro - {str(e)[:100]}")
    
    print(f"   Pendências: {sucesso_pend} sucesso, {erro_pend} erros")
    
    print("\n" + "="*60)
    print("✅ MIGRAÇÃO CONCLUÍDA!")
    print("="*60)
    print(f"\n📊 Resumo:")
    print(f"   • Operações migradas: {sucesso_ops}")
    print(f"   • Pendências migradas: {sucesso_pend}")
    print(f"   • Erros: {erro_ops + erro_pend}")
    print("\n💡 Próximos passos:")
    print("   1. Verifique os dados no Supabase Dashboard")
    print("   2. Ajuste os IDs de PMO e Analistas manualmente")
    print("   3. Execute os triggers de hierarquia se necessário")
    print()

# =====================================================
# MODO DE TESTE (sem inserir no banco)
# =====================================================

def modo_teste():
    """Executa em modo de teste, apenas mostrando os dados que seriam inseridos."""
    
    print("\n" + "="*60)
    print("🧪 MODO DE TESTE: Verificando dados")
    print("="*60 + "\n")
    
    dados = carregar_planilha(CAMINHO_PLANILHA)
    
    print("\n📋 Amostra de operações que seriam inseridas:\n")
    
    for i, (_, row) in enumerate(dados["historico"].head(3).iterrows()):
        op = transformar_operacao(row, origem="historico")
        print(f"Operação {i+1}:")
        print(f"  Nome: {op["nome_operacao"]}")
        print(f"  Status: {op["status"]}")
        print(f"  Categoria: {op["categoria"]}")
        print(f"  Volume: R$ {op["volume"]:,.2f}")
        print(f"  PMO: {op["pmo_nome"]}")
        print()
    
    print("✅ Dados parecem corretos! Execute sem --teste para migrar.")

# =====================================================
# PONTO DE ENTRADA
# =====================================================

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--teste":
        modo_teste()
    else:
        executar_migracao()
```
