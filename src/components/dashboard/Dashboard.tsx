"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Worker } from '@/types';
import { processWorkerData } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import DashboardHeader from './DashboardHeader';
import KPIs from './KPIs';
import Charts from './Charts';
import AttendanceTable from './AttendanceTable';
import { Button } from '../ui/button';
import { Users, CircleDollarSign } from 'lucide-react';
import PayrollModal from './modals/PayrollModal';
import EmployeeManagementModal from './modals/EmployeeManagementModal';
import EmployeeDashboard from './EmployeeDashboard';
import LeaveRequestsAdmin from './LeaveRequestsAdmin';
import EmployeesOnLeave from './EmployeesOnLeave';

export default function Dashboard() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });
  const [isPayrollModalOpen, setPayrollModalOpen] = useState(false);
  const [isEmployeeModalOpen, setEmployeeModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let workersToLoad: Worker[] = [];
      if (user.role === 'admin') {
        const employeesSnapshot = await getDocs(collection(db, 'employees'));
        workersToLoad = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
      } else {
        const q = query(collection(db, "employees"), where("authUid", "==", user.uid));
        const employeeDocSnap = await getDocs(q);
        if (!employeeDocSnap.empty) {
            const userDoc = employeeDocSnap.docs[0];
            workersToLoad = [{ id: userDoc.id, ...userDoc.data() } as Worker];
        }
      }

      const attendanceSnapshot = await getDocs(collection(db, `attendance_${date.year}_${date.month + 1}`));
      const attendanceData: { [key: string]: any } = {};
      attendanceSnapshot.forEach(doc => {
        attendanceData[doc.id] = doc.data().days;
      });

      const processedWorkers = workersToLoad.map(w => {
        const workerWithAttendance = { ...w, days: attendanceData[w.id] || {} };
        return processWorkerData(workerWithAttendance, date.year, date.month);
      });

      setWorkers(processedWorkers);
    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
    }
  }, [user, date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateChange = (newDate: { year: number; month: number }) => {
    setDate(newDate);
  };

  const handleDataUpdate = () => {
    fetchData();
  };

  if (loading || !user) {
    return <LoadingSpinner fullScreen />;
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen">
      <div className="max-w-full mx-auto">
        <DashboardHeader
          user={user}
          date={date}
          onDateChange={handleDateChange}
          isAdmin={isAdmin}
        />

        {isAdmin ? (
          <>
            <div className="no-print">
              <KPIs workers={workers} year={date.year} month={date.month} />
              <Charts workers={workers} year={date.year} month={date.month} />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-8">
                  <div className="md:col-span-2">
                      <LeaveRequestsAdmin />
                  </div>
                  <div>
                      <EmployeesOnLeave />
                  </div>
              </div>

              <div className="flex flex-wrap gap-4 justify-center my-6">
                <Button onClick={() => setPayrollModalOpen(true)}>
                  <CircleDollarSign className="ml-2 h-4 w-4" />
                  مسير الرواتب
                </Button>
                <Button onClick={() => setEmployeeModalOpen(true)}>
                  <Users className="ml-2 h-4 w-4" />
                  إدارة الموظفين
                </Button>
              </div>
            </div>
            <div className="card overflow-hidden shadow-lg no-print">
              <AttendanceTable
                workers={workers}
                year={date.year}
                month={date.month}
                isAdmin={isAdmin}
                onDataUpdate={handleDataUpdate}
              />
            </div>
          </>
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
      
      {isPayrollModalOpen &&
        <PayrollModal
          isOpen={isPayrollModalOpen}
          onClose={() => setPayrollModalOpen(false)}
          workers={workers}
          year={date.year}
          month={date.month}
          onDataUpdate={handleDataUpdate}
        />
      }

      {isEmployeeModalOpen &&
        <EmployeeManagementModal
          isOpen={isEmployeeModalOpen}
          onClose={() => setEmployeeModalOpen(false)}
          workers={workers}
          onDataUpdate={handleDataUpdate}
        />
      }
    </div>
  );
}
