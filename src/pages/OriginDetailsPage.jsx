import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import OriginDetailsContent from '@/pages/OriginDetailsContent';
import { CRM_PATHS } from '@/constants/crmPaths';

/**
 * Rota /relatorios/origem — state: { origin, dateRange } vindo de Relatórios.
 */
const OriginDetailsPage = ({ onShowLeadDetail }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { origin, dateRange } = location.state || {};

  useEffect(() => {
    if (!origin) {
      navigate(CRM_PATHS.relatorios, { replace: true });
    }
  }, [origin, navigate]);

  if (!origin) {
    return null;
  }

  return (
    <OriginDetailsContent
      origin={origin}
      dateRange={dateRange}
      onBack={() => navigate(CRM_PATHS.relatorios)}
      onShowLeadDetail={onShowLeadDetail}
    />
  );
};

export default OriginDetailsPage;
