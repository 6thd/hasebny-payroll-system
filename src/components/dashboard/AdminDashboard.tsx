"use client";

import type { Worker, LeaveRequest } from '@/types';
import AdminAnalytics from './AdminAnalytics';
import AttendanceTable from './AttendanceTable';

interface AdminDashboardProps {
  workers: Worker[];
  date: { year: number; month: number };
  isAdmin: boolean;
  onDataUpdate: () => void;
  activeView: string;
  approvedLeaves: LeaveRequest[];
}

export default function AdminDashboard({
  workers,
  date,
  isAdmin,
  onDataUpdate,
  activeView,
  approvedLeaves,
}: AdminDashboardProps) {
  return (
    <div className="mt-6">
      {activeView === 'analytics' ? (
        <div className="animate-in fade-in-50 duration-500">
          <AdminAnalytics workers={workers} isAdmin={isAdmin} approvedLeaves={approvedLeaves} />
        </div>
      ) : (
        <div className="bg-card p-4 rounded-xl shadow-lg animate-in fade-in-50 duration-500">
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
