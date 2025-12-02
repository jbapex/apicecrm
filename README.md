# Apice CRM

Sistema completo de CRM (Customer Relationship Management) desenvolvido com React e Supabase, focado em gestão de leads, agendamentos, follow-up e análises de desempenho.

## 🚀 Funcionalidades

### Gestão de Leads
- ✅ Cadastro e edição de leads
- ✅ Visualização em tabela e kanban
- ✅ Filtros avançados (status, vendedor, origem, data)
- ✅ Importação em massa via CSV
- ✅ Histórico de conversas e mensagens
- ✅ Agendamento de atendimentos
- ✅ Acompanhamento de status e conversões

### Caixa de Entrada
- ✅ Recebimento automático de leads via webhooks
- ✅ Integração com Tintim
- ✅ Webhook genérico configurável
- ✅ Processamento em lote de leads

### Análise e Relatórios
- ✅ Dashboard com métricas em tempo real
- ✅ Análise semanal de desempenho
- ✅ Relatórios automáticos configuráveis
- ✅ Gráficos e visualizações interativas
- ✅ Cálculo de ROAS, CPL, CPV e taxas de conversão

### Automações
- ✅ Fluxos de automação visual (Flow Builder)
- ✅ Mensagens automáticas via WhatsApp
- ✅ Triggers e ações condicionais
- ✅ Logs de execução de fluxos

### Configurações
- ✅ Gestão de status personalizados
- ✅ Origens e sub-origens configuráveis
- ✅ Campos customizados
- ✅ Integrações (ApiceBot, Tintim, Webhooks)
- ✅ Backup e exportação de dados

## 🛠️ Tecnologias

- **Frontend**: React 18, Vite
- **UI**: Tailwind CSS, Radix UI, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Functions)
- **Roteamento**: React Router DOM
- **Gráficos**: Recharts
- **Calendário**: React Big Calendar
- **PWA**: Vite Plugin PWA

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/jbapex/apicecrm.git
cd apicecrm
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com:
```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

4. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

O sistema estará disponível em `http://localhost:3000` (ou na porta configurada).

## 🏗️ Build para Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

## 📁 Estrutura do Projeto

```
apicecrrm/
├── src/
│   ├── components/      # Componentes React
│   │   ├── app/         # Layout e navegação
│   │   ├── leads/       # Componentes de leads
│   │   ├── modals/      # Modais do sistema
│   │   ├── ui/          # Componentes UI reutilizáveis
│   │   └── ...
│   ├── contexts/        # Contextos React (Auth, Settings)
│   ├── hooks/           # Custom hooks
│   ├── pages/           # Páginas principais
│   ├── lib/             # Utilitários
│   └── supabase/        # Funções Supabase Edge
├── public/              # Arquivos estáticos
└── package.json
```

## 🔐 Autenticação

O sistema utiliza autenticação via Supabase Auth. Os usuários precisam estar autenticados para acessar as funcionalidades.

## 📊 Banco de Dados

O sistema utiliza as seguintes tabelas principais no Supabase:
- `leads` - Cadastro de leads
- `staged_leads` - Caixa de entrada
- `investments` - Investimentos semanais
- `user_settings` - Configurações do usuário
- `tintim_messages` - Mensagens do Tintim
- `flow_logs` - Logs de execução de fluxos

## 🔗 Integrações

### Tintim
Configure o webhook Tintim nas configurações para receber leads automaticamente na caixa de entrada.

### ApiceBot
Integração com ApiceBot para envio de mensagens automáticas via WhatsApp.

### Webhooks Genéricos
Configure webhooks personalizados para receber leads de outras fontes.

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Preview do build de produção

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📄 Licença

Este projeto é privado e proprietário.

## 👤 Autor

Desenvolvido por [jbapex](https://github.com/jbapex)

---

Para mais informações, acesse: https://github.com/jbapex/apicecrm

