import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, PlusCircle, AlertTriangle, Loader2, Trash2, Edit, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, addDays, addMonths, addWeeks, set, nextDay, startOfDay, parseISO, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import AutomaticReportFormModal from '@/components/modals/AutomaticReportFormModal';
import { useMessage } from '@/contexts/MessageContext';

const AutomaticReports = () => {
  const { toast } = useToast();
  const { sendMessage, isSending } = useMessage();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [deletingReport, setDeletingReport] = useState(null);
  const [sendingTestId, setSendingTestId] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('automatic_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Erro ao buscar relatórios',
        description: 'Não foi possível carregar os relatórios automáticos.',
        variant: 'destructive',
      });
    } else {
      setReports(data);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleToggleActive = async (report) => {
    const newStatus = !report.is_active;
    const { error } = await supabase
      .from('automatic_reports')
      .update({ is_active: newStatus })
      .eq('id', report.id);

    if (error) {
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível alterar o status do relatório.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: `Relatório ${newStatus ? 'ativado' : 'desativado'}!`,
        description: `O relatório "${report.name}" foi ${newStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });
      fetchReports();
    }
  };

  const handleDeleteReport = async () => {
    if (!deletingReport) return;

    const { error } = await supabase
      .from('automatic_reports')
      .delete()
      .eq('id', deletingReport.id);

    if (error) {
      toast({
        title: 'Erro ao excluir relatório',
        description: 'Não foi possível excluir o relatório.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Relatório excluído!',
        description: `O relatório "${deletingReport.name}" foi excluído com sucesso.`,
      });
      fetchReports();
    }
    setDeletingReport(null);
  };

  const handleTestSend = async (report) => {
    setSendingTestId(report.id);
    try {
      const { data, error } = await supabase.functions.invoke('send-automatic-report', {
        body: { report_id: report.id, generate_only: true },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const messageToSend = data.message;
      const leadInfo = {
        id: report.id, // Using report id as a stand-in for lead id for logging
        nome: 'Teste de Relatório',
        whatsapp: report.recipient,
        status: 'teste'
      };

      const success = await sendMessage(leadInfo, messageToSend, true); // Pass true to skip variable replacement

      if (success) {
        toast({
          title: 'Envio de teste iniciado!',
          description: 'O relatório de teste está sendo enviado para o destinatário.',
        });
      }
      // Error toast is handled by sendMessage hook

    } catch (error) {
      toast({
        title: 'Erro no envio de teste',
        description: error.message || 'Não foi possível gerar ou enviar o relatório de teste.',
        variant: 'destructive',
      });
    } finally {
      setSendingTestId(null);
    }
  };

  const handleSaveReport = () => {
    setIsModalOpen(false);
    setEditingReport(null);
    fetchReports();
  };

  const openCreateModal = () => {
    setEditingReport(null);
    setIsModalOpen(true);
  };

  const openEditModal = (report) => {
    setEditingReport(report);
    setIsModalOpen(true);
  };

  const getNextSendDate = (report) => {
    if (!report.is_active) return 'Pausado';
    
    const now = new Date();
    const [hours, minutes] = report.send_time.split(':');
    const startDate = report.start_date ? parseISO(report.start_date) : startOfDay(now);
    
    let firstSendDateTime = set(startDate, { hours: parseInt(hours), minutes: parseInt(minutes), seconds: 0, milliseconds: 0 });

    if (isBefore(firstSendDateTime, now)) {
        let nextDate = firstSendDateTime;
        switch (report.frequency) {
            case 'daily':
                while (isBefore(nextDate, now)) {
                    nextDate = addDays(nextDate, 1);
                }
                break;
            case 'weekly':
                const targetDay = report.send_day_of_week;
                nextDate = set(nextDay(startOfDay(now), targetDay), { hours: parseInt(hours), minutes: parseInt(minutes) });
                if (isBefore(nextDate, now)) {
                    nextDate = addWeeks(nextDate, 1);
                }
                break;
            case 'monthly':
                const targetDate = report.send_day_of_month;
                nextDate = set(now, { date: targetDate, hours: parseInt(hours), minutes: parseInt(minutes) });
                if (isBefore(nextDate, now)) {
                    nextDate = addMonths(nextDate, 1);
                }
                break;
            default:
                return 'Inválido';
        }
        return format(nextDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    }
    
    return format(firstSendDateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const reportTypeLabels = {
    general_performance: 'Desempenho Geral',
    sellers_analysis: 'Análise de Vendedores',
    origin_conversion: 'Conversão por Origem',
    product_report: 'Relatório de Produtos',
  };

  const frequencyLabels = {
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal',
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Bot className="h-6 w-6 text-blue-500" />
                Relatórios Automáticos
              </CardTitle>
              <CardDescription>Configure envios automáticos de relatórios para o WhatsApp.</CardDescription>
            </div>
            <Button onClick={openCreateModal}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Novo Relatório
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700">Nenhum relatório automático configurado</h3>
                <p className="text-sm text-gray-500 mt-2 mb-6">Comece criando seu primeiro relatório para receber atualizações automáticas.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Próximo Envio</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>{reportTypeLabels[report.report_type] || report.report_type}</TableCell>
                      <TableCell>{frequencyLabels[report.frequency] || report.frequency}</TableCell>
                      <TableCell>{getNextSendDate(report)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={report.is_active}
                          onCheckedChange={() => handleToggleActive(report)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleTestSend(report)} disabled={sendingTestId === report.id || isSending}>
                          {sendingTestId === report.id || isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 text-blue-500" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(report)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingReport(report)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {isModalOpen && (
        <AutomaticReportFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingReport(null);
          }}
          onSave={handleSaveReport}
          report={editingReport}
        />
      )}

      <AlertDialog open={!!deletingReport} onOpenChange={() => setDeletingReport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o relatório automático "{deletingReport?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReport} className="bg-red-500 hover:bg-red-600">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AutomaticReports;