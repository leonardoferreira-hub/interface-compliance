"""
Verifica o resultado da migração
"""
import os
from supabase import create_client

os.environ['SUPABASE_URL'] = 'https://gthtvpujwukbfgokghne.supabase.co'
os.environ['SUPABASE_SERVICE_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0aHR2cHVqd3VrYmZnb2tnaG5lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcwNTgyNiwiZXhwIjoyMDgzMjgxODI2fQ.0iRff96UQuhUVpoUMZ9rLwpk0wQh3LLXnu6gEhVJWlI'

supabase = create_client(
    os.environ['SUPABASE_URL'],
    os.environ['SUPABASE_SERVICE_KEY']
)

print("="*70)
print(" RESUMO FINAL DA MIGRACAO")
print("="*70)

# Contar total
result = supabase.schema('estruturacao').table('operacoes').select('id', count='exact').execute()
print(f"\n[*] Total de operacoes migradas: {result.count}")

# Contar por status
print(f"\n[*] Operacoes por status:")
for status in ['Em Estruturação', 'Liquidada', 'On Hold', 'Abortada', 'Finalizada']:
    result = supabase.schema('estruturacao').table('operacoes').select('id', count='exact').eq('status', status).execute()
    if result.count > 0:
        print(f"    {status}: {result.count}")

# Mostrar algumas operações em estruturação
print(f"\n[*] Algumas operacoes EM ESTRUTURACAO:")
result = supabase.schema('estruturacao').table('operacoes').select('numero_emissao, nome_operacao, volume').eq('status', 'Em Estruturação').limit(10).execute()

for op in result.data:
    volume_formatado = f"R$ {op['volume']:,.2f}" if op['volume'] else "N/A"
    print(f"    [{op['numero_emissao']}] {op['nome_operacao']:40s} - {volume_formatado}")

# Mostrar algumas operações liquidadas
print(f"\n[*] Algumas operacoes LIQUIDADAS:")
result = supabase.schema('estruturacao').table('operacoes').select('numero_emissao, nome_operacao, volume').eq('status', 'Liquidada').order('numero_emissao').limit(10).execute()

for op in result.data:
    volume_formatado = f"R$ {op['volume']:,.2f}" if op['volume'] else "N/A"
    print(f"    [{op['numero_emissao']}] {op['nome_operacao']:40s} - {volume_formatado}")

print("\n" + "="*70)
print(" MIGRACAO CONCLUIDA COM SUCESSO!")
print("="*70)
