"""
Script para executar a migração com variáveis de ambiente configuradas
"""
import os

# Configurar variáveis de ambiente
os.environ['SUPABASE_URL'] = 'https://gthtvpujwukbfgokghne.supabase.co'
os.environ['SUPABASE_SERVICE_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0aHR2cHVqd3VrYmZnb2tnaG5lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcwNTgyNiwiZXhwIjoyMDgzMjgxODI2fQ.0iRff96UQuhUVpoUMZ9rLwpk0wQh3LLXnu6gEhVJWlI'

# Importar e executar migração
from migrate_data import executar_migracao

# Executar com limpeza de dados antigos
executar_migracao("../Pipe - Overview (3).xlsx", limpar_antes=True)

print("\n[*] Migracao concluida!")
