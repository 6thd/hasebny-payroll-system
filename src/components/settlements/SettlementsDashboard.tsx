
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, collectionGroup, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/use-auth';
import type { Worker, ServiceHistoryItem, LeaveRequest } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LeaveSettlementTab from './LeaveSettlementTab';
import EosSettlementTab from './EosSettlementTab';
import SettlementHistoryTab from './SettlementHistoryTab';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

const LEAVE_TYPES_FOR_SETTLEMENT = ["annual", "emergency"] as const;

export default function SettlementsDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [eosWorkers, setEosWorkers] = useState<Worker[]>([]);
  const [leaveWorkers, setLeaveWorkers] = useState<Worker[]>([]);
  const [history, setHistory] = useState<ServiceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const [
        allEmployeesSnapshot,
        leaveRequestsSnapshot,
        historySnapshot
      ] = await Promise.all([
        getDocs(collection(db, "employees")),
        getDocs(query(
          collection(db, "leaveRequests"),
          where("status", "==", "approved"),
          where("leaveType", "in", [...LEAVE_TYPES_FOR_SETTLEMENT])
        )),
        getDocs(query(collectionGroup(db, 'serviceHistory'), orderBy('finalizedAt', 'desc')))
      ]);

      // Safely construct Worker objects
      const allWorkers: Worker[] = allEmployeesSnapshot.docs.map((doc):
Worker => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'N/A',
          jobTitle: data.jobTitle || 'N/A',
          joiningDate: data.joiningDate,
          salary: data.salary || 0,
          contractType: data.contractType || 'unlimited',
          ...data, // Spread the rest of the data
        };
      });

      const activeWorkersForEos = allWorkers.filter(w => w.status !== "Terminated");
      setEosWorkers(activeWorkersForEos);

      const approvedLeaveData: { [employeeId: string]: string } = {};
      leaveRequestsSnapshot.forEach(doc => {
          const req = doc.data() as LeaveRequest;
          const existingDate = approvedLeaveData[req.employeeId];
          const currentStartDate = req.startDate.toDate().toISOString().split('T')[0];
          if (!existingDate || new Date(currentStartDate) > new Date(existingDate)) {
             approvedLeaveData[req.employeeId] = currentStartDate;
          }
      });
      
      const approvedEmployeeIds = Object.keys(approvedLeaveData);

      if (approvedEmployeeIds.length > 0) {
        const leaveWorkersToLoad = allWorkers
            .filter(worker => worker.id && approvedEmployeeIds.includes(worker.id) && worker.status !== 'Terminated')
            .map(worker => ({
                ...worker,
                lastApprovedLeaveDate: approvedLeaveData[worker.id!]
            }));
        setLeaveWorkers(leaveWorkersToLoad);
      } else {
        setLeaveWorkers([]);
      }
      
      const employeeNames: { [id: string]: string } = {};
      allWorkers.forEach(w => { employeeNames[w.id] = w.name; });

      // Safely construct ServiceHistoryItem objects
      const historyItems: ServiceHistoryItem[] = historySnapshot.docs.map((doc): ServiceHistoryItem => {
          const data = doc.data();
          const employeeId = doc.ref.parent.parent?.id || '';
          return {
            id: doc.id,
            startDate: data.startDate,
            endDate: data.endDate,
            jobTitle: data.jobTitle,
            salary: data.salary,
            details: data.details,
            employeeName: employeeNames[employeeId] || 'Unknown Employee',
            type: data.type || 'N/A',
            finalizedAt: data.finalizedAt,
            totalAmount: data.totalAmount,
            monetaryValue: data.monetaryValue,
            ...data, // spread the rest
          };
      });
      setHistory(historyItems);

    } catch (error: any) {
      console.error("Error fetching settlements data: ", error);
      let errorMessage = "An unknown error occurred while fetching data.";
      if (error.code === 'permission-denied') {
          errorMessage = "You do not have permission to access this data.";
      } else if (error.message) {
          errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center">
        <div className="max-w-md mx-auto p-6 bg-destructive/10 rounded-lg">
          <h3 className="text-lg font-semibold text-destructive mb-2">خطأ في تحميل البيانات</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={fetchData}>إعادة المحاولة</Button>
            <Button variant="outline" onClick={() => router.push('/')}>العودة للوحة التحكم</Button>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <p>ليس لديك الصلاحية للوصول إلى هذه الصفحة.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-full mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-2xl">مركز تصفية المستحقات</CardTitle>
                    <CardDescription>
                    قم بإدارة وتصفية مستحقات الموظفين ومراجعة السجل التاريخي للعمليات.
                    </CardDescription>
                </div>
                <Button onClick={() => router.push('/')}>
                    <ArrowRight className="ml-2 h-4 w-4" />
                    العودة للوحة التحكم
                </Button>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history">سجل التسويات</TabsTrigger>
            <TabsTrigger value="leave">تصفية الإجازات السنوية</TabsTrigger>
            <TabsTrigger value="eos">تصفية نهاية الخدمة</TabsTrigger>
          </TabsList>
           <TabsContent value="history">
            <SettlementHistoryTab historyItems={history} />
          </TabsContent>
          <TabsContent value="leave">
            <LeaveSettlementTab workers={leaveWorkers} onAction={fetchData} />
          </TabsContent>
          <TabsContent value="eos">
            <EosSettlementTab workers={eosWorkers} onAction={fetchData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
