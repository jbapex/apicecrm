import React from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';

const CustomNodeWrapper = ({ title, icon, children, isConnectable = true, hasTopHandle = true, hasBottomHandle = true }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-indigo-500 transition-all duration-200"
    >
      {hasTopHandle && (
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-indigo-500 !w-3 !h-3"
          isConnectable={isConnectable}
        />
      )}
      <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-gray-700">
        {icon}
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
      </div>
      <div className="p-3 text-sm">
        {children}
      </div>
      {hasBottomHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-indigo-500 !w-3 !h-3"
          isConnectable={isConnectable}
        />
      )}
    </motion.div>
  );
};

export default CustomNodeWrapper;