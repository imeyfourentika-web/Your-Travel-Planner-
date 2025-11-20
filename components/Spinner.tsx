
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div> {/* Updated color */}
    </div>
  );
};

export default Spinner;