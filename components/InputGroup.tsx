
import React from 'react';

interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, id, error, className, ...props }) => {
  return (
    <div className={`mb-4 ${className || ''}`}>
      <label htmlFor={id} className="block text-gray-700 text-sm font-bold mb-2">
        {label}
      </label>
      <input
        id={id}
        className={`
          shadow appearance-none border rounded w-full py-2 px-3
          leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${error ? 'border-red-500' : 'border-gray-300'}
          bg-white text-gray-900 /* Contrast colors */
        `}
        {...props}
      />
      {error && <p className="text-red-500 text-xs italic mt-1">{error}</p>}
    </div>
  );
};

export default InputGroup;