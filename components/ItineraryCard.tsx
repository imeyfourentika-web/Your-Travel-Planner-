
import React from 'react';
import { DayItinerary, Activity } from '../types';
import ActivityItem from './ActivityItem'; // Import the new ActivityItem component

interface ItineraryCardProps {
  dayItinerary: DayItinerary;
  dayIndex: number; // Add dayIndex prop
  onActualCostChange: (dayIdx: number, activityIdx: number, value: number | '') => void;
  currencySymbol: string;
}

const ItineraryCard: React.FC<ItineraryCardProps> = ({ dayItinerary, dayIndex, onActualCostChange, currencySymbol }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-full flex flex-col">
      <h3 className="text-2xl font-bold text-blue-900 mb-4 pb-2 border-b-2 border-blue-200">
        Day {dayItinerary.day} - {dayItinerary.location || 'Unknown Location'}
      </h3>
      <div className="flex-grow">
        {dayItinerary.activities.length > 0 ? (
          dayItinerary.activities.map((activity, activityIndex) => (
            <ActivityItem
              key={activityIndex}
              activity={activity}
              dayIndex={dayIndex}
              activityIndex={activityIndex}
              onActualCostChange={onActualCostChange}
              currencySymbol={currencySymbol}
            />
          ))
        ) : (
          <p className="text-gray-500 italic">No activities planned for this day.</p>
        )}
      </div>
    </div>
  );
};

export default ItineraryCard;