"""
Teste de conexão do frontend com Supabase
"""
import os
from supabase import create_client

# Usar a ANON key (mesma que o frontend usa)
SUPABASE_URL = 'https://gthtvpujwukbfgokghne.supabase.co'
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0aHR2cHVqd3VrYmZnb2tnaG5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDU4MjYsImV4cCI6MjA4MzI4MTgyNn0.viQaLgE8Kk32DCtEAUEglxCR8bwBwhrIqAh_JIfdxv4'

print("="*70)
print(" TESTE DE CONEXAO - ANON KEY (mesma que frontend)")
print("="*70)

supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Teste 1: Tabelas públicas
print("\n[Test 1] Buscando categorias (tabela publica)...")
try:
    result = supabase.table('categorias').select('*').limit(3).execute()
    print(f"[OK] Encontradas {len(result.data)} categorias")
    for cat in result.data:
        print(f"   - {cat.get('nome')} (id: {cat.get('id')})")
except Exception as e:
    print(f"[ERROR] {e}")

# Teste 2: Schema estruturacao com ANON key
print("\n[Test 2] Buscando operacoes do schema estruturacao...")
try:
    result = supabase.schema('estruturacao').table('operacoes').select('*').limit(5).execute()
    print(f"[OK] Encontradas {len(result.data)} operacoes")
    for op in result.data:
        print(f"   - [{op.get('numero_emissao')}] {op.get('nome_operacao')} - {op.get('status')}")
except Exception as e:
    print(f"[ERROR] {e}")
    print("\n[!] PROBLEMA: ANON key nao tem acesso ao schema estruturacao!")
    print("    Solucao: Verificar RLS policies ou usar service_role key")

# Teste 3: Contar operações em estruturação
print("\n[Test 3] Contando operacoes em estruturacao...")
try:
    result = supabase.schema('estruturacao').table('operacoes').select('id', count='exact').eq('status', 'Em Estruturação').execute()
    print(f"[OK] Total de operacoes em estruturacao: {result.count}")
except Exception as e:
    print(f"[ERROR] {e}")

print("\n" + "="*70)
print(" CONCLUSAO")
print("="*70)
print("\nSe o Test 2 falhou, o problema e que a ANON key nao tem permissao")
print("para acessar o schema estruturacao. Precisamos:")
print("1. Desabilitar RLS nas tabelas, OU")
print("2. Criar policies para permitir acesso publico (anon), OU")
print("3. Usar autenticacao no frontend")
