
import React from 'react';
import { DayData } from '@/types';

interface AttendanceCalendarProps {
  days: { [day: string]: DayData };
  year: number;
  month: number;
  onDayClick: (dayData: DayData) => void;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ days, year, month, onDayClick }) => {
  // Basic layout, you can expand this with a proper calendar implementation
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-bold mb-4">تقويم الحضور</h2>
      <p>تقويم الحضور لشهر {month}/{year}</p>
      {/* Add a grid or other layout to display the days */}
      <div className="grid grid-cols-7 gap-2">
        {Object.values(days).map(day => (
          <div key={day.date.toString()} onClick={() => onDayClick(day)} className="p-2 border rounded cursor-pointer">
            <p>{new Date(day.date).getDate()}</p>
            <p>{day.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
