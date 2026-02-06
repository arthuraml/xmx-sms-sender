# XMX-SMS-Sender

Plataforma de SMS marketing em massa com dashboard analytics, gestao de campanhas e API publica. Clone funcional inspirado no [luxfysms.app](https://luxfysms.app/), utilizando os mesmos provedores de SMS.

> A analise OSINT que originou este projeto esta documentada em [`luxfysms-analysis.md`](./luxfysms-analysis.md).

---

## Funcionalidades

### SMS
- Envio de SMS individual e em massa (bulk)
- Selecao de provedor por envio (Onbuka, EIMS, SMPP)
- Contador de caracteres e preview da mensagem
- Sender ID customizavel

### Campanhas
- Criar campanhas vinculadas a grupos de contatos
- Acompanhamento em tempo real via Supabase Realtime
- Progress bar, contadores de enviados/entregues/falhos
- Iniciar, pausar e retomar campanhas

### Contatos
- CRUD completo de contatos
- Importacao de contatos via CSV (com mapeamento de colunas)
- Grupos de contatos
- Busca por nome ou telefone

### Dashboard & Analytics
- 6 cards de metricas (enviados, entregues, falhos, taxa de entrega, campanhas ativas, contatos)
- Graficos interativos com Recharts (envios por dia, taxa de entrega)

### Logs
- Tabela de logs com filtros por status e provedor
- Exportacao CSV

### Fluxos Visuais
- Editor drag & drop com React Flow
- Nos customizados: Start, SMS, Delay, Condition
- Salvar/carregar fluxos no banco

### Configuracoes
- Configuracao de todos os provedores SMS (Onbuka, EIMS x3, SMPP)
- Gestao de chaves de API (criar, revogar, copiar)

### Extras
- Dark mode nativo
- Landing page publica
- Autenticacao via Supabase Auth (email/password)
- Rotas protegidas
- Notificacoes toast (sonner)

---

## Provedores SMS

| Provedor | Papel | Autenticacao |
|----------|-------|-------------|
| **Onbuka** | Primario | API Key + Secret + App ID (MD5 signature) |
| **EIMS** | Secundario (3 contas) | Account + Password |
| **SMPP** | Gateway terciario | Host + Port + System ID + Password |

---

## Stack Tecnologico

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19 + Vite 7 + TypeScript |
| Estilo | Tailwind CSS v4 + shadcn/ui |
| Routing | React Router v7 |
| Graficos | Recharts |
| Fluxos | @xyflow/react (React Flow) |
| Icones | Lucide React |
| CSV | papaparse |
| Backend | Supabase (PostgreSQL + Edge Functions + Auth + Realtime) |
| SMS | Onbuka API v3 + EIMS HTTP + SMPP |

---

## Estrutura do Projeto

```
xmx-sms-sender/
├── src/
│   ├── main.tsx                        # Entry point + Router + Providers
│   ├── App.tsx                         # Definicao de rotas
│   ├── index.css                       # Tailwind CSS v4 + tema
│   ├── types/
│   │   └── index.ts                    # Interfaces TypeScript
│   ├── lib/
│   │   ├── supabase.ts                 # Cliente Supabase
│   │   └── utils.ts                    # cn() helper
│   ├── contexts/
│   │   └── auth-context.tsx            # AuthProvider + useAuth
│   ├── components/
│   │   ├── protected-route.tsx         # Route guard
│   │   ├── layout/
│   │   │   ├── sidebar.tsx             # Navegacao lateral + dark mode
│   │   │   ├── header.tsx              # Header + user dropdown
│   │   │   └── dashboard-layout.tsx    # Layout wrapper com Outlet
│   │   └── ui/                         # 24 componentes shadcn/ui
│   └── pages/
│       ├── landing.tsx                 # Pagina publica
│       ├── auth/
│       │   ├── login.tsx
│       │   └── register.tsx
│       ├── dashboard/
│       │   └── index.tsx               # Stats + graficos Recharts
│       ├── sms/
│       │   ├── send.tsx                # Envio individual
│       │   └── bulk.tsx                # Envio em massa
│       ├── campaigns/
│       │   ├── index.tsx               # Lista de campanhas
│       │   ├── new.tsx                 # Criar campanha
│       │   └── detail.tsx              # Detalhes + realtime
│       ├── contacts/
│       │   ├── index.tsx               # Lista + CRUD
│       │   └── import.tsx              # Import CSV
│       ├── logs/
│       │   └── index.tsx               # Tabela + filtros + export
│       ├── flows/
│       │   ├── index.tsx               # Lista de fluxos
│       │   └── editor.tsx              # Editor React Flow
│       └── settings/
│           └── index.tsx               # Provedores + API keys
├── supabase/
│   ├── functions/
│   │   ├── send-sms/                   # Envio SMS (Onbuka + EIMS + SMPP)
│   │   ├── public-api/                 # API publica com autenticacao por chave
│   │   ├── campaign-worker/            # Processamento de campanhas em batch
│   │   └── webhook-delivery/           # Webhooks de delivery reports
│   └── migrations/
│       └── 001_initial_schema.sql      # Schema completo (10 tabelas + RLS)
├── luxfysms-analysis.md                # Analise OSINT original
├── .env.example
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## Banco de Dados

10 tabelas PostgreSQL com Row Level Security:

| Tabela | Descricao |
|--------|-----------|
| `profiles` | Perfis de usuario (extends auth.users) |
| `provider_settings` | Configuracao dos provedores SMS (admin) |
| `contacts` | Contatos do usuario |
| `contact_groups` | Grupos de contatos |
| `contact_group_members` | Relacao N:N contatos-grupos |
| `campaigns` | Campanhas SMS |
| `campaign_recipients` | Destinatarios de cada campanha |
| `sms_logs` | Log de todos os SMS enviados |
| `api_keys` | Chaves de API publica |
| `flow_templates` | Templates de fluxos visuais |

---

## API Publica

Autenticacao via header `Authorization: Bearer SUA_CHAVE_API`.

Os endpoints sao acessados via Supabase Edge Function `public-api`:

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/health` | Health check |
| POST | `/sendsms` | Enviar SMS |
| GET | `/balance` | Consultar saldo |
| GET | `/status/:id` | Status de entrega |
| GET | `/campaign` | Listar campanhas |
| POST | `/campaign` | Criar campanha |
| GET | `/campaign/:id` | Detalhes da campanha |
| PUT | `/campaign/:id` | Atualizar campanha |
| DELETE | `/campaign/:id` | Excluir campanha |
| GET | `/logs` | Logs de envio |

### Exemplo de Envio

```bash
curl -X POST https://SEU_PROJETO.supabase.co/functions/v1/public-api/sendsms \
  -H "Authorization: Bearer SUA_CHAVE_API" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "message": "Sua mensagem aqui",
    "provider": "onbuka"
  }'
```

---

## Como Rodar

### Pre-requisitos

- Node.js 18+
- npm
- Conta no [Supabase](https://supabase.com)
- Credenciais dos provedores SMS (Onbuka, EIMS e/ou SMPP)

### Instalacao

```bash
# Clonar o repositorio
git clone https://github.com/arthuraml/xmx-sms-sender.git
cd xmx-sms-sender

# Instalar dependencias
npm install

# Configurar variaveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais Supabase

# Rodar em desenvolvimento
npm run dev
```

### Supabase

```bash
# Instalar CLI do Supabase
npm install -g supabase

# Inicializar projeto
supabase init

# Aplicar migracoes
supabase db push

# Deploy das Edge Functions
supabase functions deploy send-sms
supabase functions deploy public-api
supabase functions deploy campaign-worker
supabase functions deploy webhook-delivery
```

---

## Status do Projeto

- [x] Analise OSINT do luxfysms.app
- [x] Identificacao dos provedores SMS
- [x] Setup do projeto (React + Vite + Tailwind v4 + shadcn/ui)
- [x] Schema do banco de dados (10 tabelas + RLS)
- [x] Edge Functions (send-sms, public-api, campaign-worker, webhook-delivery)
- [x] Integracao com Onbuka API
- [x] Integracao com EIMS (3 contas)
- [x] Placeholder SMPP (requer microservico TCP separado)
- [x] Sistema de autenticacao (Supabase Auth)
- [x] Layout (sidebar + header + dark mode)
- [x] Dashboard com graficos (Recharts)
- [x] Envio de SMS individual e em massa
- [x] Gestao de campanhas (CRUD + worker + realtime)
- [x] Gestao de contatos (CRUD + busca)
- [x] Importacao de contatos via CSV
- [x] Logs com filtros e exportacao CSV
- [x] Editor visual de fluxos (React Flow)
- [x] Configuracoes de provedores
- [x] API publica com chaves de acesso
- [x] Landing page
- [ ] Microservico SMPP (TCP nao funciona em Edge Functions)
- [ ] Code splitting (bundle > 500KB)
- [ ] Testes automatizados

---

## Licenca

Projeto privado para uso pessoal e educacional.
