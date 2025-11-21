import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMessage } from '@/contexts/MessageContext';

const SendMessageModal = ({ isOpen, onClose, lead }) => {
  const [message, setMessage] = useState('');
  const messageRef = useRef(null);
  const { sendMessage, isSending, formatPhoneNumber } = useMessage();

  const handleSend = async () => {
    const success = await sendMessage(lead, message);
    if (success) {
      setMessage('');
      onClose();
    }
  };

  const insertVariable = (variableName) => {
    const textarea = messageRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = message.substring(0, start) + `{{${variableName}}}` + message.substring(end);
    
    setMessage(newText);

    // Focus and set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.selectionEnd = start + `{{${variableName}}}`.length;
    }, 0);
  };

  if (!lead) return null;

  const formattedNumber = formatPhoneNumber(lead.whatsapp);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enviar Mensagem via ÁpiceBot</DialogTitle>
          <DialogDescription>
            Enviando para: <span className="font-bold">{lead.nome}</span> ({formattedNumber})
          </DialogDescription>
        </DialogHeader>
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="py-4"
        >
          <div className="grid gap-4">
            <div className="mb-2">
                <Label htmlFor="message" className="mb-2">Mensagem</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => insertVariable('nome')}>Nome</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => insertVariable('whatsapp')}>Telefone</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => insertVariable('status')}>Status</Button>
                </div>
                <Textarea
                    id="message"
                    ref={messageRef}
                    placeholder="Digite sua mensagem aqui..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[120px]"
                />
            </div>
            <div className="text-xs text-gray-500">
              <p className="font-semibold">Prévia do Payload da API:</p>
              <pre className="mt-1 bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-x-auto">
                <code>
{`{
  "number": "${formattedNumber}",
  "body": "${message.replace(/"/g, '\\"').substring(0, 50)}${message.length > 50 ? '...' : ''}",
  "externalKey": "...",
  "isClosed": false
}`}
                </code>
              </pre>
            </div>
          </div>
        </motion.div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isSending || !message.trim()}>
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Enviando...
              </>
            ) : (
              'Enviar Mensagem'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendMessageModal;