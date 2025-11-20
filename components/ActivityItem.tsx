
import React from 'react';
import { Activity } from '../types';
import Button from './Button';
import InputGroup from './InputGroup'; // Import InputGroup

interface ActivityItemProps {
  activity: Activity;
  dayIndex: number;
  activityIndex: number;
  onActualCostChange: (dayIdx: number, activityIdx: number, value: number | '') => void;
  currencySymbol: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, dayIndex, activityIndex, onActualCostChange, currencySymbol }) => {
  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg shadow-sm">
      <h4 className="text-lg font-semibold text-gray-800 mb-1 flex items-center">
        {activity.name}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4 text-blue-500 ml-2 flex-shrink-0" /* Updated globe icon color */
          title="Real-time data"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM2.828 7.222A4.99 4.99 0 017 5h6a4.99 4.99 0 014.172 2.222l-.963.541A3.99 3.99 0 0013 6H7a3.99 3.99 0 00-3.172 1.763l-.963-.541zM10 12.5a.5.5 0 01.5.5v1.5a.5.5 0 01-1 0V13a.5.5 0 01.5-.5zM8 12a2 2 0 100 4h4a2 2 0 100-4H8z"
            clipRule="evenodd"
          />
        </svg>
      </h4>
      <p className="text-gray-600 text-sm mb-1"><span className="font-medium">Hours:</span> {activity.hours}</p>
      <p className="text-gray-600 text-sm mb-2"><span className="font-medium">Estimated Cost:</span> {activity.estimatedCost}</p>
      
      <InputGroup
        id={`actual-cost-${dayIndex}-${activityIndex}`}
        label="Biaya Aktual"
        type="number"
        placeholder="Masukkan biaya aktual"
        value={activity.actualCost === undefined ? '' : activity.actualCost}
        onChange={(e) => onActualCostChange(dayIndex, activityIndex, parseFloat(e.target.value) || '')}
        className="mt-2 mb-3"
        min="0"
        step="any"
        aria-label={`Actual cost for ${activity.name}`}
      />

      {activity.description && <p className="text-gray-700 text-sm mb-3">{activity.description}</p>}
      <Button
        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(activity.name)} ${encodeURIComponent(activity.estimatedCost.split(' ')[0])}`, '_blank')}
        className="text-xs py-1 px-3 bg-blue-500 hover:bg-blue-600 text-white" /* Updated button style */
      >
        Check Price
      </Button>
    </div>
  );
};

export default ActivityItem;