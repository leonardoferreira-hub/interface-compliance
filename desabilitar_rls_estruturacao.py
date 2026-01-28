"""
Desabilita RLS nas tabelas do schema estruturacao para permitir acesso publico
"""
import requests

ACCESS_TOKEN = "sbp_c0b6c9d4e14753e23e1014fe001bef2c859acd60"
PROJECT_REF = "gthtvpujwukbfgokghne"

sql = """
-- Desabilitar RLS em todas as tabelas do schema estruturacao
ALTER TABLE estruturacao.operacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE estruturacao.pendencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE estruturacao.compliance_checks DISABLE ROW LEVEL SECURITY;
ALTER TABLE estruturacao.analistas_gestao DISABLE ROW LEVEL SECURITY;
ALTER TABLE estruturacao.hierarquia_analistas DISABLE ROW LEVEL SECURITY;
"""

print("="*70)
print(" DESABILITANDO RLS NO SCHEMA ESTRUTURACAO")
print("="*70)
print("\n[*] Executando SQL...")

url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

payload = {"query": sql}

response = requests.post(url, headers=headers, json=payload, timeout=30)

if response.status_code in [200, 201]:
    print("[OK] RLS desabilitado com sucesso!")
else:
    print(f"[ERROR] Erro: {response.status_code}")
    print(f"        {response.text}")
    exit(1)

# Testar acesso
print("\n[*] Testando acesso com ANON key...")
from supabase import create_client

SUPABASE_URL = 'https://gthtvpujwukbfgokghne.supabase.co'
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0aHR2cHVqd3VrYmZnb2tnaG5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDU4MjYsImV4cCI6MjA4MzI4MTgyNn0.viQaLgE8Kk32DCtEAUEglxCR8bwBwhrIqAh_JIfdxv4'

supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

result = supabase.schema('estruturacao').table('operacoes').select('id', count='exact').limit(1).execute()

print(f"[OK] Agora conseguimos acessar! Total de operacoes: {result.count}")

print("\n" + "="*70)
print(" SUCESSO! Frontend agora consegue acessar os dados!")
print("="*70)
