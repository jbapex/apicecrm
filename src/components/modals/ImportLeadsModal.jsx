import React, { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useLeads } from '@/hooks/useLeads.jsx';
import Papa from 'papaparse';
import { Upload, FileText, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SYSTEM_FIELDS = [
  { value: 'nome', label: 'Nome', required: true },
  { value: 'whatsapp', label: 'WhatsApp', required: true },
  { value: 'email', label: 'Email' },
  { value: 'data_entrada', label: 'Data de Entrada' },
  { value: 'origem', label: 'Origem' },
  { value: 'sub_origem', label: 'Sub-Origem' },
  { value: 'agendamento', label: 'Agendamento' },
  { value: 'status', label: 'Status' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'valor', label: 'Valor' },
  { value: 'observacoes', label: 'Observações' },
];

const IGNORE_COLUMN_VALUE = '_ignore_';

const ImportLeadsModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [data, setData] = useState([]);
  const [mapping, setMapping] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { handleBulkAddLeads, parseDateString } = useLeads();

  const resetState = () => {
    setStep(1);
    setFile(null);
    setHeaders([]);
    setData([]);
    setMapping({});
    setIsLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      toast({
        variant: 'destructive',
        title: 'Arquivo inválido',
        description: 'Por favor, selecione um arquivo .csv',
      });
    }
  };

  const handleParseFile = () => {
    if (!file) return;
    setIsLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setHeaders(results.meta.fields);
        setData(results.data);
        const initialMapping = {};
        results.meta.fields.forEach(header => {
          const lowerHeader = header.toLowerCase().replace(/ /g, '_').replace(/ç/g, 'c').replace(/ã/g, 'a');
          const foundField = SYSTEM_FIELDS.find(f => f.value === lowerHeader || f.label.toLowerCase() === lowerHeader);
          if (foundField) {
            initialMapping[header] = foundField.value;
          }
        });
        setMapping(initialMapping);
        setStep(2);
        setIsLoading(false);
      },
    });
  };

  const handleMappingChange = (header, systemField) => {
    setMapping(prev => ({ ...prev, [header]: systemField }));
  };

  const handleImport = async () => {
    const requiredFieldsMet = SYSTEM_FIELDS.filter(f => f.required).every(f => Object.values(mapping).includes(f.value));
    if (!requiredFieldsMet) {
      toast({
        variant: 'destructive',
        title: 'Mapeamento incompleto',
        description: 'Por favor, mapeie os campos obrigatórios: Nome e WhatsApp.',
      });
      return;
    }

    setIsLoading(true);
    const leadsToImport = data.map(row => {
      const lead = {};
      for (const header in mapping) {
        const systemField = mapping[header];
        if (systemField && systemField !== IGNORE_COLUMN_VALUE && row[header]) {
          lead[systemField] = row[header];
        }
      }
      return lead;
    });

    const success = await handleBulkAddLeads(leadsToImport);
    if (success) {
      setStep(3);
    } else {
      toast({
        variant: 'destructive',
        title: 'Falha na importação',
        description: 'Ocorreu um erro. Verifique o console para mais detalhes.',
      });
    }
    setIsLoading(false);
  };

  const downloadTemplate = () => {
    const csvContent = SYSTEM_FIELDS.map(f => f.value).join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_importacao_leads.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const dataPreview = useMemo(() => {
    return data.slice(0, 3).map((row, rowIndex) => {
      const previewData = {};
      headers.forEach(header => {
        const mappedField = mapping[header];
        if (mappedField && mappedField !== IGNORE_COLUMN_VALUE) {
          let value = row[header];
          let isValidDate = true;
          if ((mappedField === 'data_entrada' || mappedField === 'agendamento') && value) {
            const parsed = parseDateString(value);
            isValidDate = !!parsed;
            value = parsed ? new Date(parsed).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : `Inválido: ${value}`;
          }
          previewData[mappedField] = { value, isValidDate };
        }
      });
      return { id: rowIndex, ...previewData };
    });
  }, [data, headers, mapping, parseDateString]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Importar Leads (Passo 1 de 2)</DialogTitle>
              <DialogDescription>
                Selecione um arquivo CSV para importar. Certifique-se de que ele contém pelo menos as colunas de nome e whatsapp.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Clique para enviar</span> ou arraste e solte
                  </p>
                  <p className="text-xs text-gray-500">Arquivo CSV (máx 5MB)</p>
                </div>
                <input id="file-upload" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
              </label>
              {file && <p className="text-sm text-center text-gray-600">Arquivo selecionado: {file.name}</p>}
              <Button variant="link" onClick={downloadTemplate} className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                Baixar modelo de exemplo
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button onClick={handleParseFile} disabled={!file || isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                Próximo
              </Button>
            </DialogFooter>
          </>
        );
      case 2:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Mapear Colunas (Passo 2 de 2)</DialogTitle>
              <DialogDescription>
                Associe as colunas do seu arquivo aos campos do sistema. Nome e WhatsApp são obrigatórios.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 font-semibold text-sm px-2 mb-2">
                <span>Coluna do seu arquivo</span>
                <span>Campo no Sistema</span>
              </div>
              {headers.map(header => (
                <div key={header} className="grid grid-cols-2 gap-4 items-center mb-2 p-2 rounded-md hover:bg-gray-50">
                  <span className="font-medium text-gray-700 truncate" title={header}>{header}</span>
                  <Select onValueChange={(value) => handleMappingChange(header, value)} value={mapping[header] || IGNORE_COLUMN_VALUE}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ignorar esta coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={IGNORE_COLUMN_VALUE}>Ignorar esta coluna</SelectItem>
                      {SYSTEM_FIELDS.map(field => (
                        <SelectItem key={field.value} value={field.value} disabled={Object.values(mapping).includes(field.value) && mapping[header] !== field.value}>
                          {field.label} {field.required && '*'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2">Pré-visualização dos dados:</h4>
                <div className="border rounded-lg p-2 text-xs overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        {SYSTEM_FIELDS.filter(f => Object.values(mapping).includes(f.value)).map(f => <th key={f.value} className="p-1 text-left font-bold">{f.label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {dataPreview.map(previewRow => (
                        <tr key={previewRow.id} className="border-b last:border-b-0">
                          {SYSTEM_FIELDS.filter(f => Object.values(mapping).includes(f.value)).map(f => (
                            <td key={f.value} className={`p-1 ${!previewRow[f.value]?.isValidDate ? 'text-red-500' : ''}`}>
                              {previewRow[f.value]?.value || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <Button onClick={handleImport} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Importar Leads
              </Button>
            </DialogFooter>
          </>
        );
      case 3:
        return (
          <>
            <DialogHeader className="items-center text-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <DialogTitle>Importação Concluída!</DialogTitle>
              <DialogDescription>
                Seus leads foram importados com sucesso e já estão disponíveis na sua lista.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">Fechar</Button>
            </DialogFooter>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ImportLeadsModal;