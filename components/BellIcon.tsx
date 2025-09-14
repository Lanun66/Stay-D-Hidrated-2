import React from 'react';

interface BellIconProps {
  className?: string;
  isReminderEnabled?: boolean;
}

const BellIcon: React.FC<BellIconProps> = ({ className, isReminderEnabled }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      {!isReminderEnabled && (
        <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2.5"></line>
      )}
    </svg>
  );
};

export default BellIcon;
