import React from 'react';
import { motion } from 'framer-motion';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Link2, Trash2, CheckCircle, UserPlus, Pencil } from 'lucide-react';

const TintimTableRow = ({
    event,
    actionInProgress,
    selectedEvents,
    onSelectEvent,
    onShowConversation,
    onShowEditModal,
    onConsolidateLead,
    onCreateLead,
    onDeleteEvent,
    getStatusText
}) => {
    const formatCurrency = (value) => {
        if (typeof value !== 'number') {
            return 'N/A';
        }
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    return (
        <motion.tr 
            key={event.id} 
            layout 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0, x: -50 }} 
            transition={{ duration: 0.3 }}
            onClick={(e) => event.canConsolidate && onShowEditModal(e, event)}
            className={event.canConsolidate ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}
        >
            <TableCell onClick={(e) => e.stopPropagation()}><Checkbox onCheckedChange={(checked) => onSelectEvent(event.id, checked)} checked={selectedEvents.has(event.id)} /></TableCell>
            <TableCell><div className="font-medium">{event.parsed.name}</div><div className="text-sm text-gray-500">{event.parsed.phone}</div><div className="text-xs text-gray-400">{event.parsed.created}</div></TableCell>
            <TableCell>{event.leadStatus ? <Badge variant="outline" className="capitalize">{getStatusText(event.leadStatus)}</Badge> : <Badge variant="secondary">Novo</Badge>}</TableCell>
            <TableCell>{formatCurrency(event.leadValue)}</TableCell>
            <TableCell>{event.parsed.source}</TableCell>
            <TableCell>{event.parsed.location}</TableCell>
            <TableCell><div className="font-medium">{event.parsed.campaign_name}</div><div className="text-sm text-gray-500">{event.parsed.ad_name}</div></TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-1 justify-end items-center">
                    <Button size="sm" variant="outline" onClick={(e) => onShowConversation(e, event.parsed.phone)} disabled={!!actionInProgress} title="Exibir Conversa"><MessageSquare className="h-4 w-4"/></Button>
                    
                    {event.canConsolidate && (
                        <Button size="sm" variant="outline" onClick={(e) => onShowEditModal(e, event)} disabled={!!actionInProgress} title="Editar Lead">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}

                    {event.canConsolidate ? (
                        event.isConsolidated ? <div title="Informações já consolidadas" className="p-2"><CheckCircle className="h-5 w-5 text-green-500" /></div> :
                        <Button size="sm" onClick={(e) => onConsolidateLead(e, event)} disabled={!!actionInProgress} title="Consolidar Informações">
                            {actionInProgress === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                        </Button>
                    ) : (
                        <Button size="sm" variant="secondary" onClick={(e) => onCreateLead(e, event)} disabled={!!actionInProgress} title="Criar novo Lead">
                            {actionInProgress === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        </Button>
                    )}

                    <Button size="sm" variant="ghost" onClick={(e) => onDeleteEvent(e, event.id)} disabled={!!actionInProgress} title="Excluir Evento">
                        {actionInProgress === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-500" />}
                    </Button>
                </div>
            </TableCell>
        </motion.tr>
    );
};

export default TintimTableRow;