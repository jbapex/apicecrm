import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCheck } from 'lucide-react';

const BulkActionsBar = ({ selectedCount, isAllSelected, onSelectAll, onAction }) => {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Checkbox id="select-all" checked={isAllSelected} onCheckedChange={onSelectAll} />
          <label htmlFor="select-all" className="font-medium">
            {selectedCount > 0 ? `${selectedCount} selecionado(s)` : 'Selecionar Todos'}
          </label>
        </div>
        <AnimatePresence>
          {selectedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-2"
            >
              <Button variant="outline" size="sm" onClick={() => onAction('ignore')}>
                <Trash2 className="w-4 h-4 mr-2" /> Ignorar
              </Button>
              <Button size="sm" onClick={() => onAction('import')}>
                <CheckCheck className="w-4 h-4 mr-2" /> Importar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default BulkActionsBar;