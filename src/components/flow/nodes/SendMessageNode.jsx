import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import CustomNodeWrapper from './CustomNodeWrapper';
import { Label } from '@/components/ui/label';

const SendMessageNode = ({ id, data }) => {
  const { content = '', onNodeDataChange } = data;

  const handleChange = (e) => {
    if (onNodeDataChange) {
      onNodeDataChange(id, { content: e.target.value });
    }
  };

  return (
    <CustomNodeWrapper
      title="Enviar Mensagem"
      icon={<MessageSquare className="w-5 h-5 text-indigo-500" />}
    >
      <div className="space-y-2">
        <Label htmlFor={`message-content-${id}`} className="text-xs text-gray-500">Conteúdo da Mensagem</Label>
        <Textarea
          id={`message-content-${id}`}
          placeholder="Digite sua mensagem aqui... Você pode usar {{nome}} para personalizar."
          value={content}
          onChange={handleChange}
          className="nodrag"
        />
        <p className="text-xs text-gray-400">Variáveis: {"{{nome}}"}, {"{{whatsapp}}"}</p>
      </div>
    </CustomNodeWrapper>
  );
};

export default React.memo(SendMessageNode);