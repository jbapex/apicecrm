import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import { useStagedLeads } from '@/hooks/useStagedLeads.js';
import Layout from '@/components/app/Layout';
import AddLeadModal from '@/components/modals/AddLeadModal';
import ImportLeadsModal from '@/components/modals/ImportLeadsModal';
import AuthPage from '@/pages/AuthPage';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { MessageProvider } from '@/contexts/MessageContext';
import AddCommentModal from '@/components/modals/AddCommentModal';
import LeadDetailModal from '@/components/modals/LeadDetailModal';
import DuplicateLeadDialog from '@/components/leads/DuplicateLeadDialog';
import { useLeads } from '@/hooks/useLeads';
import { useSettings } from '@/contexts/SettingsContext';
import useDashboardMetrics from '@/hooks/useDashboardMetrics';

const DashboardContent = lazy(() => import('@/pages/DashboardContent'));
const LeadsContent = lazy(() => import('@/pages/LeadsContent'));
const AgendamentosContent = lazy(() => import('@/pages/AgendamentosContent'));
const WeekContent = lazy(() => import('@/pages/WeekContent'));
const SettingsContent = lazy(() => import('@/pages/SettingsContent'));
const FollowUpContent = lazy(() => import('@/pages/FollowUpContent'));
const ApiceBotIntegration = lazy(() => import('@/pages/ApiceBotIntegration'));
const WebhooksIntegration = lazy(() => import('@/pages/WebhooksIntegration'));
const TintimIntegration = lazy(() => import('@/pages/TintimIntegration'));
const TintimLeadsContent = lazy(() => import('@/pages/TintimLeadsContent'));
const StagedLeadsContent = lazy(() => import('@/pages/StagedLeadsContent'));
const FollowUpFlowContent = lazy(() => import('@/pages/FollowUpFlowContent'));
const FlowLogsContent = lazy(() => import('@/pages/FlowLogsContent'));
const RelatoriosContent = lazy(() => import('@/pages/RelatoriosContent'));
const OriginDetailsContent = lazy(() => import('@/pages/OriginDetailsContent'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const AppContent = () => {
  const { settings, getStatusText: settingsGetStatusText, loading: settingsLoading } = useSettings();
  const { stagedLeadsCount } = useStagedLeads();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddLead, setShowAddLead] = useState(false);
  const [showImportLeads, setShowImportLeads] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(null);
  const [showLeadDetail, setShowLeadDetail] = useState(null);
  const [duplicateLeadInfo, setDuplicateLeadInfo] = useState(null);
  const [reportView, setReportView] = useState({ type: 'main' });
  
  const leadsHook = useLeads();
  const dashboardHook = useDashboardMetrics();

  const handleAddLeadWithDuplicateCheck = async (leadData) => {
    const result = await leadsHook.handleAddLead(leadData);
    if (result.duplicate) {
      setDuplicateLeadInfo({
        existingLead: result.existingLead,
        newLeadData: leadData,
      });
    }
    return result;
  };

  const confirmUpdateDuplicate = () => {
    if (duplicateLeadInfo) {
      leadsHook.updateExistingLead(duplicateLeadInfo.existingLead, duplicateLeadInfo.newLeadData);
      setDuplicateLeadInfo(null);
    }
  };

  const cancelUpdateDuplicate = () => {
    setDuplicateLeadInfo(null);
  };

  const onShowComments = (leadId) => {
    setShowCommentModal(leadId);
  };

  const onShowLeadDetail = (lead) => {
    setShowLeadDetail(lead);
  };

  const handleNavigateToOriginDetails = (origin, dateRange) => {
    setReportView({ type: 'originDetails', origin, dateRange });
    setActiveTab('relatorios');
  };

  const handleBackToReports = () => {
    setReportView({ type: 'main' });
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent 
                  dashboardHook={dashboardHook}
                  stagedLeadsCount={stagedLeadsCount}
                />;
      case 'leads':
        return (
          <LeadsContent
            leadsHook={leadsHook}
            onShowComments={onShowComments}
            onShowLeadDetail={onShowLeadDetail}
            onAddNewLead={() => setShowAddLead(true)}
          />
        );
      case 'agendamentos':
        return (
          <AgendamentosContent
            onUpdateLead={leadsHook.handleUpdateLead}
            getStatusIcon={leadsHook.getStatusIcon}
            getStatusText={leadsHook.getStatusText}
            statuses={settings?.statuses || []}
          />
        );
      case 'week':
        return <WeekContent />;
      case 'relatorios':
        if (reportView.type === 'originDetails') {
          return <OriginDetailsContent 
                    origin={reportView.origin} 
                    dateRange={reportView.dateRange}
                    onBack={handleBackToReports} 
                    onShowLeadDetail={onShowLeadDetail}
                  />;
        }
        return <RelatoriosContent onNavigateToOriginDetails={handleNavigateToOriginDetails} />;
      case 'follow-up':
        return <FollowUpContent onUpdateLead={leadsHook.handleUpdateLead} />;
      case 'follow-up-flow':
        return <FollowUpFlowContent />;
      case 'follow-up-logs':
        return <FlowLogsContent />;
      case 'apicebot':
        return <ApiceBotIntegration />;
      case 'staged-leads':
        return <StagedLeadsContent />;
      case 'webhooks':
        return <WebhooksIntegration />;
      case 'tintim-webhook':
        return <TintimIntegration />;
      case 'tintim-leads':
        return <TintimLeadsContent />;
      case 'settings':
        return <SettingsContent onImportClick={() => setShowImportLeads(true)} />;
      default:
        return <DashboardContent 
                  dashboardHook={dashboardHook}
                  stagedLeadsCount={stagedLeadsCount}
                />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Ápice CRM - Sistema de Gestão de Leads</title>
        <meta name="description" content="Sistema completo para gestão de leads e agendamentos da Ápice CRM" />
        <link rel="manifest" href="/manifest.json" />
      </Helmet>
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setShowAddLead={setShowAddLead}
        stagedLeadsCount={stagedLeadsCount}
      >
        <Suspense fallback={<PageLoader />}>
          {renderContent()}
        </Suspense>
      </Layout>

      <AnimatePresence>
        {showAddLead && (
          <AddLeadModal
            isOpen={showAddLead}
            onClose={() => setShowAddLead(false)}
            onSave={async (leadData) => {
              const result = await handleAddLeadWithDuplicateCheck(leadData);
              if (!result.duplicate) {
                setShowAddLead(false);
              }
            }}
          />
        )}
        {showImportLeads && (
          <ImportLeadsModal
            isOpen={showImportLeads}
            onClose={() => setShowImportLeads(false)}
          />
        )}
        {showCommentModal && (
          <AddCommentModal
            isOpen={!!showCommentModal}
            onClose={() => setShowCommentModal(null)}
            leadId={showCommentModal}
          />
        )}
         {showLeadDetail && (
          <LeadDetailModal
            isOpen={!!showLeadDetail}
            onClose={() => setShowLeadDetail(null)}
            lead={showLeadDetail}
            getStatusText={settingsGetStatusText}
          />
        )}
      </AnimatePresence>
      <DuplicateLeadDialog
        isOpen={!!duplicateLeadInfo}
        onCancel={cancelUpdateDuplicate}
        onConfirm={() => {
          confirmUpdateDuplicate();
          setShowAddLead(false);
        }}
        existingLead={duplicateLeadInfo?.existingLead}
        newLeadData={duplicateLeadInfo?.newLeadData}
      />
    </>
  );
};


function App() {
  const { session, loading: authLoading } = useAuth();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (event) => {
      const errorReason = event.reason || event.error;
      if (errorReason && errorReason.message) {
        const msg = errorReason.message.toLowerCase();
        if (msg.includes('invalid refresh token') || msg.includes("failed to fetch") || msg.includes("401")) {
          console.warn("Ignoring auth-related error in global handler:", errorReason.message);
          return;
        }
      }
      setHasError(true);
    };
    
    const errorHandler = (event) => handleError(event);
    const unhandledRejectionHandler = (event) => handleError(event);

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
    };
  }, []);
  
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-center p-4">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Ops! Algo deu errado.</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">Pedimos desculpas, mas encontramos um problema inesperado. Por favor, tente recarregar a página.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors"
        >
          Recarregar
        </button>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <SettingsProvider key={session?.user?.id}>
      <MessageProvider>
        {session ? (
          <AppContent key={session.user.id} />
        ) : (
          <>
            <Helmet>
              <title>Acesso - Ápice CRM</title>
              <meta name="description" content="Acesse o sistema de gestão de leads da Ápice CRM." />
            </Helmet>
            <AuthPage />
          </>
        )}
        <Toaster />
      </MessageProvider>
    </SettingsProvider>
  );
}

export default App;