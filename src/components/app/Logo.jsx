import React from 'react';
import { motion } from 'framer-motion';

const Logo = ({ isExpanded }) => {
  return (
    <div className="flex flex-col items-center justify-center overflow-hidden h-full py-4">
      <div className="flex items-center">
        <motion.div
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 22H22L12 2Z" fill="url(#logo-gradient)" />
            <path d="M12 2L17 12H7L12 2Z" fill="white" fillOpacity="0.5" />
            <defs>
              <linearGradient id="logo-gradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3b82f6" />
                <stop offset="1" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="ml-3 text-xl font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap"
          >
            Ápice CRM
          </motion.span>
        )}
      </div>
    </div>
  );
};

export default Logo;