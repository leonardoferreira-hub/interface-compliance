# 🚀 Setup - Interface Compliance

Guia completo para configurar e rodar o projeto localmente.

## 📋 Pré-requisitos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- Conta no [Supabase](https://supabase.io) (para backend)

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd interface-compliance
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Edite o arquivo .env.local com suas credenciais
```

**Variáveis necessárias:**

| Variável | Descrição | Onde obter |
|----------|-----------|------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Dashboard Supabase > Settings > API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anon/public | Dashboard Supabase > Settings > API |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto | URL do projeto (primeira parte) |

### 4. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

O aplicativo estará disponível em: `http://localhost:8080`

## 📦 Build para Produção

```bash
# Build otimizado
npm run build

# Preview do build local
npm run preview
```

## 🔍 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build para produção |
| `npm run build:dev` | Build para desenvolvimento |
| `npm run preview` | Preview do build de produção |
| `npm run lint` | Executa ESLint |

## 🛡️ Segurança

⚠️ **IMPORTANTE:**

- Nunca commite o arquivo `.env.local` ou `.env`
- Use sempre `.env.example` como template
- Mantenha as chaves do Supabase seguras

## 📱 PWA (Progressive Web App)

Este projeto inclui capacidades PWA:

- **Manifest.json**: Configuração do app
- **Service Worker**: Cache e offline support
- **Instalação**: Pode ser instalado em dispositivos móveis/desktop

### Para gerar ícones PWA:

```bash
npx pwa-asset-generator logo.png public/ --manifest public/manifest.json
```

## 🏗️ Estrutura do Projeto

```
interface-compliance/
├── public/              # Assets públicos
│   ├── manifest.json    # Config PWA
│   └── sw.js           # Service Worker
├── src/
│   ├── components/      # Componentes React
│   ├── hooks/          # Custom hooks
│   ├── integrations/   # Integrações (Supabase)
│   ├── lib/            # Utilitários
│   ├── pages/          # Páginas
│   └── main.tsx        # Entry point
├── vite.config.ts      # Configuração Vite
└── package.json
```

## 📚 Documentação Adicional

- [Vite](https://vitejs.dev/guide/)
- [React](https://react.dev/)
- [Supabase](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

## 🤝 Suporte

Em caso de dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.
