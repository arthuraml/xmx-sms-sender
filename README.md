# SMS Finder

Plataforma de SMS marketing em massa e call center com IA. Clone funcional inspirado no [luxfysms.app](https://luxfysms.app/), utilizando os mesmos provedores de SMS e stack tecnológico equivalente.

> A análise OSINT que originou este projeto está documentada em [`luxfysms-analysis.md`](./luxfysms-analysis.md).

---

## Funcionalidades

### SMS em Massa
- Envio de SMS individual e em massa (bulk)
- Gestão de campanhas (criar, editar, monitorar, excluir)
- Importação de contatos via CSV
- Verificação de status de entrega por mensagem
- Consulta de saldo em tempo real
- Logs de envio com filtros e busca

### Call Center com IA
- Sistema de chamadas automatizadas com IVR (Interactive Voice Response)
- Agentes de IA configuráveis para chamadas
- Editor visual de fluxos de comunicação (drag & drop)
- Text-to-Speech (TTS) via ElevenLabs

### Analytics
- Link tracking com rastreamento de cliques
- Dashboard com métricas de campanhas
- Relatórios de entrega e performance

---

## Provedores SMS

| Provedor | Papel | Autenticação |
|----------|-------|-------------|
| **Onbuka** | Primário | API Key + Secret + App ID (MD5) |
| **EIMS** | Secundário (3 contas) | Account + Password |
| **SMPP** | Gateway terciário | Servidor `smpp.kftel.hk:20003` |

### Configuração dos Provedores

```env
# Onbuka (primário)
ONBUKA_API_KEY=
ONBUKA_API_SECRET=
ONBUKA_APP_ID=

# EIMS (secundário - até 3 contas)
EIMS_ACCOUNT_1=
EIMS_PASSWORD_1=
EIMS_SERVERS_1=

EIMS_ACCOUNT_2=
EIMS_PASSWORD_2=
EIMS_SERVERS_2=

EIMS_ACCOUNT_3=
EIMS_PASSWORD_3=
EIMS_SERVERS_3=

# SMPP Gateway (terciário)
SMPP_HOST=smpp.kftel.hk
SMPP_PORT=20003
SMPP_SYSTEM_ID=
SMPP_PASSWORD=
```

---

## Stack Tecnológico

```
┌─────────────────────────────────────┐
│          CLOUDFLARE (CDN/WAF)       │
├─────────────────────────────────────┤
│          FRONTEND (SPA)             │
│  React 18 + Vite + TypeScript      │
│  Tailwind CSS + shadcn/ui          │
│  React Flow (editor de fluxos)     │
│  i18next (pt-BR)                   │
├─────────────────────────────────────┤
│          BACKEND                    │
│  Supabase                          │
│  ├─ PostgreSQL (banco de dados)    │
│  ├─ Edge Functions (API)           │
│  ├─ Auth (autenticação)            │
│  └─ Realtime (websockets)          │
├─────────────────────────────────────┤
│        PROVEDORES SMS               │
│  Onbuka + EIMS (x3) + SMPP        │
├─────────────────────────────────────┤
│        INTEGRAÇÕES                  │
│  ElevenLabs (TTS) + Analytics      │
└─────────────────────────────────────┘
```

---

## API

### Endpoints

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/sendsms` | Enviar SMS |
| GET | `/api/balance` | Consultar saldo |
| GET | `/api/status/:id` | Status de entrega |
| GET | `/api/campaign` | Listar campanhas |
| POST | `/api/campaign` | Criar campanha |
| GET | `/api/campaign/:id` | Detalhes da campanha |
| PUT | `/api/campaign/:id` | Atualizar campanha |
| DELETE | `/api/campaign/:id` | Excluir campanha |
| GET | `/api/logs` | Logs de envio |
| GET | `/api/health` | Health check |

### Exemplo de Envio

```bash
curl -X POST https://sua-url.com/api/sendsms \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5511999999999",
    "message": "Sua mensagem aqui",
    "provider": "onbuka"
  }'
```

---

## Estrutura do Projeto

```
sms-finder/
├── src/
│   ├── components/       # Componentes React (UI)
│   ├── pages/            # Paginas da aplicacao
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilitarios e helpers
│   ├── providers/        # Integracao com provedores SMS
│   │   ├── onbuka.ts     # Cliente Onbuka API
│   │   ├── eims.ts       # Cliente EIMS
│   │   └── smpp.ts       # Cliente SMPP
│   ├── services/         # Logica de negocio
│   │   ├── sms.ts        # Servico de envio SMS
│   │   ├── campaign.ts   # Gestao de campanhas
│   │   └── contacts.ts   # Gestao de contatos
│   └── types/            # Tipos TypeScript
├── supabase/
│   ├── functions/        # Edge Functions
│   │   ├── send-sms/     # Funcao de envio
│   │   ├── public-api/   # API publica
│   │   └── link-analytics/ # Tracking de links
│   └── migrations/       # Migracoes SQL
├── public/               # Assets estaticos
├── luxfysms-analysis.md  # Analise OSINT original
├── .env.example          # Variaveis de ambiente
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Como Rodar

### Pre-requisitos

- Node.js 18+
- npm ou pnpm
- Conta no [Supabase](https://supabase.com)
- Credenciais dos provedores SMS (Onbuka, EIMS e/ou SMPP)

### Instalacao

```bash
# Clonar o repositorio
git clone https://github.com/arthuraml/sms-finder.git
cd sms-finder

# Instalar dependencias
npm install

# Configurar variaveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Rodar em desenvolvimento
npm run dev
```

### Supabase

```bash
# Instalar CLI do Supabase
npm install -g supabase

# Inicializar projeto Supabase
supabase init

# Rodar migracoes
supabase db push

# Deploy das Edge Functions
supabase functions deploy
```

---

## Status do Projeto

- [x] Analise OSINT do luxfysms.app
- [x] Identificacao dos provedores SMS
- [x] Documentacao do projeto
- [ ] Setup do projeto (React + Vite + Supabase)
- [ ] Integracao com Onbuka API
- [ ] Integracao com EIMS
- [ ] Integracao com SMPP Gateway
- [ ] Sistema de autenticacao
- [ ] Dashboard principal
- [ ] Gestao de campanhas
- [ ] Importacao de contatos (CSV)
- [ ] Logs em tempo real
- [ ] Call Center com IA
- [ ] Editor visual de fluxos
- [ ] Integracao ElevenLabs (TTS)
- [ ] Link tracking / analytics
- [ ] API publica

---

## Licenca

Projeto privado para uso pessoal e educacional.
