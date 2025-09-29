"use client";

import type { Worker } from '@/types';
import MUIAdminAnalytics from './MUIAdminAnalytics';
import AttendanceTable from './AttendanceTable';

interface AdminDashboardProps {
  workers: Worker[];
  date: { year: number; month: number };
  isAdmin: boolean;
  onDataUpdate: () => void;
  activeView: string;
}

export default function AdminDashboard({
  workers,
  date,
  isAdmin,
  onDataUpdate,
  activeView,
}: AdminDashboardProps) {
  return (
    <div className="mt-6">
      {activeView === 'analytics' ? (
        <MUIAdminAnalytics workers={workers} isAdmin={isAdmin} />
      ) : (
        <div className="bg-card p-4 rounded-xl shadow-lg">
          <AttendanceTable
            workers={workers}
            year={date.year}
            month={date.month}
            isAdmin={isAdmin}
            onDataUpdate={onDataUpdate}
          />
        </div>
      )}
    </div>
  );
}