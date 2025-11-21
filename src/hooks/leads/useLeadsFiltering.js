import { useMemo } from 'react';

export const useLeadsFiltering = (leads) => {
    const filteredLeads = useMemo(() => {
      if (!leads) return [];
      // Filtering is now done server-side. This hook just passes the data through.
      // It can be used for client-side sorting if needed.
      return leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [leads]);

    return { filteredLeads };
};