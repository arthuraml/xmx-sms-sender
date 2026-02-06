# SMS Finder - Análise OSINT do luxfysms.app

Investigação técnica para identificar os provedores de SMS utilizados pela plataforma **luxfysms.app** (dP SMS - Plataforma Inteligente de Marketing Digital).

---

## Resumo Executivo

A plataforma luxfysms.app utiliza **três provedores de SMS** em conjunto, com o **Onbuka** como provedor primário. A descoberta foi feita através de análise do bundle JavaScript da aplicação (`/assets/index-DX_F-_pt.js`, 2.6 MB), que revelou campos de configuração, endpoints de API e referências diretas aos provedores.

| Provedor | Papel | Referências no Código |
|----------|-------|-----------------------|
| **Onbuka** | Primário | 73+ referências |
| **EIMS** | Secundário (3 contas) | Múltiplas instâncias |
| **SMPP (kftel.hk)** | Gateway terciário | Servidores dedicados |

---

## Metodologia

Técnicas de OSINT (Open Source Intelligence) utilizadas:

| Técnica | Ferramenta | O que revelou |
|---------|-----------|---------------|
| Análise de código-fonte (HTML) | `curl` + inspeção manual | Framework, meta tags, scripts externos |
| Análise de bundle JavaScript | `curl` + `grep` por keywords | **Provedores SMS, endpoints, credenciais config** |
| DNS Reconnaissance | `dig`, `nslookup` | Nameservers, ausência de MX/TXT/SPF |
| HTTP Header Analysis | `curl -sI` | Cloudflare, cookie leak `lovable.app` |
| SSL/TLS Inspection | `openssl s_client` | Google Trust Services, cert details |
| IP Intelligence | `ipinfo.io`, `ipapi.co` | Cloudflare anycast, geolocalização |
| WHOIS / Reverse DNS | `whois`, `host` | Registrador Dynadot, sem rDNS |
| Web Search (OSINT) | Múltiplos motores de busca | Presença online mínima |
| API Probing | `curl` em endpoints comuns | API pública Supabase documentada |

---

## Provedores de SMS Identificados

### 1. Onbuka (Provedor Primário)

