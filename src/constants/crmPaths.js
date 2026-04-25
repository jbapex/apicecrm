/**
 * Rotas do CRM (URLs estáveis para cada página).
 * Use estes paths em navigate(), NavLink e redirects.
 */
export const CRM_PATHS = {
  dashboard: '/dashboard',
  leads: '/leads',
  agendamentos: '/agendamentos',
  analiseSemanal: '/analise-semanal',
  relatorios: '/relatorios',
  /** Detalhe de origem: `navigate(..., { state: { origin, dateRange } })` */
  relatoriosOrigem: '/relatorios/origem',
  followUp: '/follow-up',
  followUpAutomacoes: '/follow-up/automacoes',
  followUpLogs: '/follow-up/logs',
  caixaEntrada: '/caixa-entrada',
  integracoesApicebot: '/integracoes/apicebot',
  integracoesWebhooks: '/integracoes/webhooks',
  integracoesTintimWebhook: '/integracoes/tintim-webhook',
  integracoesTintimLeads: '/integracoes/tintim-leads',
  configuracoes: '/configuracoes',
};

/** id usado no menu legado → path */
export const CRM_TAB_TO_PATH = {
  dashboard: CRM_PATHS.dashboard,
  leads: CRM_PATHS.leads,
  agendamentos: CRM_PATHS.agendamentos,
  week: CRM_PATHS.analiseSemanal,
  relatorios: CRM_PATHS.relatorios,
  'follow-up': CRM_PATHS.followUp,
  'follow-up-flow': CRM_PATHS.followUpAutomacoes,
  'follow-up-logs': CRM_PATHS.followUpLogs,
  'staged-leads': CRM_PATHS.caixaEntrada,
  apicebot: CRM_PATHS.integracoesApicebot,
  webhooks: CRM_PATHS.integracoesWebhooks,
  'tintim-webhook': CRM_PATHS.integracoesTintimWebhook,
  'tintim-leads': CRM_PATHS.integracoesTintimLeads,
  settings: CRM_PATHS.configuracoes,
};

/** Título do header por path (prefix match: primeiro que casar) */
export const CRM_PATH_TITLE = [
  { prefix: CRM_PATHS.relatoriosOrigem, title: 'Detalhe da origem' },
  { prefix: CRM_PATHS.relatorios, title: 'Relatórios' },
  { prefix: CRM_PATHS.followUpAutomacoes, title: 'Automações' },
  { prefix: CRM_PATHS.followUpLogs, title: 'Logs de flow' },
  { prefix: CRM_PATHS.followUp, title: 'Follow-up' },
  { prefix: CRM_PATHS.integracoesApicebot, title: 'Integração ÁpiceBot' },
  { prefix: CRM_PATHS.integracoesWebhooks, title: 'Webhook Genérico' },
  { prefix: CRM_PATHS.integracoesTintimWebhook, title: 'Webhook Tintim' },
  { prefix: CRM_PATHS.integracoesTintimLeads, title: 'Leads Tintim' },
  { prefix: CRM_PATHS.configuracoes, title: 'Configurações' },
  { prefix: CRM_PATHS.caixaEntrada, title: 'Caixa de Entrada' },
  { prefix: CRM_PATHS.analiseSemanal, title: 'Análise Semanal' },
  { prefix: CRM_PATHS.agendamentos, title: 'Agendamentos' },
  { prefix: CRM_PATHS.leads, title: 'Gestão de Leads' },
  { prefix: CRM_PATHS.dashboard, title: 'Dashboard' },
];

export function getTitleForPath(pathname) {
  const p = pathname || '';
  for (const { prefix, title } of CRM_PATH_TITLE) {
    if (p === prefix || p.startsWith(`${prefix}/`)) return title;
  }
  return 'Dashboard';
}

/** Maior prefixo primeiro, para casar `/follow-up/automacoes` antes de `/follow-up`. */
export function getTabIdFromPathname(pathname) {
  const p = pathname || '';
  const entries = Object.entries(CRM_TAB_TO_PATH).sort(
    (a, b) => b[1].length - a[1].length
  );
  for (const [tabId, path] of entries) {
    if (p === path || p.startsWith(`${path}/`)) return tabId;
  }
  return 'dashboard';
}
