import React from 'react';
import { CheckCircle } from 'lucide-react';
import CustomNodeWrapper from './CustomNodeWrapper';

const EndNode = () => {
  return (
    <CustomNodeWrapper
      title="Finalizar Fluxo"
      icon={<CheckCircle className="w-5 h-5 text-green-500" />}
      hasBottomHandle={false}
    >
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Este é o fim do fluxo. Nenhuma outra ação será executada após este ponto.
      </p>
    </CustomNodeWrapper>
  );
};

export default React.memo(EndNode);