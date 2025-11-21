import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient.js';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import { parseISO, isValid } from 'date-fns';

export const useAppointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    if (!user) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .not('agendamento', 'is', null);

      if (error) {
        throw error;
      }
      
      const validAppointments = data.filter(lead => lead.agendamento && isValid(parseISO(lead.agendamento)));
      setAppointments(validAppointments);

    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast({
        title: 'Erro ao buscar agendamentos',
        description: error.message,
        variant: 'destructive',
      });
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);
  
  const events = useMemo(() => appointments.map(lead => ({
    title: lead.nome,
    start: parseISO(lead.agendamento),
    end: parseISO(lead.agendamento),
    resource: lead,
  })), [appointments]);

  return { appointments, events, loading, fetchAppointments };
};