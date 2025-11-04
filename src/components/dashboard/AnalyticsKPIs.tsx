"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Wallet, UserX, UserCheck } from 'lucide-react';
import { Worker, MonthlyData, LeaveRequest } from '@/types';
import { calculatePayroll } from '@/lib/utils';
import LoadingSpinner from '../LoadingSpinner';

const KPICard = ({ title, value, icon, isLoading, brandColor }: { title: string; value: string | number; icon: React.ReactNode, isLoading: boolean, brandColor: string }) => (
  <Card className={`shadow-lg transition-all hover:shadow-xl hover:shadow-${brandColor}/20 hover:scale-105 border-t-4 ${brandColor}`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="h-8 w-1/2 mt-1 rounded-md animate-pulse bg-muted"></div>
      ) : (
        <div className="text-2xl font-bold text-foreground">{value}</div>
      )}
    </CardContent>
  </Card>
);


export default function AnalyticsKPIs({ workers, approvedLeaves }: { workers: Worker[], approvedLeaves: LeaveRequest[] }) {
    const [kpiData, setKpiData] = useState({
        totalEmployees: 0,
        totalPayroll: 0,
        onLeaveToday: 0,
        absentToday: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getJsDate = (date: Date | Timestamp): Date => {
            if (date instanceof Timestamp) {
                return date.toDate();
            }
            return date;
        };

        const calculateKpis = async () => {
            setLoading(true);
            try {
                if (!workers || workers.length === 0) {
                    setKpiData({ totalEmployees: 0, totalPayroll: 0, onLeaveToday: 0, absentToday: 0 });
                    return;
                }

                // --- 1. Total active employees ---
                const activeWorkers = workers.filter(w => w.status !== 'Terminated');
                const totalEmployees = activeWorkers.length;
                const employeeIds = activeWorkers.map(w => w.id);

                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth();
                const dayOfMonth = today.getDate();
                const isFriday = today.getDay() === 5;

                // --- 2. Calculate total payroll for current month ---
                let totalPayroll = 0;
                activeWorkers.forEach(w => {
                    totalPayroll += calculatePayroll(w, year, month).netSalary;
                });
                
                // --- 3. Calculate employees on leave today from the passed-in prop ---
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                const onLeaveIds = new Set<string>();
                approvedLeaves.forEach(leave => {
                    const startDate = getJsDate(leave.startDate);
                    const endDate = getJsDate(leave.endDate);
                    if(startDate <= today && endDate >= todayStart) {
                        onLeaveIds.add(leave.employeeId);
                    }
                });
                
                // --- 4. Fetch absent employees today ---
                let absentToday = 0;
                if (!isFriday) {
                   const attendedTodayIds = new Set<string>();
                   activeWorkers.forEach(worker => {
                       const dayData = worker.days?.[dayOfMonth];
                       // If there's any status other than absent, consider them attended for this KPI
                       if (dayData && dayData.status !== 'absent') {
                           attendedTodayIds.add(worker.id);
                       }
                   });
                    
                    // An employee is absent if they are active, not on leave, and have no attendance record for today.
                    absentToday = employeeIds.filter(id => !onLeaveIds.has(id) && !attendedTodayIds.has(id)).length;
                }
                
                setKpiData({
                    totalEmployees,
                    totalPayroll,
                    onLeaveToday: onLeaveIds.size,
                    absentToday
                });
            } catch (error) {
                console.error("Error calculating KPI data:", error);
            } finally {
                setLoading(false);
            }
        };

        const handleDataUpdate = () => calculateKpis();
        calculateKpis();
        window.addEventListener('data-updated', handleDataUpdate);
        return () => window.removeEventListener('data-updated', handleDataUpdate);
    }, [workers, approvedLeaves]);


    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 no-print">
            <KPICard 
                title="إجمالي الموظفين" 
                value={kpiData.totalEmployees} 
                icon={<Users className="h-5 w-5 text-muted-foreground" />}
                isLoading={loading}
                brandColor="border-chart-1"
            />
            <KPICard 
                title="إجمالي الرواتب (الشهر)" 
                value={`${kpiData.totalPayroll.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }).replace('ر.س.', 'ريال')}`}
                icon={<Wallet className="h-5 w-5 text-muted-foreground" />}
                isLoading={loading}
                brandColor="border-chart-2"
            />
            <KPICard 
                title="في إجازة اليوم" 
                value={kpiData.onLeaveToday} 
                icon={<UserCheck className="h-5 w-5 text-muted-foreground" />}
                isLoading={loading}
                brandColor="border-chart-4"
            />
            <KPICard 
                title="غياب اليوم" 
                value={kpiData.absentToday} 
                icon={<UserX className="h-5 w-5 text-muted-foreground" />}
                isLoading={loading}
                brandColor="border-destructive"
            />
        </div>
    );
}
