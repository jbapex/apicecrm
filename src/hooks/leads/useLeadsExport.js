import { useToast } from '@/components/ui/use-toast';
import Papa from 'papaparse';

export const useLeadsExport = (filteredLeads) => {
    const { toast } = useToast();

    const exportData = () => {
        if (!filteredLeads || filteredLeads.length === 0) {
            toast({
                variant: 'destructive',
                title: "Nenhum dado para exportar",
                description: "Não há leads para serem exportados com os filtros atuais.",
            });
            return;
        }

        const dataToExport = filteredLeads.map(lead => ({
            'ID': lead.id,
            'Nome': lead.nome,
            'WhatsApp': lead.whatsapp,
            'Email': lead.email,
            'Data de Entrada': lead.data_entrada,
            'Origem': lead.origem,
            'Sub-Origem': lead.sub_origem,
            'Agendamento': lead.agendamento,
            'Status': lead.status,
            'Vendedor': lead.vendedor,
            'Valor': lead.valor,
            'Observações': lead.observacoes,
            'Tags': Array.isArray(lead.tags) ? lead.tags.join(', ') : '',
            'URL Foto Perfil': lead.profile_pic_url,
            'ID Externo': lead.external_id,
            'Criado Em': lead.created_at,
            'Atualizado Em': lead.updated_at
        }));

        const csv = Papa.unparse(dataToExport, {
            header: true,
        });

        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
            title: "Dados exportados!",
            description: "O arquivo CSV foi baixado com sucesso.",
        });
    };

    return { exportData };
};