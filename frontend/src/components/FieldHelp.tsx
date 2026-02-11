import React from 'react';

interface FieldHelpProps {
  id?: string;
  title?: string;
  text: string;
  className?: string;
}

export const FieldHelp: React.FC<FieldHelpProps> = ({ id, title, text, className }) => {
  const ariaLabel = title ? `${title}: ${text}` : text;
  return (
    <div
      id={id}
      tabIndex={0}
      role="note"
      aria-label={ariaLabel}
      className={`inline-flex items-start gap-2 text-sm text-gray-600 ${className || ''}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 shrink-0 text-brand-500"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-9-3a1 1 0 112 0v1a1 1 0 11-2 0V7zm1 3a1 1 0 00-.993.883L9 11v3a1 1 0 001.993.117L11 14v-3a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <div>
        {title && <div className="font-medium text-gray-800">{title}</div>}
        <div className="text-xs text-gray-600">{text}</div>
      </div>
    </div>
  );
};

export default FieldHelp;
