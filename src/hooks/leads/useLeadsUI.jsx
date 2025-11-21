import React, { useCallback } from 'react';
import { Clock, AlertCircle, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { parseDate } from '@/lib/leadUtils.js'; // Corrected import name

export const useLeadsUI = () => {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'agendado': return <Clock className="w-4 h-4" />;
            case 'compareceu': return <AlertCircle className="w-4 h-4" />;
            case 'vendeu': return <CheckCircle className="w-4 h-4" />;
            case 'nao_compareceu': return <XCircle className="w-4 h-4" />;
            default: return <HelpCircle className="w-4 h-4" />;
        }
    };

    const getStatusText = (status) => {
        return status ? status.replace(/_/g, ' ') : 'N/A';
    };

    const parseDateString = useCallback((dateString) => {
        return parseDate(dateString);
    }, []);

    return { getStatusIcon, getStatusText, parseDateString };
};