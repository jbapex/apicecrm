import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Phone, Mail, Calendar, Tag, DollarSign, Info, Share2, MapPin, Target, CalendarHeart } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import StatusEditor from '@/components/leads/StatusEditor';

const LeadDetailModal = ({ lead, isOpen, onClose, getStatusText, onUpdateLead, getStatusIcon }) => {
    const { settings } = useSettings();
    const customDateSettings = settings?.custom_fields_settings?.date_field || { is_active: false, label: '' };

    if (!isOpen || !lead) return null;

    const formatDateTime = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        if (settings.enable_scheduling_time) {
            return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        }
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    };

    const DetailItem = ({ icon: Icon, label, value, children }) => {
        if (!value && !children) return null;
        return (
            <div className="flex items-start text-sm">
                <Icon className="w-4 h-4 mr-3 mt-1 text-gray-500 flex-shrink-0" />
                <div>
                    <p className="font-medium text-gray-500">{label}</p>
                    {children || <p className="text-gray-800">{value}</p>}
                </div>
            </div>
        );
    };

    const tintimInfo = lead.custom_fields?.tintim_lead_info;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={lead.profile_pic_url} alt={`Foto de ${lead.nome}`} />
                            <AvatarFallback>{lead.nome ? lead.nome.charAt(0).toUpperCase() : <User />}</AvatarFallback>
                        </Avatar>
                        <div>
                            {lead.nome}
                            <DialogDescription>
                                Detalhes do Lead
                            </DialogDescription>
                        </div>
                    </DialogTitle>
                </DialogHeader>
                
                <div className="py-4 space-y-4">
                    <DetailItem icon={Phone} label="WhatsApp" value={lead.whatsapp} />
                    <DetailItem icon={Mail} label="Email" value={lead.email} />
                    <DetailItem icon={User} label="Vendedor" value={lead.vendedor} />
                    <DetailItem icon={Tag} label="Status">
                        {onUpdateLead && getStatusIcon ? (
                            <div className="w-40">
                                <StatusEditor 
                                    lead={lead} 
                                    onUpdateLead={onUpdateLead} 
                                    getStatusIcon={getStatusIcon} 
                                    getStatusText={getStatusText} 
                                />
                            </div>
                        ) : (
                            <p className="text-gray-800">{getStatusText(lead.status)}</p>
                        )}
                    </DetailItem>
                    <DetailItem icon={Calendar} label="Agendamento" value={formatDateTime(lead.agendamento)} />
                    {customDateSettings.is_active && (
                      <DetailItem icon={CalendarHeart} label={customDateSettings.label} value={formatDate(lead.custom_date_field)} />
                    )}
                    <DetailItem icon={Share2} label="Origem / Sub-Origem" value={`${lead.origem || ''}${lead.sub_origem ? ` / ${lead.sub_origem}` : ''}`} />
                    <DetailItem icon={DollarSign} label="Valor" value={lead.valor > 0 ? `R$ ${Number(lead.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null} />
                    
                    {tintimInfo && (
                        <div className="pt-4 border-t">
                            <h3 className="text-sm font-semibold text-gray-600 mb-2">Informações da Campanha (Tintim)</h3>
                            <DetailItem icon={MapPin} label="Localização" value={tintimInfo.location} />
                            <DetailItem icon={Target} label="Campanha" value={tintimInfo.campaign_name} />
                            <DetailItem icon={Info} label="Anúncio" value={tintimInfo.ad_name} />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={onClose} variant="outline">Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LeadDetailModal;