- **Website**: [onbuka.com](https://onbuka.com)
- **Endpoint API**: `api.onbuka.com`
- **Autenticação**: API Key + API Secret + App ID (hash MD5)
- **Referências no código**: 73+
- **Campos de configuração encontrados**:
  ```
  onbuka_api_key
  onbuka_api_secret
  onbuka_app_id
  ```

Onbuka é um provedor de SMS internacional focado em rotas wholesale/grey para envio em massa. A quantidade massiva de referências no código indica que é o gateway principal para envio de mensagens.

### 2. EIMS (Provedor Secundário)

- **Tipo**: Gateway SMS com múltiplas contas
- **Autenticação**: Account + Password
- **Instâncias configuradas**: 3 contas independentes
- **Campos de configuração encontrados**:
  ```
  eims_account    / eims_password    / eims_servers
  eims_account_1  / eims_password_1  / eims_servers_1
  eims_account_2  / eims_password_2  / eims_servers_2
  eims_account_3  / eims_password_3  / eims_servers_3
  ```

A existência de 3 contas sugere redundância e balanceamento de carga entre diferentes rotas EIMS.

### 3. SMPP Gateway (Provedor Terciário)

- **Protocolo**: SMPP (Short Message Peer-to-Peer)
- **Servidor principal**: `smpp.kftel.hk:20003` (Hong Kong)
- **Domínio fallback**: `biapts.bio`
- **IPs de servidores**:

  | IP | Porta | Função |
  |----|-------|--------|
  | `43.249.30.190` | 20003 | SMPP Produção |
  | `85.195.119.206` | 20003 | SMPP Backup |
  | `147.93.10.215` | — | Provedor SMS (Produção) |
  | `191.96.224.109` | 3000, 9999 | Gateway SMS (Dev/Teste) |

---

## Infraestrutura Completa

### Stack Tecnológico

```
┌─────────────────────────────────────────────┐
│              CLOUDFLARE (CDN/WAF)            │
│         IP Anycast: 185.158.133.1           │
│         CF-Ray: BSB (São Paulo)             │
├─────────────────────────────────────────────┤
│              FRONTEND (SPA)                  │
│  React 18 + Vite + Tailwind CSS             │
│  shadcn/ui + Radix UI + Lucide Icons        │
│  React Flow (editor visual de fluxos)       │
│  i18next (internacionalização pt-BR)        │
│  Construído com: Lovable.dev (no-code IA)   │
├─────────────────────────────────────────────┤
│              BACKEND                         │
│  Supabase (PostgreSQL + Edge Functions)     │
│  Projeto: pikphkcxjtvukdcolviv              │
│  Auth: GoTrue (Supabase Auth)               │
│  Functions: public-api, elevenlabs-voices   │
├─────────────────────────────────────────────┤
│           PROVEDORES SMS                     │
│  ┌──────────┐ ┌──────┐ ┌────────────────┐  │
│  │  Onbuka  │ │ EIMS │ │ SMPP (kftel.hk)│  │
│  │ (73+ ref)│ │(x3)  │ │ porta 20003    │  │
│  └──────────┘ └──────┘ └────────────────┘  │
├─────────────────────────────────────────────┤
│           ANALYTICS                          │
│  Tinybird (flock.js) + Facebook Pixel       │
│  Pixel ID: 1062729962007816                 │
└─────────────────────────────────────────────┘
```

### Detalhes de Infraestrutura

| Componente | Serviço | Evidência |
|------------|---------|-----------|
| CDN/WAF | Cloudflare | Header `server: cloudflare`, cookie `__cf_bm` |
| Hosting | Lovable.dev | Cookie `Domain=lovable.app`, path `/lovable-uploads/` |
| Backend | Supabase | Endpoint `pikphkcxjtvukdcolviv.supabase.co` |
| DNS | Dynadot | NS `ns1.dyna-ns.net`, `ns2.dyna-ns.net` |
| SSL | Google Trust Services | Cert CN=luxfysms.app, issuer WE1, ECDSA 256-bit |
| Analytics | Tinybird + Meta | Script `~flock.js`, Facebook Pixel |
| TTS/Voz | ElevenLabs | Edge function `elevenlabs-voices` |

---

## Domínios Associados

| Domínio | Relação |
|---------|---------|
| `biapts.bio` | Domínio padrão/fallback do gateway SMPP |
| `clnik.bio` | Provedor alternativo |
| `nourishco.online` | Domínio parceiro/afiliado |
| `personbonusx.com` | Domínio parceiro |
| `veja30hs.pro` | Domínio parceiro |
| `lovable.app` | Plataforma de build (Lovable.dev) |

---

## API Pública Descoberta

**Base URL**: `https://pikphkcxjtvukdcolviv.supabase.co/functions/v1/public-api`
**Versão**: 1.1.0

### Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/sendsms` | Enviar mensagens SMS |
| GET | `/balance` | Consultar saldo da conta |
| GET | `/status/{id}` | Verificar status de SMS enviado |
| GET/POST | `/campaign` | Listar/criar campanhas |
| GET/PUT/DELETE | `/campaign/{id}` | Gerenciar campanha específica |
| GET | `/logs` | Visualizar logs de envio |
| GET | `/health` | Health check do serviço |

---

## Evidências Técnicas

### Como o Onbuka foi descoberto

O bundle JavaScript principal (`/assets/index-DX_F-_pt.js`, 2.6 MB) contém 73+ referências ao Onbuka, incluindo:
- Campos de configuração do painel admin (`onbuka_api_key`, `onbuka_api_secret`, `onbuka_app_id`)
- Referência à documentação: "onbuka.com - Autenticação MD5"
- Endpoint de API: `api.onbuka.com`

### Como o EIMS foi descoberto

No mesmo bundle JS, foram encontrados campos de configuração para 3 instâncias independentes do EIMS, com padrão de nomenclatura `eims_account_N` / `eims_password_N` / `eims_servers_N`.

### Como o SMPP foi descoberto

Referências diretas ao servidor `smpp.kftel.hk:20003` e IPs de servidores SMPP (`43.249.30.190`, `85.195.119.206`) foram encontrados no bundle JS, junto com 10+ referências ao protocolo SMPP.

### Como o Lovable.dev foi descoberto

O header HTTP `Set-Cookie` contém `Domain=lovable.app` — um vazamento de cookie que revela que a aplicação foi construída e está hospedada na plataforma Lovable.dev. Além disso, o favicon está em `/lovable-uploads/`.

### Como o Supabase foi descoberto

O bundle JS contém referências ao projeto Supabase `pikphkcxjtvukdcolviv`, incluindo URLs de Edge Functions e configuração de autenticação GoTrue.

---

## Identidade da Plataforma

| Campo | Valor |
|-------|-------|
| Nome | dP SMS |
| Subtítulo | Plataforma Inteligente de Marketing Digital |
| Autor | dP |
| Twitter/X | @dP_oficial |
| Idioma | pt-BR (Português Brasileiro) |
| Público-alvo | Marketing digital / SMS em massa |
| CNPJ | Não encontrado publicamente |

---

## Funcionalidades Identificadas

Além de SMS em massa, a plataforma oferece:

- **Call Center com IA**: Sistema de chamadas com IVR (Interactive Voice Response)
- **Agentes de IA**: Configuração de agentes automatizados para chamadas
- **Editor de Fluxos**: Interface visual (React Flow) para criar fluxos de comunicação
- **Gestão de Campanhas**: Criação, monitoramento e análise de campanhas
- **Importação de Contatos**: Upload via CSV
- **Logs em Tempo Real**: Monitoramento de envios e chamadas
- **TTS (Text-to-Speech)**: Integração com ElevenLabs para síntese de voz
- **Link Tracking**: Analytics de links com rastreamento de cliques

---

## Segurança Observada

- HTTPS obrigatório (HSTS 1 ano com includeSubDomains)
- Cloudflare WAF/DDoS protection ativo
- Credenciais armazenadas com criptografia no banco (`*_encrypted`)
- Source maps desabilitados em produção
- Detecção de WebDriver/bots automatizados
- Sem vazamento de API keys no código-fonte público (chaves no banco)

---

## Conclusões

1. **O provedor principal de SMS é o Onbuka** (`onbuka.com`), um gateway internacional de SMS em massa com foco em rotas wholesale, identificado por 73+ referências no código-fonte.

2. **EIMS é o provedor secundário**, com 3 contas independentes configuradas para redundância e balanceamento de carga.

3. **SMPP via kftel.hk** atua como gateway terciário, com servidores em Hong Kong e Europa.

4. A plataforma foi construída com **Lovable.dev** (plataforma no-code com IA), usa **Supabase** como backend, e está protegida por **Cloudflare**.

5. Além de SMS marketing, a plataforma inclui funcionalidades de **call center com IA** e **síntese de voz** (ElevenLabs).

6. A descoberta foi possível primariamente pela **análise do bundle JavaScript** — um arquivo de 2.6 MB que, por ser uma SPA (Single Page Application), contém toda a lógica da aplicação no lado do cliente, incluindo referências a provedores e configurações.

---

## Metodologia Replicável

Para replicar esta análise em outros sites de SMS marketing:

```bash
# 1. Buscar o HTML e identificar bundles JS
curl -s 'https://alvo.com/' | grep -oP 'src="[^"]*\.js[^"]*"'

# 2. Baixar e analisar o bundle JS principal
curl -s 'https://alvo.com/assets/main.js' | grep -iE \
  "twilio|vonage|nexmo|sinch|plivo|messagebird|infobip|bandwidth|telnyx|zenvia|wavy|comtele|smsdev|onbuka|eims|smpp|kannel"

# 3. Analisar headers HTTP (hosting, CDN, framework)
curl -sI 'https://alvo.com/'

# 4. Verificar DNS (SPF, MX podem revelar provedores)
dig TXT alvo.com
dig MX alvo.com

# 5. Inspecionar certificado SSL
openssl s_client -connect alvo.com:443 -servername alvo.com < /dev/null 2>&1 | \
  openssl x509 -noout -text

# 6. IP intelligence
curl -s https://ipinfo.io/$(dig +short alvo.com | head -1)
```

---

*Análise realizada em 06/02/2026 utilizando técnicas de OSINT (Open Source Intelligence).*
