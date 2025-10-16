"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Wallet, UserX, UserCheck } from 'lucide-react';
import { Worker, MonthlyData } from '@/types';
import { calculatePayroll } from '@/lib/utils';
import LoadingSpinner from '../LoadingSpinner';

const KPICard = ({ title, value, icon, isLoading }: { title: string; value: string | number; icon: React.ReactNode, isLoading: boolean }) => (
  <Card className="shadow-lg transition-all hover:shadow-xl hover:scale-105 border-l-4 border-primary">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="h-8 w-1/2 mt-1 rounded-md animate-pulse bg-muted"></div>
      ) : (
        <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</div>
      )}
    </CardContent>
  </Card>
);


export default function AnalyticsKPIs() {
    const [kpiData, setKpiData] = useState({
        totalEmployees: 0,
        totalPayroll: 0,
        onLeaveToday: 0,
        absentToday: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchKpiData = async () => {
            setLoading(true);
            try {
                // Fetch all employees
                const employeesSnapshot = await getDocs(query(collection(db, 'employees'), where('status', '!=', 'Terminated')));
                const workers = employeesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Worker));
                const totalEmployees = workers.length;

                // Calculate total payroll for current month
                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth();
                
                let totalPayroll = 0;
                
                // Fetch attendance for current month
                const attendanceSnapshot = await getDocs(collection(db, `attendance_${year}_${month + 1}`));
                const attendanceData: { [key: string]: any } = {};
                attendanceSnapshot.forEach(doc => {
                    attendanceData[doc.id] = doc.data().days;
                });

                // Fetch monthly financials for current month
                const salaryCollectionName = `salaries_${year}_${month + 1}`;
                const monthlyDocsSnap = await getDocs(collection(db, salaryCollectionName));
                const monthlyDataMap: { [employeeId: string]: MonthlyData } = {};
                monthlyDocsSnap.forEach(doc => {
                    monthlyDataMap[doc.id] = doc.data() as MonthlyData;
                });

                const workersWithFullData = workers.map(w => ({
                    ...w,
                    days: attendanceData[w.id] || {},
                    commission: monthlyDataMap[w.id]?.commission || 0,
                    advances: monthlyDataMap[w.id]?.advances || 0,
                    penalties: monthlyDataMap[w.id]?.penalties || 0,
                }));
                
                workersWithFullData.forEach(w => {
                    totalPayroll += calculatePayroll(w, year, month).netSalary;
                });
                
                const todayStart = new Date();
                todayStart.setHours(0,0,0,0);
                
                const allLeaveReqs = await getDocs(collection(db, 'leaveRequests'));
                const approvedLeaves = allLeaveReqs.docs
                    .map(doc => doc.data())
                    .filter(leave => leave.status === 'approved');

                const onLeaveIds = new Set<string>();
                 approvedLeaves.forEach(leave => {
                     const startDate = leave.startDate.toDate();
                     const endDate = leave.endDate.toDate();
                     if(startDate <= todayStart && endDate >= todayStart) {
                         onLeaveIds.add(leave.employeeId);
                     }
                });


                // Fetch absent employees today
                const dayOfMonth = today.getDate();
                const isFriday = today.getDay() === 5;
                let absentToday = 0;

                if (!isFriday) {
                    const employeeIds = workers.map(w => w.id);

                    const attendedIds = new Set<string>();
                    attendanceSnapshot.forEach(doc => {
                        const dayData = doc.data().days?.[dayOfMonth];
                        if (dayData?.status === 'present') {
                           attendedIds.add(doc.id);
                        }
                    });

                    absentToday = employeeIds.filter(id => !attendedIds.has(id) && !onLeaveIds.has(id)).length;
                }
                
                setKpiData({
                    totalEmployees,
                    totalPayroll,
                    onLeaveToday: onLeaveIds.size,
                    absentToday
                });
            } catch (error) {
                console.error("Error fetching KPI data:", error);
            } finally {
                setLoading(false);
            }
        };

        const handleDataUpdate = () => fetchKpiData();
        fetchKpiData();
        window.addEventListener('data-updated', handleDataUpdate);
        return () => window.removeEventListener('data-updated', handleDataUpdate);
    }, []);


    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 no-print">
            <KPICard 
                title="إجمالي الموظفين" 
                value={kpiData.totalEmployees} 
                icon={<Users className="h-5 w-5 text-muted-foreground" />}
                isLoading={loading}
            />
            <KPICard 
                title="إجمالي الرواتب (الشهر)" 
                value={`${kpiData.totalPayroll.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }).replace('ر.س.', 'ريال')}`}
                icon={<Wallet className="h-5 w-5 text-muted-foreground" />}
                isLoading={loading}
            />
            <KPICard 
                title="في إجازة اليوم" 
                value={kpiData.onLeaveToday} 
                icon={<UserCheck className="h-5 w-5 text-muted-foreground" />}
                isLoading={loading}
            />
            <KPICard 
                title="غياب اليوم" 
                value={kpiData.absentToday} 
                icon={<UserX className="h-5 w-5 text-muted-foreground" />}
                isLoading={loading}
            />
        </div>
    );
}
