import { useState, useEffect, useCallback } from 'react';
import { useLeadsData } from '@/hooks/leads/useLeadsData';
import { useLeadsFiltering } from '@/hooks/leads/useLeadsFiltering';
import { useLeadsActions } from '@/hooks/leads/useLeadsActions';
import useLeadsMetrics from '@/hooks/leads/useLeadsMetrics.js';
import { useLeadsExport } from '@/hooks/leads/useLeadsExport';
import { useLeadsUI } from '@/hooks/leads/useLeadsUI';

export const useLeads = () => {
  const [leads, setLeads, loading, fetchLeads] = useLeadsData();

  const [filters, setFilters] = useState({
    status: 'todos',
    vendedor: 'todos',
    product: '',
    month: 'all',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const refetchLeads = useCallback(() => {
    fetchLeads(filters.month);
  }, [fetchLeads, filters.month]);

  useEffect(() => {
    refetchLeads();
  }, [refetchLeads]);

  const { filteredLeads } = useLeadsFiltering(leads, searchTerm, filters);
  const metrics = useLeadsMetrics(leads, filters);
  
  const actions = useLeadsActions(setLeads, refetchLeads);
  const { exportData } = useLeadsExport(filteredLeads);
  const { getStatusIcon, getStatusText, parseDateString } = useLeadsUI();

  return {
    leads,
    setLeads,
    loading,
    refetchLeads,
    metrics,
    filteredLeads,
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
    ...actions,
    exportData,
    getStatusIcon,
    getStatusText,
    parseDateString,
  };
};