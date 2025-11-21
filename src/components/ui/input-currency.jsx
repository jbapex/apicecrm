import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value).replace(/\D/g, '');
  if (stringValue === '') return '';
  const numberValue = parseInt(stringValue, 10) / 100;
  return numberValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const getRawValue = (formattedValue) => {
  if (!formattedValue) return 0;
  const raw = formattedValue.replace(/\D/g, '');
  if (raw === '') return 0;
  return parseFloat(raw) / 100;
};

const CurrencyInput = forwardRef(({ value, onChange, onBlur, ...props }, ref) => {
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Only update display value from prop if it's different from the raw version of current display value
    // This prevents cursor jumping during typing
    const rawPropValue = value ? parseFloat(value) : 0;
    const rawDisplayValue = getRawValue(displayValue);
    if (rawPropValue !== rawDisplayValue) {
      setDisplayValue(formatCurrency(value * 100));
    }
  }, [value]);

  const handleChange = (e) => {
    const input = e.target;
    const originalValue = input.value;
    const cursorPosition = input.selectionStart;
    const digitsOnly = originalValue.replace(/\D/g, '');

    const newDisplayValue = formatCurrency(digitsOnly);
    setDisplayValue(newDisplayValue);

    if (onChange) {
      const rawValue = getRawValue(newDisplayValue);
      const syntheticEvent = {
        target: {
          name: props.name,
          value: rawValue,
        },
      };
      onChange(syntheticEvent);
    }

    // Recalculate cursor position
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const newLength = newDisplayValue.length;
        const oldLength = originalValue.length;
        const newCursor = cursorPosition + (newLength - oldLength);
        inputRef.current.setSelectionRange(newCursor, newCursor);
      }
    });
  };

  const handleBlur = (e) => {
    const rawValue = getRawValue(displayValue);
    const formatted = formatCurrency(rawValue * 100);
    setDisplayValue(formatted);
    if (onBlur) {
      e.target.value = rawValue;
      onBlur(e);
    }
  };

  const setRefs = (el) => {
    inputRef.current = el;
    if (typeof ref === 'function') {
      ref(el);
    } else if (ref) {
      ref.current = el;
    }
  };

  return (
    <Input
      {...props}
      ref={setRefs}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      type="text"
      inputMode="decimal"
    />
  );
});

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput, formatCurrency, getRawValue };