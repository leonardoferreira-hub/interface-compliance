"""
Script de Verificação da Planilha Excel
Verifica as abas e colunas antes de executar a migração
"""

import pandas as pd
import sys
import os

def verificar_planilha(caminho: str):
    """Verifica estrutura da planilha."""
    print("=" * 60)
    print("🔍 VERIFICAÇÃO DA PLANILHA EXCEL")
    print("=" * 60)

    if not os.path.exists(caminho):
        print(f"❌ Arquivo não encontrado: {caminho}")
        return False

    print(f"📂 Arquivo: {caminho}")
    print(f"📏 Tamanho: {os.path.getsize(caminho) / 1024:.2f} KB\n")

    try:
        # Listar todas as abas
        excel_file = pd.ExcelFile(caminho)
        print(f"📑 Abas encontradas ({len(excel_file.sheet_names)}):")
        for aba in excel_file.sheet_names:
            print(f"   • {aba}")

        print("\n" + "-" * 60)

        # Analisar cada aba
        for nome_aba in excel_file.sheet_names:
            df = pd.read_excel(caminho, sheet_name=nome_aba)

            print(f"\n📊 ABA: {nome_aba}")
            print(f"   Linhas: {len(df)}")
            print(f"   Colunas: {len(df.columns)}")
            print(f"\n   Nomes das colunas:")

            for i, col in enumerate(df.columns, 1):
                # Contar valores não nulos
                nao_nulos = df[col].notna().sum()
                porcentagem = (nao_nulos / len(df) * 100) if len(df) > 0 else 0

                print(f"   {i:2d}. {col:40s} | {nao_nulos:4d}/{len(df):4d} ({porcentagem:5.1f}%)")

            # Mostrar primeiras 3 linhas como exemplo
            print(f"\n   📝 Primeiras 3 linhas (exemplo):")
            print(df.head(3).to_string(index=False))
            print("\n" + "-" * 60)

        print("\n✅ Verificação concluída!")
        return True

    except Exception as e:
        print(f"❌ Erro ao verificar planilha: {e}")
        return False

if __name__ == "__main__":
    caminho = "Pipe - Overview (3).xlsx"

    if len(sys.argv) > 1:
        caminho = sys.argv[1]

    verificar_planilha(caminho)
