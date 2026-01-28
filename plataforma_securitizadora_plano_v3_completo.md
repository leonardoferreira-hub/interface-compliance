# Plano de Ação: Migração e Evolução da Plataforma de Gestão de Securitização

**Autor**: Manus AI  
**Data**: 24 de Janeiro de 2026  
**Versão**: 3.0 (Atualizada com Correções de UI e Prompt para Skill)

---

## Sumário

1. [Introdução e Contexto](#1-introdução-e-contexto)
2. [Análise do Sistema Atual e Proposta de Evolução](#2-análise-do-sistema-atual-e-proposta-de-evolução)
3. [Correção Urgente: Dark Mode e ThemeProvider](#3-correção-urgente-dark-mode-e-themeprovider)
4. [Prompt para Evolução da UI (Skill: frontend-design)](#4-prompt-para-evolução-da-ui-skill-frontend-design)
5. [Diretrizes de Design e Experiência do Usuário](#5-diretrizes-de-design-e-experiência-do-usuário-uxui)
6. [Arquitetura da Base de Dados](#6-arquitetura-da-base-de-dados)
7. [Scripts SQL para Criação das Tabelas](#7-scripts-sql-para-criação-das-tabelas)
8. [Migração de Dados](#8-migração-de-dados)
9. [Sistema de Autenticação e Perfis](#9-sistema-de-autenticação-e-perfis)
10. [Automação de E-mails](#10-automação-de-e-mails)
11. [Estrutura do Frontend](#11-estrutura-do-frontend)
12. [Cronograma de Implementação](#12-cronograma-de-implementação)
13. [Próximos Passos](#13-próximos-passos)
14. [Referências](#14-referências)

---

## 1. Introdução e Contexto

Este documento detalha o plano de ação completo para migrar e evoluir o controle de operações de securitização, atualmente em uma planilha Google Sheets e uma aplicação Lovable básica, para uma plataforma web robusta, intuitiva e moderna. A nova plataforma utilizará **React** com **TypeScript** no frontend, **Supabase** como backend, e será enriquecida com um design system baseado em **shadcn/ui** e animações fluidas com **Framer Motion**.

O objetivo é criar um sistema que não apenas replique e aprimore as funcionalidades atuais, mas que também ofereça uma experiência de usuário superior, com maior controle, segurança, e eficiência para as equipes de estruturação e gestão.

### 1.1. Escopo do Projeto

O projeto abrange a migração e desenvolvimento das seguintes funcionalidades:

| Funcionalidade | Origem (Sheets/Lovable) | Destino (Plataforma 2.0) |
|:---|:---|:---|
| Pipeline de operações | Aba "Pipe" / Página "Emissões" | Página "Pipeline" com tabela avançada |
| Histórico de operações | Aba "Histórico" / Página "Histórico" | Página "Histórico" com filtros e busca |
| Controle de pendências | Aba "Pendências" / Página "Pendências" | Página "Pendências" com layout Kanban |
| Verificação de compliance | Aba "Compliance" | Workflow visual integrado na operação |
| Atribuição de analistas | Portal do Gestor / Dropdowns | Sistema de login com perfis e modais |
| Envio automático de e-mails | Apps Script | Supabase Edge Functions com Resend |
| Auditoria de alterações | Não existente | Audit Log completo e visualizável |
| Design System e UX | Básico (Lovable) | Moderno, com Dark Mode e animações |

### 1.2. Integrações Existentes

A plataforma se integrará com o sistema comercial já existente no mesmo projeto Supabase:

| Sistema | Schema Supabase | Tabelas Principais | Função |
|:---|:---|:---|:---|
| Calculadora Comercial | `public` e `base_custos` | `emissoes`, `series`, `custos_*` | Fonte de novas operações aceitas |
| Interface de Estruturação | `estruturacao` | `operacoes`, `pendencias`, etc. | Gestão do pipeline |
| Autenticação | `auth` (Supabase Auth) | `users` | Login e controle de acesso |

---

## 2. Análise do Sistema Atual e Proposta de Evolução

A análise da aplicação Lovable e do repositório GitHub revela uma base sólida, porém com espaço para melhorias significativas em design, funcionalidade e experiência do usuário.

### 2.1. Estrutura Atual do Repositório

A aplicação atual está organizada da seguinte forma:

```
src/
├── components/
│   ├── emissoes/          # Componentes específicos de emissões
│   ├── estruturacao/      # Componentes de estruturação
│   ├── layout/            # Componentes de layout (Header, etc.)
│   ├── pendencias/        # Componentes de pendências
│   ├── ui/                # Componentes shadcn/ui (50+ componentes)
│   └── NavLink.tsx        # Componente de navegação
├── hooks/                 # Custom hooks
├── integrations/supabase/ # Configuração e queries Supabase
├── lib/                   # Utilitários
├── pages/                 # Páginas da aplicação
├── types/                 # Definições TypeScript
└── utils/                 # Funções auxiliares
```

### 2.2. O que Será Mantido

A tabela abaixo resume os elementos que serão preservados da implementação atual:

| Elemento | Justificativa |
|:---|:---|
| **Stack Tecnológica** (Vite, React, TypeScript, TailwindCSS, Supabase) | Base moderna e performática |
| **Estrutura de Componentes** por funcionalidade | Boa organização e separação de responsabilidades |
| **Biblioteca shadcn/ui** | Componentes acessíveis e customizáveis |
| **Integração com Supabase** | Conexão existente e queries básicas funcionais |
| **Estrutura de Abas no Modal** (Visão Geral, Séries, Despesas, etc.) | Organização lógica das informações |

### 2.3. O que Será Alterado e Melhorado

| Componente/Página | Situação Atual | Proposta de Melhoria |
|:---|:---|:---|
| **Tabela de Emissões** | Tabela simples, sem ordenação, filtros ou paginação | Substituir por `DataTable` avançado com `tanstack/react-table`, filtros por coluna, busca global, ordenação, paginação e `StatusBadge` coloridos |
| **Modal de Detalhes** | Sheet lateral com campos básicos | Enriquecer com animações de entrada/saída, substituir dropdowns por `Combobox` com busca, adicionar `DatePicker` e `CurrencyInput` |
| **Página de Pendências** | Layout Kanban estático sem conteúdo | Implementar Kanban funcional com drag-and-drop (`dnd-kit`), cards detalhados e filtros |
| **Página de Histórico** | Tabela vazia sem funcionalidades | Popular com dados migrados, implementar filtros avançados por data, tipo e status |
| **Dashboard** | Gráficos com bugs (mostrando UUIDs) | Corrigir queries, adicionar métricas relevantes, usar `Recharts` com animações e tooltips |
| **Navegação** | Header simples com links | Adicionar indicador de página ativa e transições suaves |
| **Cores de Status** | Sem indicadores visuais | Implementar badges coloridos por status (verde/amarelo/vermelho) |

### 2.4. O que Será Criado do Zero

| Funcionalidade | Descrição |
|:---|:---|
| **Sistema de Autenticação Completo** | Telas de Login e fluxo de criação de usuários pelo Admin |
| **Controle de Acesso por Perfil (RLS)** | Políticas de segurança no Supabase para cada perfil |
| **Página de Gestão** | Interface para gestores atribuírem analistas |
| **Página de Administração** | Interface para admins gerenciarem usuários e configurações |
| **Workflow Visual de Compliance** | Componente interativo para verificação de documentos |
| **Audit Log** | Tabela e interface para visualizar histórico de mudanças |
| **Dark Mode Funcional** | Tema escuro em toda a aplicação com toggle correto |
| **Animações e Micro-interações** | Feedback visual e transições fluidas |

---

## 3. Correção Urgente: Dark Mode e ThemeProvider

Após a implementação inicial, a interface apresentou um problema crítico: o **"dark mode eterno"**. A interface ficou travada em modo escuro, sem possibilidade de alternar para o modo claro. Esta seção detalha a causa raiz e o passo a passo para correção.

### 3.1. Diagnóstico do Problema

O problema se deve à implementação incorreta do gerenciamento de tema. O hook `use-theme.ts` customizado foi criado, mas não foi integrado corretamente no nível raiz da aplicação através de um `Context Provider`. Além disso, o valor padrão do tema estava configurado como `"system"`, o que fazia a aplicação herdar o tema do sistema operacional do usuário.

**Arquivos Problemáticos:**
- `src/hooks/use-theme.ts` - Hook customizado sem Context Provider
- `src/main.tsx` - Não envolve a aplicação com o ThemeProvider

### 3.2. Passo a Passo para Correção

**Passo 1: Criar o `ThemeProvider` Correto**

Crie um novo arquivo em `src/components/theme-provider.tsx`. Este componente será o único responsável por gerenciar o estado do tema em toda a aplicação.

```tsx
// src/components/theme-provider.tsx
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "light", // IMPORTANTE: Padrão é "light", não "system"
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
```

**Passo 2: Remover o Hook Antigo**

Delete o arquivo `src/hooks/use-theme.ts`. O novo `useTheme` está agora dentro do `theme-provider.tsx`.

**Passo 3: Envolver a Aplicação com o Provider**

Modifique o arquivo `src/main.tsx` para envolver o componente `<App />` com o `<ThemeProvider />`.

```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from "./components/theme-provider"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
```

**Passo 4: Atualizar o `theme-toggle.tsx`**

Atualize o componente de toggle para usar o hook do novo provider. A importação deve mudar de `@/hooks/use-theme` para `@/components/theme-provider`.

```tsx
// src/components/layout/theme-toggle.tsx
import { Moon, Sun } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider" // IMPORTAÇÃO ATUALIZADA

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  // Determina o tema efetivo (para quando theme === "system")
  const effectiveTheme = theme === "system" 
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(effectiveTheme === "light" ? "dark" : "light")}
      className="relative"
      aria-label="Alternar tema"
    >
      <motion.div
        initial={false}
        animate={{
          scale: effectiveTheme === "light" ? 1 : 0,
          opacity: effectiveTheme === "light" ? 1 : 0,
          rotate: effectiveTheme === "light" ? 0 : 180,
        }}
        transition={{ duration: 0.2 }}
        className="absolute"
      >
        <Sun className="h-5 w-5" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{
          scale: effectiveTheme === "dark" ? 1 : 0,
          opacity: effectiveTheme === "dark" ? 1 : 0,
          rotate: effectiveTheme === "dark" ? 0 : -180,
        }}
        transition={{ duration: 0.2 }}
        className="absolute"
      >
        <Moon className="h-5 w-5" />
      </motion.div>
      <span className="sr-only">Alternar tema</span>
    </Button>
  )
}
```

**Passo 5: Verificar `tailwind.config.ts`**

Garanta que a configuração do dark mode está correta no arquivo `tailwind.config.ts`.

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"], // Esta linha é CRUCIAL
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  // ... restante da configuração
} satisfies Config

export default config
```

**Passo 6: Verificar `index.css`**

O arquivo `index.css` já contém as variáveis CSS para ambos os temas (`:root` para light e `.dark` para dark). Verifique se as variáveis estão definidas corretamente. Se necessário, ajuste as cores conforme a paleta definida na Seção 5.

### 3.3. Teste de Verificação

Após aplicar as correções:

1. Limpe o `localStorage` do navegador (ou abra em aba anônima)
2. Recarregue a aplicação
3. A aplicação deve iniciar em **Light Mode** (fundo claro)
4. Clique no botão de toggle de tema no header
5. A aplicação deve alternar para **Dark Mode** (fundo escuro)
6. Recarregue a página - o tema escolhido deve persistir

---

## 4. Prompt para Evolução da UI (Skill: frontend-design)

Para transformar a interface de um sistema funcional para uma experiência memorável e esteticamente agradável, utilize o prompt a seguir. Ele foi desenhado para ser usado por um assistente de IA (como o Claude) que tenha acesso à skill `frontend-design`.

### 4.1. Contexto da Skill

A skill `frontend-design` guia a criação de interfaces frontend distintivas e de qualidade de produção, evitando a estética genérica de "AI slop". Ela enfatiza:

- **Tipografia**: Fontes únicas e interessantes, evitando genéricas como Arial e Inter
- **Cores e Tema**: Paleta coesa com cores dominantes e acentos marcantes
- **Animações**: Micro-interações e efeitos de scroll que surpreendem
- **Composição Espacial**: Layouts inesperados, assimetria, sobreposição
- **Detalhes Visuais**: Texturas, gradientes, sombras dramáticas, bordas decorativas

### 4.2. Prompt Completo para Refatoração da UI

Copie e cole o prompt abaixo em uma conversa com o Claude (ou outro assistente com acesso à skill):

---

> **PROMPT PARA O ASSISTENTE DE IA:**
> 
> Assistente, utilize a skill `frontend-design` para refatorar a interface da nossa plataforma de gestão de securitização. O objetivo é criar uma identidade visual única e sofisticada, abandonando a estética padrão do `shadcn/ui`.
> 
> ---
> 
> ## Contexto do Projeto
> 
> Esta é uma plataforma de gestão de operações de securitização para uma empresa financeira. Os usuários são analistas e gestores que precisam visualizar, filtrar e editar operações em um pipeline. A plataforma deve transmitir **confiança**, **seriedade** e **eficiência**.
> 
> **Stack Tecnológica:**
> - React 18 + TypeScript
> - Vite
> - TailwindCSS
> - shadcn/ui (base de componentes)
> - Framer Motion (animações)
> - Supabase (backend)
> 
> ---
> 
> ## Direção Estética
> 
> Adote um tom **"Brutalista Refinado"** (Refined Brutalism). Pense na solidez e honestidade do brutalismo arquitetônico (estruturas claras, materiais crus, funcionalidade exposta), mas com a elegância e precisão de uma aplicação financeira de ponta.
> 
> **Características-chave:**
> - Linhas retas e ângulos definidos
> - Tipografia forte e hierárquica
> - Espaçamento generoso e intencional
> - Bordas finas em vez de sombras
> - Cores neutras com acentos precisos
> - Densidade de informação controlada
> 
> ---
> 
> ## Diretrizes de Implementação
> 
> ### 1. Tipografia
> 
> - **Display/Títulos**: Utilize a fonte **"DM Serif Display"** (Google Fonts) para títulos de página, métricas importantes e números grandes. Sua serifa forte transmite autoridade.
> - **Corpo/UI**: Utilize a fonte **"Geist"** ou **"Satoshi"** (ambas disponíveis gratuitamente) para o corpo do texto e elementos de interface. São modernas, legíveis e menos genéricas que Inter.
> 
> **Implementação:**
> ```css
> @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap');
> 
> :root {
>   --font-display: 'DM Serif Display', serif;
>   --font-body: 'Geist', system-ui, sans-serif;
> }
> ```
> 
> ### 2. Paleta de Cores
> 
> **Light Mode:**
> | Elemento | Cor | Hex |
> |:---|:---|:---|
> | Background | Slate 50 | #F8FAFC |
> | Card | White | #FFFFFF |
> | Texto Principal | Slate 900 | #0F172A |
> | Texto Secundário | Slate 500 | #64748B |
> | Borda | Slate 200 | #E2E8F0 |
> | Primária (Acento) | Blue 600 | #2563EB |
> 
> **Dark Mode:**
> | Elemento | Cor | Hex |
> |:---|:---|:---|
> | Background | Slate 950 | #020617 |
> | Card | Slate 900 | #0F172A |
> | Texto Principal | Slate 50 | #F8FAFC |
> | Texto Secundário | Slate 400 | #94A3B8 |
> | Borda | Slate 800 | #1E293B |
> | Primária (Acento) | Blue 400 | #60A5FA |
> 
> **Cores de Status:**
> - Sucesso: `emerald-500` (#10B981)
> - Alerta: `amber-500` (#F59E0B)
> - Erro: `rose-500` (#F43F5E)
> - Info: `sky-500` (#0EA5E9)
> 
> ### 3. Layout e Composição
> 
> **Página Principal (Pipeline):**
> - Substitua os 3 cards de métricas no topo por uma **barra de status horizontal** mais densa e informativa
> - A tabela de dados deve ser o elemento central, ocupando o máximo de espaço vertical
> - Use bordas finas (`border-slate-200` / `dark:border-slate-800`) em vez de sombras para delimitar componentes
> - Adicione uma **linha de destaque** (2px, cor primária) no topo do header para criar identidade visual
> 
> **Tabela de Dados:**
> - Header da tabela com fundo levemente diferente (`slate-100` / `dark:slate-800`)
> - Linhas alternadas sutis (`slate-50` / `white` em light mode)
> - Hover com transição suave para `slate-100` / `dark:slate-800`
> - Badges de status com cantos retos (não arredondados) para reforçar a estética brutalista
> 
> ### 4. Animações (Framer Motion)
> 
> **Carregamento da Tabela:**
> ```tsx
> const containerVariants = {
>   hidden: { opacity: 0 },
>   visible: {
>     opacity: 1,
>     transition: {
>       staggerChildren: 0.03, // Delay sutil entre linhas
>     },
>   },
> };
> 
> const rowVariants = {
>   hidden: { opacity: 0, y: 10 },
>   visible: { opacity: 1, y: 0 },
> };
> ```
> 
> **Hover na Tabela:**
> ```tsx
> <motion.tr
>   whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
>   transition={{ duration: 0.15 }}
> >
> ```
> 
> **Abertura do Sheet de Detalhes:**
> ```tsx
> <Sheet>
>   <SheetContent>
>     <motion.div
>       initial={{ opacity: 0, x: 50 }}
>       animate={{ opacity: 1, x: 0 }}
>       exit={{ opacity: 0, x: 50 }}
>       transition={{ type: "spring", damping: 25, stiffness: 300 }}
>     >
>       {/* Conteúdo */}
>     </motion.div>
>   </SheetContent>
> </Sheet>
> ```
> 
> ### 5. Componentes Específicos
> 
> **StatusBadge (Brutalista):**
> ```tsx
> const StatusBadge = ({ status }: { status: string }) => {
>   const config = {
>     "Em Estruturação": { bg: "bg-sky-100 dark:bg-sky-900/50", text: "text-sky-700 dark:text-sky-300", border: "border-sky-300 dark:border-sky-700" },
>     "Liquidada": { bg: "bg-emerald-100 dark:bg-emerald-900/50", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-700" },
>     "On Hold": { bg: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-700 dark:text-amber-300", border: "border-amber-300 dark:border-amber-700" },
>     "Abortada": { bg: "bg-rose-100 dark:bg-rose-900/50", text: "text-rose-700 dark:text-rose-300", border: "border-rose-300 dark:border-rose-700" },
>   }[status] || { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" };
> 
>   return (
>     <span className={`
>       inline-flex items-center px-2.5 py-0.5 
>       text-xs font-medium uppercase tracking-wider
>       border ${config.border} ${config.bg} ${config.text}
>       rounded-none // Cantos retos para estética brutalista
>     `}>
>       {status}
>     </span>
>   );
> };
> ```
> 
> ---
> 
> ## Tarefa Concreta
> 
> Gere o código `tsx` completo para os seguintes componentes, aplicando todas as diretrizes acima:
> 
> 1. **`src/components/layout/Header.tsx`** - Header com navegação, logo, e toggle de tema
> 2. **`src/components/ui/status-bar.tsx`** - Nova barra de status horizontal para substituir os cards de métricas
> 3. **`src/components/ui/data-table.tsx`** - Tabela avançada com animações de entrada
> 4. **`src/components/ui/status-badge.tsx`** - Badge de status estilizado
> 5. **`src/pages/Index.tsx`** - Página principal do Pipeline integrando todos os componentes
> 
> O código deve ser completo, pronto para copiar e colar, e seguir as melhores práticas de React e TypeScript.

---

### 4.3. Instruções de Uso

1. Copie o prompt acima integralmente
2. Abra uma nova conversa com o Claude (ou outro assistente com acesso à skill `frontend-design`)
3. Cole o prompt e envie
4. O assistente gerará o código dos componentes
5. Revise o código gerado e integre na aplicação
6. Ajuste conforme necessário para seu contexto específico

---

## 5. Diretrizes de Design e Experiência do Usuário (UX/UI)

Para elevar a plataforma, adotaremos princípios de design moderno, focados em clareza, eficiência e uma estética agradável.

### 5.1. Filosofia de Design

Os 10 princípios de design para dashboards modernos que guiarão o desenvolvimento são:

1. **Foco no Objetivo Principal do Usuário**: Dashboard deve responder "O que o usuário precisa saber ou fazer?" Exibir informações mais relevantes primeiro.

2. **Visualizações de Dados Corretas**: Line Charts para tendências temporais, Bar Charts para comparações, Pie Charts com moderação para proporções simples.

3. **Hierarquia Visual Clara**: Usar contraste, cor, tamanho e espaçamento para guiar o olhar do usuário para as informações mais importantes.

4. **Interatividade Inteligente e Reativa**: Implementar filtros, drill-downs, hover para detalhes. Cada interação deve ter feedback instantâneo.

5. **Design Responsivo e Adaptativo**: Funcionar bem em desktop, tablet e mobile.

6. **Consistência de Interface**: Elementos UI consistentes em todo o sistema para minimizar carga cognitiva.

7. **Dark Mode e Acessibilidade**: Opção de tema escuro, alto contraste, labels claros e navegação por teclado.

8. **Dados em Tempo Real**: Dashboards com dados atualizados, especialmente em aplicações financeiras.

9. **Personalização por Usuário**: Exibição customizada de acordo com o papel do usuário.

10. **Design Minimalista e Estética Funcional**: "Menos é mais". Cada elemento deve servir a um propósito claro.

### 5.2. Paleta de Cores

Adotaremos uma paleta de cores moderna e acessível, com suporte para Light e Dark Mode:

| Modo | Elemento | Cor (Hex) | Tailwind Class |
|:---|:---|:---|:---|
| **Light** | Background | #F8FAFC | `bg-slate-50` |
| | Card/Widget | #FFFFFF | `bg-white` |
| | Texto Principal | #0F172A | `text-slate-900` |
| | Texto Secundário | #64748B | `text-slate-500` |
| | Borda | #E2E8F0 | `border-slate-200` |
| | Primária (Acento) | #2563EB | `bg-blue-600` |
| **Dark** | Background | #020617 | `dark:bg-slate-950` |
| | Card/Widget | #0F172A | `dark:bg-slate-900` |
| | Texto Principal | #F8FAFC | `dark:text-slate-50` |
| | Texto Secundário | #94A3B8 | `dark:text-slate-400` |
| | Borda | #1E293B | `dark:border-slate-800` |
| | Primária (Acento) | #60A5FA | `dark:bg-blue-400` |

**Cores de Status:**

| Status | Light Mode | Dark Mode | Uso |
|:---|:---|:---|:---|
| Sucesso/OK | `bg-emerald-100 text-emerald-700` | `dark:bg-emerald-900/50 dark:text-emerald-300` | Compliance aprovado, pendência resolvida |
| Alerta/Pendente | `bg-amber-100 text-amber-700` | `dark:bg-amber-900/50 dark:text-amber-300` | Aguardando ação, em análise |
| Erro/NOK | `bg-rose-100 text-rose-700` | `dark:bg-rose-900/50 dark:text-rose-300` | Compliance reprovado, problema |
| Info/Em Estruturação | `bg-sky-100 text-sky-700` | `dark:bg-sky-900/50 dark:text-sky-300` | Status neutro, em progresso |

### 5.3. Animações e Micro-interações (Framer Motion)

Animações serão usadas de forma sutil para melhorar a usabilidade, não para distrair.

| Tipo de Animação | Onde Aplicar | Configuração Sugerida |
|:---|:---|:---|
| **Transições de Página** | Navegação entre rotas | `fade-in` com `duration: 0.2s` |
| **Carregamento de Dados** | Tabelas, cards | `Skeleton` com `animate-pulse` |
| **Hover em Botões/Links** | Todos os elementos clicáveis | `scale: 1.02` com `duration: 0.15s` |
| **Abertura de Sheets** | Modal de detalhes | `slide-in` da direita com `spring` |
| **Abertura de Modais** | Dialogs de confirmação | `fade-in` + `scale` de 0.95 para 1 |
| **Listas e Tabelas** | Entrada de itens | `stagger` com delay de 0.03s por item |
| **Notificações (Toasts)** | Feedback de ações | `slide-in` do canto + `slide-out` após 5s |
| **Drag and Drop** | Kanban de pendências | `layout` animation do Framer Motion |

---

## 6. Arquitetura da Base de Dados

### 6.1. Modelo de Dados

O schema `estruturacao` conterá as seguintes tabelas principais:

```
estruturacao
├── operacoes           # Tabela central de operações
├── pendencias          # Campos de pendência por operação
├── compliance_checks   # Verificações de compliance
├── analistas_gestao    # Lista de analistas de gestão
└── hierarquia_analistas # Mapeamento analista gestão → financeiro/contábil

public
└── historico_alteracoes # Audit log de todas as alterações
└── user_profiles        # Perfis de usuário (admin, gestor, analista)
```

### 6.2. Tabela Principal: `estruturacao.operacoes`

| Coluna | Tipo | Descrição |
|:---|:---|:---|
| `id` | uuid (PK) | Identificador único |
| `id_emissao_comercial` | uuid (FK) | Referência à emissão no comercial |
| `numero_emissao` | text | Código da emissão (ex: EM-20260115-0019) |
| `nome_operacao` | text | Nome descritivo da operação |
| `status` | text | Status atual (Em Estruturação, Liquidada, etc.) |
| `pmo_id` | uuid (FK) | PMO responsável |
| `analista_gestao_id` | uuid (FK) | Analista de gestão atribuído |
| `analista_financeiro_id` | uuid (FK) | Analista financeiro (via hierarquia) |
| `analista_contabil_id` | uuid (FK) | Analista contábil (via hierarquia) |
| `categoria_id` | int (FK) | CRI, CRA, DEB, etc. |
| `veiculo_id` | int (FK) | Patrimônio Separado ou Veículo Exclusivo |
| `tipo_oferta_id` | int (FK) | Tipo de oferta |
| `volume` | numeric | Volume total da operação |
| `empresa_cnpj` | text | CNPJ da empresa |
| `data_entrada_pipe` | date | Data de entrada no pipeline |
| `data_previsao_liquidacao` | date | Previsão de liquidação |
| `data_liquidacao` | date | Data efetiva de liquidação |
| `floating` | boolean | Se é operação floating |
| `proximos_passos` | text | Próximos passos |
| `alertas` | text | Alertas e observações |
| `resumo` | text | Resumo da operação |
| `criado_em` | timestamptz | Data de criação |
| `atualizado_em` | timestamptz | Data da última atualização |

---

## 7. Scripts SQL para Criação das Tabelas

### 7.1. Criação do Schema e Tabelas

```sql
-- =====================================================
-- CRIAÇÃO DO SCHEMA E TABELAS
-- =====================================================

-- Criar schema de estruturação
CREATE SCHEMA IF NOT EXISTS estruturacao;

-- 1. Tabela de Analistas de Gestão
CREATE TABLE IF NOT EXISTS estruturacao.analistas_gestao (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    email text,
    ativo boolean DEFAULT true,
    criado_em timestamptz DEFAULT now()
);

-- 2. Tabela de Hierarquia de Analistas
CREATE TABLE IF NOT EXISTS estruturacao.hierarquia_analistas (
    id serial PRIMARY KEY,
    analista_gestao_id uuid REFERENCES estruturacao.analistas_gestao(id),
    analista_financeiro_id uuid REFERENCES estruturacao.analistas_gestao(id),
    analista_contabil_id uuid REFERENCES estruturacao.analistas_gestao(id),
    UNIQUE(analista_gestao_id)
);

-- 3. Tabela de Perfis de Usuário
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome text NOT NULL,
    email text NOT NULL,
    perfil text NOT NULL CHECK (perfil IN ('admin', 'gestor_estruturacao', 'analista_estruturacao', 'gestor_gestao')),
    criado_em timestamptz DEFAULT now()
);

-- 4. Tabela Principal de Operações
CREATE TABLE IF NOT EXISTS estruturacao.operacoes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_emissao_comercial uuid REFERENCES public.emissoes(id),
    numero_emissao text,
    nome_operacao text NOT NULL,
    status text DEFAULT 'Em Estruturação' CHECK (status IN ('Em Estruturação', 'Liquidada', 'On Hold', 'Abortada', 'Finalizada')),
    pmo_id uuid REFERENCES public.user_profiles(id),
    analista_gestao_id uuid REFERENCES estruturacao.analistas_gestao(id),
    analista_financeiro_id uuid REFERENCES estruturacao.analistas_gestao(id),
    analista_contabil_id uuid REFERENCES estruturacao.analistas_gestao(id),
    categoria_id int,
    veiculo_id int,
    tipo_oferta_id int,
    volume numeric DEFAULT 0,
    empresa_cnpj text,
    data_entrada_pipe date DEFAULT CURRENT_DATE,
    data_previsao_liquidacao date,
    data_liquidacao date,
    floating boolean DEFAULT false,
    proximos_passos text,
    alertas text,
    resumo text,
    criado_em timestamptz DEFAULT now(),
    atualizado_em timestamptz DEFAULT now()
);

-- 5. Tabela de Pendências
CREATE TABLE IF NOT EXISTS estruturacao.pendencias (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operacao_id uuid NOT NULL REFERENCES estruturacao.operacoes(id) ON DELETE CASCADE,
    mapa_liquidacao text DEFAULT 'Pendente' CHECK (mapa_liquidacao IN ('OK', 'Pendente', 'N/A')),
    mapa_registros text DEFAULT 'Pendente' CHECK (mapa_registros IN ('OK', 'Pendente', 'N/A')),
    lo text DEFAULT 'Pendente' CHECK (lo IN ('OK', 'Pendente', 'N/A')),
    dd text DEFAULT 'Pendente' CHECK (dd IN ('OK', 'Pendente', 'N/A')),
    envio_email_prestadores text DEFAULT 'Pendente' CHECK (envio_email_prestadores IN ('OK', 'Pendente', 'N/A')),
    passagem_bastao text DEFAULT 'Pendente' CHECK (passagem_bastao IN ('OK', 'Pendente', 'N/A')),
    kick_off text DEFAULT 'Pendente' CHECK (kick_off IN ('OK', 'Pendente', 'N/A')),
    todas_resolvidas boolean DEFAULT false,
    criado_em timestamptz DEFAULT now(),
    atualizado_em timestamptz DEFAULT now(),
    UNIQUE(operacao_id)
);

-- 6. Tabela de Compliance Checks
CREATE TABLE IF NOT EXISTS estruturacao.compliance_checks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operacao_id uuid NOT NULL REFERENCES estruturacao.operacoes(id) ON DELETE CASCADE,
    tipo text NOT NULL,
    cnpj_cpf text NOT NULL,
    nome_entidade text,
    status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'aprovado', 'reprovado')),
    responsavel_id uuid REFERENCES auth.users(id),
    observacoes text,
    data_verificacao timestamptz,
    criado_em timestamptz DEFAULT now(),
    atualizado_em timestamptz DEFAULT now()
);

-- 7. Tabela de Audit Log
CREATE TABLE IF NOT EXISTS public.historico_alteracoes (
    id bigserial PRIMARY KEY,
    schema_name text NOT NULL,
    table_name text NOT NULL,
    record_id text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_by uuid REFERENCES auth.users(id),
    changed_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_operacoes_status ON estruturacao.operacoes(status);
CREATE INDEX IF NOT EXISTS idx_operacoes_pmo ON estruturacao.operacoes(pmo_id);
CREATE INDEX IF NOT EXISTS idx_pendencias_operacao ON estruturacao.pendencias(operacao_id);
CREATE INDEX IF NOT EXISTS idx_compliance_operacao ON estruturacao.compliance_checks(operacao_id);
CREATE INDEX IF NOT EXISTS idx_audit_table ON public.historico_alteracoes(table_name, changed_at);
```

### 7.2. Triggers e Functions

```sql
-- =====================================================
-- TRIGGERS E FUNCTIONS
-- =====================================================

-- 1. Trigger para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_operacoes_updated_at
    BEFORE UPDATE ON estruturacao.operacoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_pendencias_updated_at
    BEFORE UPDATE ON estruturacao.pendencias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_compliance_updated_at
    BEFORE UPDATE ON estruturacao.compliance_checks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Trigger para preencher analistas via hierarquia
CREATE OR REPLACE FUNCTION preencher_analistas_hierarquia()
RETURNS TRIGGER AS $$
DECLARE
    v_financeiro_id uuid;
    v_contabil_id uuid;
BEGIN
    IF NEW.analista_gestao_id IS NOT NULL AND 
       (OLD.analista_gestao_id IS NULL OR OLD.analista_gestao_id != NEW.analista_gestao_id) THEN
        
        SELECT analista_financeiro_id, analista_contabil_id
        INTO v_financeiro_id, v_contabil_id
        FROM estruturacao.hierarquia_analistas
        WHERE analista_gestao_id = NEW.analista_gestao_id;
        
        IF v_financeiro_id IS NOT NULL THEN
            NEW.analista_financeiro_id := v_financeiro_id;
        END IF;
        
        IF v_contabil_id IS NOT NULL THEN
            NEW.analista_contabil_id := v_contabil_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_preencher_analistas
    BEFORE INSERT OR UPDATE ON estruturacao.operacoes
    FOR EACH ROW EXECUTE FUNCTION preencher_analistas_hierarquia();

-- 3. Trigger para criar operação quando emissão é aceita no comercial
CREATE OR REPLACE FUNCTION criar_operacao_de_emissao()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'aceita' AND (OLD.status IS NULL OR OLD.status != 'aceita') THEN
        INSERT INTO estruturacao.operacoes (
            id_emissao_comercial,
            numero_emissao,
            nome_operacao,
            volume,
            empresa_cnpj,
            categoria_id,
            veiculo_id,
            tipo_oferta_id
        ) VALUES (
            NEW.id,
            NEW.numero_emissao,
            COALESCE(NEW.nome, 'Operação ' || NEW.numero_emissao),
            COALESCE(NEW.volume_total, 0),
            NEW.cnpj_empresa,
            NEW.categoria_id,
            NEW.veiculo_id,
            NEW.tipo_oferta_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_criar_operacao
    AFTER INSERT OR UPDATE ON public.emissoes
    FOR EACH ROW EXECUTE FUNCTION criar_operacao_de_emissao();

-- 4. Trigger para Audit Log
CREATE OR REPLACE FUNCTION log_alteracao()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.historico_alteracoes (schema_name, table_name, record_id, new_data, action, changed_by)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.id::text, to_jsonb(NEW), 'INSERT', auth.uid());
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.historico_alteracoes (schema_name, table_name, record_id, old_data, new_data, action, changed_by)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.id::text, to_jsonb(OLD), to_jsonb(NEW), 'UPDATE', auth.uid());
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.historico_alteracoes (schema_name, table_name, record_id, old_data, action, changed_by)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, OLD.id::text, to_jsonb(OLD), 'DELETE', auth.uid());
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_operacoes
    AFTER INSERT OR UPDATE OR DELETE ON estruturacao.operacoes
    FOR EACH ROW EXECUTE FUNCTION log_alteracao();

CREATE TRIGGER audit_pendencias
    AFTER INSERT OR UPDATE OR DELETE ON estruturacao.pendencias
    FOR EACH ROW EXECUTE FUNCTION log_alteracao();

CREATE TRIGGER audit_compliance
    AFTER INSERT OR UPDATE OR DELETE ON estruturacao.compliance_checks
    FOR EACH ROW EXECUTE FUNCTION log_alteracao();
```

### 7.3. Row Level Security (RLS)

```sql
-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE estruturacao.operacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE estruturacao.pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE estruturacao.compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE estruturacao.analistas_gestao ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para obter perfil do usuário
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS text AS $$
DECLARE
    v_profile text;
BEGIN
    SELECT perfil INTO v_profile
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies para operacoes
CREATE POLICY "admin_full_access" ON estruturacao.operacoes
    FOR ALL USING (public.get_user_profile() = 'admin');

CREATE POLICY "gestor_estruturacao_full_access" ON estruturacao.operacoes
    FOR ALL USING (public.get_user_profile() = 'gestor_estruturacao');

CREATE POLICY "analista_estruturacao_full_access" ON estruturacao.operacoes
    FOR ALL USING (public.get_user_profile() = 'analista_estruturacao');

CREATE POLICY "gestor_gestao_view_all" ON estruturacao.operacoes
    FOR SELECT USING (public.get_user_profile() = 'gestor_gestao');

CREATE POLICY "gestor_gestao_update_analistas" ON estruturacao.operacoes
    FOR UPDATE USING (public.get_user_profile() = 'gestor_gestao')
    WITH CHECK (public.get_user_profile() = 'gestor_gestao');

-- Policies para pendencias
CREATE POLICY "full_access_pendencias" ON estruturacao.pendencias
    FOR ALL USING (public.get_user_profile() IN ('admin', 'gestor_estruturacao', 'analista_estruturacao'));

CREATE POLICY "gestor_gestao_view_pendencias" ON estruturacao.pendencias
    FOR SELECT USING (public.get_user_profile() = 'gestor_gestao');

-- Policies para compliance_checks
CREATE POLICY "full_access_compliance" ON estruturacao.compliance_checks
    FOR ALL USING (public.get_user_profile() IN ('admin', 'gestor_estruturacao', 'analista_estruturacao'));

-- Policies para analistas_gestao (leitura para todos autenticados)
CREATE POLICY "read_analistas" ON estruturacao.analistas_gestao
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_manage_analistas" ON estruturacao.analistas_gestao
    FOR ALL USING (public.get_user_profile() = 'admin');
```

---

## 8. Migração de Dados

### 8.1. Mapeamento de Colunas

A tabela a seguir mapeia as colunas da planilha para as colunas do banco de dados:

| Coluna Planilha (Pipe) | Coluna Supabase | Observações |
|:---|:---|:---|
| UID | `id` | Gerar novo UUID |
| PMO | `pmo_id` | Buscar ID do usuário pelo nome |
| Categoria | `categoria_id` | Buscar ID da categoria pelo código |
| Operação | `nome_operacao` | Direto |
| Previsão de Liquidação | `data_previsao_liquidacao` | Converter formato de data |
| Veículo | `veiculo_id` | Buscar ID do veículo |
| Emissão | `numero_emissao` | Direto |
| Volume | `volume` | Converter para numérico |
| Status | `status` | Mapear valores |

### 8.2. Script de Migração (Python)

```python
import pandas as pd
from supabase import create_client, Client
from datetime import datetime
import os

# Configuração do Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def carregar_planilha(caminho: str) -> dict:
    """Carrega todas as abas relevantes da planilha."""
    return {
        'pipe': pd.read_excel(caminho, sheet_name='Pipe'),
        'historico': pd.read_excel(caminho, sheet_name='Histórico'),
        'pendencias': pd.read_excel(caminho, sheet_name='Pendências')
    }

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
    mapeamento = {
        'Em Estruturação': 'Em Estruturação',
        'Liquidada': 'Liquidada',
        'On hold': 'On Hold',
        'Abortada': 'Abortada',
        'Finalizada': 'Finalizada'
    }
    return mapeamento.get(status_planilha, 'Em Estruturação')

def migrar_operacao(row, refs):
    """Converte uma linha da planilha para o formato do banco."""
    categorias, veiculos, usuarios, analistas = refs
    
    return {
        'numero_emissao': str(row.get('Emissão', '')),
        'nome_operacao': str(row.get('Operação', 'Sem nome')),
        'status': mapear_status(row.get('Status', 'Em Estruturação')),
        'pmo_id': usuarios.get(row.get('PMO')),
        'analista_gestao_id': analistas.get(row.get('Analista Gestão')),
        'categoria_id': categorias.get(row.get('Categoria')),
        'veiculo_id': veiculos.get(row.get('Veículo')),
        'volume': float(row.get('Volume', 0)) if pd.notna(row.get('Volume')) else 0,
        'data_entrada_pipe': converter_data(row.get('Data de Entrada no Pipe')),
        'data_previsao_liquidacao': converter_data(row.get('Previsão de Liquidação')),
        'data_liquidacao': converter_data(row.get('Data de Liquidação')),
        'floating': bool(row.get('Floating')) if pd.notna(row.get('Floating')) else False,
        'proximos_passos': str(row.get('Próximos Passos', '')) if pd.notna(row.get('Próximos Passos')) else None,
        'alertas': str(row.get('Alertas', '')) if pd.notna(row.get('Alertas')) else None,
        'resumo': str(row.get('Resumo', '')) if pd.notna(row.get('Resumo')) else None,
    }

def executar_migracao(caminho_planilha: str):
    """Executa a migração completa."""
    dados = carregar_planilha(caminho_planilha)
    refs = buscar_referencias()
    
    # Migrar Pipe e Histórico
    for aba in ['pipe', 'historico']:
        df = dados[aba]
        for _, row in df.iterrows():
            operacao = migrar_operacao(row, refs)
            try:
                supabase.schema('estruturacao').table('operacoes').insert(operacao).execute()
                print(f"Migrada: {operacao['numero_emissao']}")
            except Exception as e:
                print(f"Erro em {operacao['numero_emissao']}: {e}")
    
    print("Migração concluída!")

if __name__ == "__main__":
    executar_migracao("Pipe-Overview.xlsx")
```

---

## 9. Sistema de Autenticação e Perfis

### 9.1. Perfis de Usuário

| Perfil | Descrição | Permissões |
|:---|:---|:---|
| `admin` | Administrador do sistema | Acesso total a todas as funcionalidades e configurações |
| `gestor_estruturacao` | Gestor da equipe de estruturação | Visualizar todas as operações, atribuir PMOs, editar operações |
| `analista_estruturacao` | Analista de estruturação (PMO) | Editar todas as operações, gerenciar compliance |
| `gestor_gestao` | Gestor da equipe de gestão pós-liquidação | Visualizar pipeline, atribuir analistas de gestão às operações liquidadas |

### 9.2. Fluxo de Autenticação

O sistema utilizará o Supabase Auth com as seguintes configurações:

1. **Método de Login**: E-mail e senha (pode ser expandido para SSO no futuro).
2. **Criação de Usuários**: Apenas administradores podem criar novos usuários.
3. **Atribuição de Perfil**: Ao criar um usuário, o admin define o perfil na tabela `user_profiles`.

---

## 10. Automação de E-mails

### 10.1. Configuração do Resend

O serviço de e-mail **Resend** será utilizado para envios automáticos. A configuração será feita através de uma Supabase Edge Function.

### 10.2. Tipos de E-mail

| Tipo | Destinatário | Gatilho | Conteúdo |
|:---|:---|:---|:---|
| Cobrança de Compliance | PMO | Diário (cron) | Lista de compliance pendentes |
| Relatório de Gestão | Analistas de Gestão | Semanal (cron) | Resumo das operações sob responsabilidade |
| Relatório Financeiro | Analistas Financeiros | Semanal (cron) | Resumo financeiro das operações |
| Nova Atribuição | PMO/Analista | Evento (trigger) | Notificação de nova operação atribuída |

### 10.3. Exemplo de Edge Function

```typescript
// supabase/functions/enviar-email-compliance/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Buscar compliance pendentes agrupados por PMO
  const { data: pendentes } = await supabase
    .schema('estruturacao')
    .from('compliance_checks')
    .select(`
      *,
      operacao:operacoes(numero_emissao, nome_operacao, pmo:user_profiles(nome, email))
    `)
    .eq('status', 'pendente')

  // Agrupar por PMO e enviar e-mails
  const porPmo = pendentes?.reduce((acc, item) => {
    const pmoEmail = item.operacao?.pmo?.email
    if (pmoEmail) {
      if (!acc[pmoEmail]) acc[pmoEmail] = []
      acc[pmoEmail].push(item)
    }
    return acc
  }, {})

  for (const [email, items] of Object.entries(porPmo || {})) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'estruturacao@suasecuritizadora.com.br',
        to: email,
        subject: 'Compliance Pendente - Ação Necessária',
        html: `<p>Você tem ${items.length} verificações de compliance pendentes.</p>`
      })
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## 11. Estrutura do Frontend

### 11.1. Páginas da Aplicação

| Página | Rota | Descrição | Perfis com Acesso |
|:---|:---|:---|:---|
| Login | `/login` | Tela de autenticação com design moderno | Público |
| Pipeline | `/` | Tabela avançada de operações em estruturação | Todos autenticados |
| Detalhes da Operação | (Sheet) | Detalhes de uma operação, aberto a partir do Pipeline | Todos autenticados |
| Pendências | `/pendencias` | Kanban de operações com pendências | Todos autenticados |
| Histórico | `/historico` | Arquivo de operações finalizadas com filtros | Todos autenticados |
| Gestão | `/gestao` | Atribuição de analistas (visão para gestores) | `gestor_estruturacao`, `gestor_gestao` |
| Admin | `/admin` | Gerenciamento de usuários e configurações | `admin` |
| Meu Perfil | `/perfil` | Configurações do usuário (ex: toggle Dark Mode) | Todos autenticados |

### 11.2. Bibliotecas Adicionais a Instalar

```bash
# Animações
npm install framer-motion

# Tabela avançada
npm install @tanstack/react-table

# Drag and Drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Gráficos
npm install recharts

# Formatação de moeda
npm install react-number-format
```

---

## 12. Cronograma de Implementação

| Fase | Atividades | Duração Estimada |
|:---|:---|:---|
| **Fase 0: Correção Urgente** | Corrigir Dark Mode conforme Seção 3 | 1 dia |
| **Fase 1: Backend** | Criação do schema, tabelas, triggers e RLS no Supabase | 3-4 dias |
| **Fase 2: Migração** | Execução e validação do script de migração de dados | 2-3 dias |
| **Fase 3: Frontend - Base** | Aplicar prompt da Seção 4 para refatorar UI (Header, Tabela, StatusBar) | 3-4 dias |
| **Fase 4: Frontend - Core** | Desenvolvimento da página de Pipeline com DataTable e o Sheet de Detalhes | 5-7 dias |
| **Fase 5: Frontend - Módulos** | Desenvolvimento das páginas de Pendências (Kanban) e Histórico | 3-5 dias |
| **Fase 6: Automação** | Implementação das Edge Functions para e-mails | 2-3 dias |
| **Fase 7: Finalização** | Testes integrados, ajustes de responsividade e polimento de animações | 3-5 dias |
| **Total** | | **22-32 dias** |

---

## 13. Próximos Passos

1. **Correção Imediata do Dark Mode**: Siga o passo a passo da Seção 3 para consertar o problema do tema.
2. **Executar Prompt de Evolução da UI**: Utilize o prompt da Seção 4 com um assistente de IA para gerar a nova interface.
3. **Validar e Integrar**: Revise e integre o código gerado na aplicação.
4. **Executar Migrações SQL**: Rodar os scripts da Seção 7 no Supabase.
5. **Continuar Desenvolvimento**: Prossiga com as demais fases do cronograma.

---

## 14. Referências

- [1] Documentação do Supabase: [https://supabase.com/docs](https://supabase.com/docs)
- [2] Supabase Row Level Security: [https://supabase.com/docs/guides/auth/row-level-security](https://supabase.com/docs/guides/auth/row-level-security)
- [3] Biblioteca de Componentes shadcn/ui: [https://ui.shadcn.com/](https://ui.shadcn.com/)
- [4] shadcn/ui Dark Mode: [https://ui.shadcn.com/docs/dark-mode/vite](https://ui.shadcn.com/docs/dark-mode/vite)
- [5] Framer Motion (Animações): [https://www.framer.com/motion/](https://www.framer.com/motion/)
- [6] TanStack Table v8: [https://tanstack.com/table/v8](https://tanstack.com/table/v8)
- [7] DND Kit (Drag and Drop): [https://dndkit.com/](https://dndkit.com/)
- [8] Serviço de E-mail Resend: [https://resend.com/](https://resend.com/)
- [9] Google Fonts - DM Serif Display: [https://fonts.google.com/specimen/DM+Serif+Display](https://fonts.google.com/specimen/DM+Serif+Display)
- [10] Skill `frontend-design` (documentação interna)
