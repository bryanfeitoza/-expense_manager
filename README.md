# 💰 Gerenciador de Gastos com IA

> Plataforma completa para controle financeiro pessoal com inteligência artificial, disponível em **3 stacks backend independentes** (Node.js, Python, Java).

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)
![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=openjdk&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

[![CI](https://github.com/bryanfeitoza/-expense_manager/actions/workflows/ci.yml/badge.svg)](https://github.com/bryanfeitoza/-expense_manager/actions/workflows/ci.yml)

</div>

## ✨ Diferenciais

- **🔥 Mapa de Calor de Gastos** — Visualize seus gastos diários como um heatmap estilo GitHub Contributions
- **🎯 Orçamentos Inteligentes** — Defina limites mensais por categoria com alertas visuais de progresso
- **🤖 IA Integrada** — Classificação automática, chat financeiro, detecção de anomalias e previsões
- **📊 Dashboard Interativo** — Gráficos dinâmicos com Chart.js e cards com gradientes animados
- **🎨 Design Profissional** — Glassmorfismo, animações fluidas, tema escuro, tipografia Inter
- **⚡ 3 Stacks Backend** — Node.js, Python e Java implementando a mesma API, rodando simultaneamente
- **🔐 Autenticação JWT** — Access token (15min) + Refresh token rotation (7 dias)

## 🚀 Tecnologias

| Stack | Tecnologias |
|-------|------------|
| **Node.js** | Express, Sequelize, JWT, Jest |
| **Python** | FastAPI, SQLAlchemy, Pydantic, pytest |
| **Java** | Spring Boot 3.2, Spring Security, JPA/Hibernate, JUnit |
| **Frontend** | Bootstrap 5 Dark, Chart.js, SPA, Inter Font |
| **Banco** | PostgreSQL 16 |
| **Proxy** | Nginx (roteamento `/` → Node, `/python/` → Python, `/java/` → Java) |
| **Infra** | Docker Compose, GitHub Actions CI |

## 🏗️ Arquitetura

```
                    ┌─────────────┐
                    │   Nginx:80   │
                    │  Proxy Reverso│
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
     ┌──────────┐   ┌──────────┐   ┌──────────┐
     │  Node.js │   │  Python  │   │   Java   │
     │  :3000   │   │  :8000   │   │  :8080   │
     │ Express  │   │ FastAPI  │   │ Spring   │
     └────┬─────┘   └────┬─────┘   └────┬─────┘
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                  ┌──────────────┐
                  │  PostgreSQL  │
                  │    :5432     │
                  └──────────────┘
```

### Rotas do Nginx
| Rota | Backend | Descrição |
|------|---------|-----------|
| `/` | Node.js :3000 | API + Frontend SPA |
| `/python/` | Python :8000 | FastAPI |
| `/java/` | Java :8080 | Spring Boot |
| `/health` | — | Health check |

## 📦 Estrutura do Projeto

```
├── .env.example              # Variáveis de ambiente
├── docker-compose.yml        # Orquestração Docker
├── init.sql                  # Script inicial do banco + migrações
├── nginx.conf                # Configuração do proxy reverso
├── README.md
├── .github/workflows/ci.yml  # CI/CD
│
├── node/                     # 🟢 Stack Node.js
│   ├── Dockerfile
│   ├── package.json
│   ├── seed.js
│   ├── src/
│   │   ├── app.js / server.js
│   │   ├── config/database.js
│   │   ├── models/           # 8 modelos (User, Transaction, Category, Account, Budget, etc)
│   │   ├── controllers/      # 9 controllers
│   │   ├── routes/           # 10 módulos de rota
│   │   ├── middleware/       # Auth, validação, erros
│   │   └── services/         # Token, IA (OpenAI/Claude + fallback simulado)
│   ├── public/               # Frontend SPA
│   │   ├── index.html
│   │   ├── css/style.css     # Design system completo
│   │   └── js/app.js, api.js
│   └── tests/
│
├── python/                   # 🐍 Stack Python
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py / config.py / database.py
│       ├── models/ / controllers/ / routes/
│       ├── middleware/ / services/
│       └── tests/
│
├── java/                     # ☕ Stack Java
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/gerenciador/
│       ├── GerenciadorApplication.java
│       ├── config/ / model/ / controller/
│       ├── repository/ / service/ / dto/
│       ├── security/ / exception/
│       └── test/
```

## ⚙️ Instalação e Execução

### Pré-requisitos
- [Docker](https://docs.docker.com/get-docker/) + Docker Compose
- (Opcional) Node.js 20, Python 3.11, Java 21 para execução local

### Com Docker Compose (recomendado)

```bash
# Clone e entre no diretório
git clone https://github.com/bryanfeitoza/-expense_manager.git
cd -expense_manager

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações (especialmente AI_API_KEY)

# Inicie todos os serviços
docker-compose up -d

# Acesse:
# Frontend + API Node.js: http://localhost
# Login admin: admin@email.com / admin123

# Para reconstruir após alterações:
docker-compose up -d --build node && docker-compose restart nginx
```

### Credenciais Padrão
- **Email:** `admin@email.com`
- **Senha:** `admin123`

## 🔥 Funcionalidades Principais

### 📊 Dashboard
- Cards animados com saldo total, receitas/despesas do mês e balanço
- Gráfico de barras com evolução mensal
- Gráfico de rosca com gastos por categoria
- Tabela detalhada com porcentagens

### 📋 Transações
- CRUD completo com busca, filtros por tipo/categoria/período
- Classificação automática por IA (categoria sugerida pela descrição)
- Paginação com navegação inteligente
- Exportar para CSV

### 🗓️ Calendário de Gastos (Heatmap)
- Mapa de calor estilo GitHub Contributions
- 5 níveis de intensidade de gasto por dia
- Tooltip com valor ao passar o mouse
- Estatísticas: total do ano, média diária, maior gasto
- Indicador visual do dia atual

### 🎯 Orçamentos Mensais
- Defina limites por categoria ou orçamento geral
- Progress ring animado (SVG) com cores indicativas
- Alertas em 80% do limite
- Cards organizados com status visual

### 🤖 IA Financeira
- **Chat Financeiro** em linguagem natural
- **Classificação Inteligente** de gastos
- **Detecção de Anomalias** (gastos fora do padrão)
- **Previsão de Despesas** baseada em histórico
- **Dicas Personalizadas** de economia
- Fallback para respostas simuladas quando sem API key

### 📈 Relatórios
- Gastos por categoria com gráfico de rosca
- Evolução mensal com gráfico de barras
- Tabela detalhada com barras de porcentagem
- Exportação CSV

## 🔑 Autenticação JWT

| Conceito | Detalhe |
|----------|---------|
| Access Token | 15 minutos |
| Refresh Token | 7 dias (com rotação) |
| Armazenamento | localStorage |
| Renovação | Automática via interceptor 401 |

### Fluxo:
1. `POST /api/auth/login` → `{ accessToken, refreshToken, user }`
2. Header: `Authorization: Bearer <accessToken>`
3. 401 → `POST /api/auth/refresh` → novo par de tokens
4. `POST /api/auth/logout` revoga o refresh token

## 📊 Endpoints da API

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Dados do usuário |

### Transações
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/transactions` | Listar (paginação, filtros) |
| GET | `/api/transactions/:id` | Detalhes |
| POST | `/api/transactions` | Criar (com IA opcional) |
| PUT | `/api/transactions/:id` | Atualizar |
| DELETE | `/api/transactions/:id` | Excluir |

### Dashboard
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/dashboard/summary` | Resumo financeiro |
| GET | `/api/dashboard/monthly-evolution` | Evolução mensal |
| GET | `/api/dashboard/category-breakdown` | Gastos por categoria |
| GET | `/api/dashboard/calendar` | Dados do heatmap |

### Orçamentos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/budgets` | Listar orçamentos (filtro mês/ano) |
| GET | `/api/budgets/:id` | Detalhes |
| POST | `/api/budgets` | Criar |
| PUT | `/api/budgets/:id` | Atualizar |
| DELETE | `/api/budgets/:id` | Excluir |

### IA
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/ai/classify` | Classificar gasto |
| POST | `/api/ai/analyze` | Análise em linguagem natural |
| GET | `/api/ai/anomalies` | Detectar anomalias |
| GET | `/api/ai/predict` | Prever despesas |
| GET | `/api/ai/tips` | Dicas financeiras |
| POST | `/api/ai/chat` | Chat financeiro |

### Categorias, Contas, Metas, Relatórios
CRUD similar em `/api/categories`, `/api/accounts`, `/api/saving-goals`, `/api/reports/*`

### Frontend (SPA)
Todas as páginas disponíveis via hash routing:
- `#dashboard` — Dashboard principal
- `#transactions` — Transações
- `#calendar-heatmap` — Calendário de gastos
- `#categories` — Categorias
- `#accounts` — Contas
- `#goals` — Metas
- `#budgets` — Orçamentos
- `#ai` — IA Financeira
- `#reports` — Relatórios

## 🧪 Testes

```bash
# Node.js (Jest)
cd node && npm test

# Python (pytest)
cd python && pytest tests/ -v

# Java (JUnit)
cd java && mvn test
```

O CI (GitHub Actions) executa os 3 em paralelo a cada push.

## 🐳 Docker

```bash
# Construir e iniciar tudo
docker-compose up -d

# Logs
docker-compose logs -f

# Reconstruir Node.js
docker-compose up -d --build node && docker-compose restart nginx

# Parar
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT
