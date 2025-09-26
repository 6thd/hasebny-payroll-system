"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Worker, MonthlyData } from '@/types';
import { processWorkerData } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import DashboardHeader from './DashboardHeader';
import EmployeeDashboard from './EmployeeDashboard';
import AdminDashboard from './AdminDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });
  
  const [activeView, setActiveView] = useState('analytics'); // 'analytics' or 'attendance'

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let workersToLoad: Worker[] = [];
      const employeesSnapshot = await getDocs(collection(db, 'employees'));

      if (user.role === 'admin') {
        workersToLoad = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
      } else {
        const userDoc = employeesSnapshot.docs.find(doc => doc.data().authUid === user.uid);
        if (userDoc) {
            workersToLoad = [{ id: userDoc.id, ...userDoc.data() } as Worker];
        }
      }

      const attendanceSnapshot = await getDocs(collection(db, `attendance_${date.year}_${date.month + 1}`));
      const attendanceData: { [key: string]: any } = {};
      attendanceSnapshot.forEach(doc => {
        attendanceData[doc.id] = doc.data().days;
      });

      const salaryCollectionName = `salaries_${date.year}_${date.month + 1}`;
      const monthlyDocsSnap = await getDocs(collection(db, salaryCollectionName));
      const monthlyDataMap: { [employeeId: string]: MonthlyData } = {};
      monthlyDocsSnap.forEach(doc => {
          monthlyDataMap[doc.id] = doc.data() as MonthlyData;
      });
      
      const processedWorkers = workersToLoad.map(w => {
        const workerWithFullData = { 
          ...w, 
          days: attendanceData[w.id] || {},
          commission: monthlyDataMap[w.id]?.commission || 0,
          advances: monthlyDataMap[w.id]?.advances || 0,
          penalties: monthlyDataMap[w.id]?.penalties || 0,
        };
        return processWorkerData(workerWithFullData, date.year, date.month);
      });
      
      setWorkers(processedWorkers);

    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
    }
  }, [user, date]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [fetchData, user]);

  const handleDateChange = (newDate: { year: number; month: number }) => {
    setDate(newDate);
  };

  const handleDataUpdate = useCallback(() => {
    fetchData();
    // This custom event helps other components (like charts) know when to refetch data
    window.dispatchEvent(new CustomEvent('data-updated'));
  }, [fetchData]);

  if (loading || !user) {
    return <LoadingSpinner fullScreen />;
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-full mx-auto">
        <DashboardHeader
          user={user}
          date={date}
          onDateChange={handleDateChange}
          isAdmin={isAdmin}
          workers={workers}
          onDataUpdate={handleDataUpdate}
          activeView={activeView}
          setActiveView={setActiveView}
        />

        {isAdmin ? (
          <AdminDashboard
            workers={workers}
            date={date}
            isAdmin={isAdmin}
            onDataUpdate={handleDataUpdate}
            activeView={activeView}
          />
        ) : (
          <EmployeeDashboard 
            employee={workers[0]}
            year={date.year}
            month={date.month}
            onDateChange={handleDateChange}
            onDataUpdate={handleDataUpdate}
          />
        )}
      </div>
    </div>
  );
}
