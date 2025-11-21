import React from 'react';
import { Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CustomNodeWrapper from './CustomNodeWrapper';

const WaitNode = ({ id, data }) => {
  const { duration = 1, unit = 'days', onNodeDataChange } = data;

  const handleDurationChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (onNodeDataChange && !isNaN(value) && value > 0) {
      onNodeDataChange(id, { ...data, duration: value });
    }
  };

  const handleUnitChange = (newUnit) => {
    if (onNodeDataChange) {
      onNodeDataChange(id, { ...data, unit: newUnit });
    }
  };

  return (
    <CustomNodeWrapper
      title="Aguardar"
      icon={<Clock className="w-5 h-5 text-orange-500" />}
    >
      <div className="flex items-center gap-2 nodrag">
        <Input
          type="number"
          min="1"
          value={duration}
          onChange={handleDurationChange}
          className="w-20"
        />
        <Select value={unit} onValueChange={handleUnitChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Unidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="minutes">Minutos</SelectItem>
            <SelectItem value="hours">Horas</SelectItem>
            <SelectItem value="days">Dias</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CustomNodeWrapper>
  );
};

export default React.memo(WaitNode);