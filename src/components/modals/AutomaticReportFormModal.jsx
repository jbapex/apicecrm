import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

const reportVariables = [
  { label: 'Total de Leads', value: '{{total_leads}}' },
  { label: 'Agendamentos', value: '{{agendamentos}}' },
  { label: 'Comparecimentos', value: '{{comparecimentos}}' },
  { label: 'Vendas', value: '{{vendas}}' },
  { label: 'Faturamento', value: '{{faturamento}}' },
  { label: 'Taxa de Conversão', value: '{{taxa_conversao}}' },
  { label: 'Resumo do Funil', value: '{{resumo_funil}}' },
  { label: 'Principais Origens', value: '{{principais_origens}}' },
  { label: 'Leads na Fila', value: '{{leads_na_fila}}' },
];

const periodOptions = [
    { value: 'last_day', label: 'Último dia' },
    { value: 'last_7_days', label: 'Últimos 7 dias' },
    { value: 'last_15_days', label: 'Últimos 15 dias' },
    { value: 'last_30_days', label: 'Últimos 30 dias' },
    { value: 'custom', label: 'Personalizado' },
];

const AutomaticReportFormModal = ({ isOpen, onClose, onSave, report }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    report_type: 'general_performance',
    frequency: '',
    send_time: '09:00',
    send_day_of_week: '1',
    send_day_of_month: '1',
    recipient: '',
    start_date: new Date(),
    message_template: '',
    period_type: 'last_30_days',
    period_start_date: null,
    period_end_date: null,
  });
  const [loading, setLoading] = useState(false);
  const messageTemplateRef = useRef(null);

  useEffect(() => {
    if (report) {
      setFormData({
        name: report.name || '',
        report_type: report.report_type || 'general_performance',
        frequency: report.frequency || '',
        send_time: report.send_time || '09:00',
        send_day_of_week: report.send_day_of_week?.toString() || '1',
        send_day_of_month: report.send_day_of_month?.toString() || '1',
        recipient: report.recipient || '',
        start_date: report.start_date ? parseISO(report.start_date) : new Date(),
        message_template: report.message_template || '',
        period_type: report.period_type || 'last_30_days',
        period_start_date: report.period_start_date ? parseISO(report.period_start_date) : null,
        period_end_date: report.period_end_date ? parseISO(report.period_end_date) : null,
      });
    } else {
      setFormData({
        name: '',
        report_type: 'general_performance',
        frequency: '',
        send_time: '09:00',
        send_day_of_week: '1',
        send_day_of_month: '1',
        recipient: '',
        start_date: new Date(),
        message_template: '',
        period_type: 'last_30_days',
        period_start_date: null,
        period_end_date: null,
      });
    }
  }, [report, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
  };

  const handleVariableClick = (variable) => {
    const textarea = messageTemplateRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = text.substring(0, start) + variable + text.substring(end);

    setFormData(prev => ({ ...prev, message_template: newText }));

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dataToSave = {
      ...formData,
      user_id: user.id,
      send_day_of_week: formData.frequency === 'weekly' ? parseInt(formData.send_day_of_week) : null,
      send_day_of_month: formData.frequency === 'monthly' ? parseInt(formData.send_day_of_month) : null,
      start_date: format(formData.start_date, 'yyyy-MM-dd'),
      period_start_date: formData.period_type === 'custom' && formData.period_start_date ? format(formData.period_start_date, 'yyyy-MM-dd') : null,
      period_end_date: formData.period_type === 'custom' && formData.period_end_date ? format(formData.period_end_date, 'yyyy-MM-dd') : null,
    };

    let result;
    if (report) {
      const { user_id, ...updateData } = dataToSave;
      result = await supabase.from('automatic_reports').update(updateData).eq('id', report.id);
    } else {
      result = await supabase.from('automatic_reports').insert(dataToSave);
    }

    const { error } = result;

    if (error) {
      toast({
        title: 'Erro ao salvar relatório',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: `Relatório ${report ? 'atualizado' : 'criado'}!`,
        description: 'Seu relatório automático foi salvo com sucesso.',
      });
      onSave();
    }
    setLoading(false);
  };

  const weekDays = [
    { value: '1', label: 'Segunda-feira' },
    { value: '2', label: 'Terça-feira' },
    { value: '3', label: 'Quarta-feira' },
    { value: '4', label: 'Quinta-feira' },
    { value: '5', label: 'Sexta-feira' },
    { value: '6', label: 'Sábado' },
    { value: '0', label: 'Domingo' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{report ? 'Editar Relatório Automático' : 'Criar Novo Relatório Automático'}</DialogTitle>
          <DialogDescription>
            Configure os detalhes para o envio automático do seu relatório.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nome</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="report_type" className="text-right">Tipo</Label>
            <Select onValueChange={(value) => handleSelectChange('report_type', value)} value={formData.report_type} required>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general_performance">Desempenho Geral</SelectItem>
                <SelectItem value="sellers_analysis" disabled>Análise de Vendedores (em breve)</SelectItem>
                <SelectItem value="origin_conversion" disabled>Conversão por Origem (em breve)</SelectItem>
                <SelectItem value="product_report" disabled>Relatório de Produtos (em breve)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="frequency" className="text-right">Frequência</Label>
            <Select onValueChange={(value) => handleSelectChange('frequency', value)} value={formData.frequency} required>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a frequência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.frequency === 'weekly' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="send_day_of_week" className="text-right">Dia da Semana</Label>
              <Select onValueChange={(value) => handleSelectChange('send_day_of_week', value)} value={formData.send_day_of_week} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {weekDays.map(day => <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {formData.frequency === 'monthly' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="send_day_of_month" className="text-right">Dia do Mês</Label>
              <Input id="send_day_of_month" name="send_day_of_month" type="number" min="1" max="31" value={formData.send_day_of_month} onChange={handleChange} className="col-span-3" required />
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start_date" className="text-right">Primeiro Envio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !formData.start_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.start_date ? format(formData.start_date, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.start_date}
                  onSelect={(date) => handleDateChange('start_date', date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="send_time" className="text-right">Horário</Label>
            <Input id="send_time" name="send_time" type="time" value={formData.send_time} onChange={handleChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="recipient" className="text-right">Destinatário</Label>
            <Input id="recipient" name="recipient" value={formData.recipient} onChange={handleChange} className="col-span-3" placeholder="Nº WhatsApp ou ID do Grupo" required />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="period_type" className="text-right">Período</Label>
            <Select onValueChange={(value) => handleSelectChange('period_type', value)} value={formData.period_type} required>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {formData.period_type === 'custom' && (
            <div className="grid grid-cols-2 gap-4 items-center pl-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("justify-start text-left font-normal", !formData.period_start_date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.period_start_date ? format(formData.period_start_date, "PPP", { locale: ptBR }) : <span>Data de início</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={formData.period_start_date} onSelect={(date) => handleDateChange('period_start_date', date)} initialFocus locale={ptBR} />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("justify-start text-left font-normal", !formData.period_end_date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.period_end_date ? format(formData.period_end_date, "PPP", { locale: ptBR }) : <span>Data de fim</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={formData.period_end_date} onSelect={(date) => handleDateChange('period_end_date', date)} initialFocus locale={ptBR} />
                  </PopoverContent>
                </Popover>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message_template">Modelo da Mensagem</Label>
            <Textarea
              id="message_template"
              name="message_template"
              ref={messageTemplateRef}
              value={formData.message_template}
              onChange={handleChange}
              placeholder="Escreva sua mensagem aqui. Use as variáveis abaixo para inserir dados dinâmicos."
              rows={6}
            />
            <div className="flex flex-wrap gap-2 pt-2">
              {reportVariables.map(variable => (
                <Badge 
                  key={variable.value} 
                  variant="secondary"
                  className="cursor-pointer hover:bg-gray-300"
                  onClick={() => handleVariableClick(variable.value)}
                >
                  {variable.label}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Clique em uma variável para adicioná-la à sua mensagem.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AutomaticReportFormModal;