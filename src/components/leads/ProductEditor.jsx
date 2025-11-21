import React, { useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

const ProductEditor = ({ lead, onUpdateLead }) => {
  const { products } = useProducts();
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(lead.product_id || '');

  useEffect(() => {
    setSelectedValue(lead.product_id || '');
  }, [lead.product_id]);

  const handleSelect = (currentValue) => {
    const newValue = currentValue === selectedValue ? null : currentValue;
    setSelectedValue(newValue);
    onUpdateLead(lead.id, { product_id: newValue });
    setOpen(false);
  };

  const selectedProduct = products.find(p => p.id === selectedValue);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-start p-1.5 h-auto text-sm font-normal"
          onClick={(e) => e.stopPropagation()}
        >
          <Package className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
          <span className="truncate">
            {selectedProduct ? selectedProduct.name : "Nenhum"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" onClick={(e) => e.stopPropagation()}>
        <Command filter={(value, search) => {
          const product = products.find(p => p.id === value);
          if (!product) return 0;
          const searchLower = search.toLowerCase();
          const nameMatch = product.name.toLowerCase().includes(searchLower);
          const codeMatch = product.code && product.code.toLowerCase().includes(searchLower);
          return nameMatch || codeMatch ? 1 : 0;
        }}>
          <CommandInput placeholder="Buscar por nome ou código..." />
          <CommandList>
            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.id}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValue === product.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex justify-between w-full">
                    <span className="truncate">{product.name}</span>
                    {product.code && <span className="text-xs text-gray-500 ml-2">{product.code}</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ProductEditor;