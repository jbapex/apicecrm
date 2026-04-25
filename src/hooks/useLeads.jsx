import React, { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useLeadsData } from '@/hooks/leads/useLeadsData';
import { useLeadsFiltering } from '@/hooks/leads/useLeadsFiltering';
import { useLeadsActions } from '@/hooks/leads/useLeadsActions';
import useLeadsMetrics from '@/hooks/leads/useLeadsMetrics.js';
import { useLeadsExport } from '@/hooks/leads/useLeadsExport';
import { useLeadsUI } from '@/hooks/leads/useLeadsUI';

export const useLeads = () => {
  const { settings } = useSettings();
  const {
    leads,
    setLeads,
    loading,
    fetchLeads,
    hasMore,
    resetAndFetch,
    vendasTotals,
    vendasTotalsLoading,
  } = useLeadsData();

  const [filters, setFilters] = useState({
    status: 'todos',
    vendedor: 'todos',
    product: '',
    month: 'all',
    year: 'all',
    monthMode: 'entrada',
    dateRange: null,
    mode: 'list',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const refetchLeads = useCallback(() => {
    resetAndFetch(searchTerm, filters);
  }, [resetAndFetch, filters, searchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => {
      refetchLeads();
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [filters, searchTerm]);

  const loadMoreLeads = useCallback(() => {
    if (!loading && hasMore) {
      fetchLeads(searchTerm, filters, false);
    }
  }, [loading, hasMore, fetchLeads, filters, searchTerm]);

  const { filteredLeads } = useLeadsFiltering(leads);
  const metrics = useLeadsMetrics(leads, filters);
  
  const actions = useLeadsActions(setLeads, refetchLeads, settings);
  const { exportData } = useLeadsExport(filteredLeads);
  const { getStatusIcon, getStatusText, parseDateString } = useLeadsUI();

  return {
    leads: filteredLeads,
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
    loadMoreLeads,
    hasMore,
    vendasTotals,
    vendasTotalsLoading,
  };
};