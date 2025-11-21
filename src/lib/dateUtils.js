import { format, parseISO, parse, isValid, toDate } from 'date-fns';

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy');
  } catch (error) {
    return 'Data inválida';
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = toDate(new Date(dateString));
    if (isValid(date)) {
        return format(date, 'dd/MM/yyyy HH:mm');
    }
    return 'Data inválida';
  } catch (error) {
    return 'Data inválida';
  }
};

export function parseAndFormatTintimDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return new Date().toISOString();
  }

  // Tenta analisar o formato "2025-08-18 às 08:00:15"
  const parsedDate = parse(dateString, "yyyy-MM-dd 'às' HH:mm:ss", new Date());
  
  if (isValid(parsedDate)) {
    return parsedDate.toISOString();
  }

  // Tenta analisar o formato ISO, caso ele venha assim
  const parsedISODate = parseISO(dateString);
  if (isValid(parsedISODate)) {
    return parsedISODate.toISOString();
  }
  
  // Como fallback, retorna a data atual em ISO string
  return new Date().toISOString();
}