
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, collectionGroup, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Worker, ServiceHistoryItem } from '@/types';
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

  const fetchData = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // --- Fetch for End of Service Tab ---
      const eosSnapshot = await getDocs(query(collection(db, "employees"), where("status", "!=", "Terminated")));
      const activeWorkersForEos = eosSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Worker));
      setEosWorkers(activeWorkersForEos);

      // --- Fetch for Leave Settlement Tab ---
      const allEmployeesSnapshot = await getDocs(collection(db, "employees"));
      const allWorkers = allEmployeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
      
      const leaveRequestsQuery = query(
        collection(db, "leaveRequests"), 
        where("status", "==", "approved"),
        where("leaveType", "in", [...LEAVE_TYPES_FOR_SETTLEMENT])
      );
      
      const leaveRequestsSnapshot = await getDocs(leaveRequestsQuery);
      
      const approvedLeaveData: { [employeeId: string]: string } = {};
      leaveRequestsSnapshot.forEach(doc => {
          const req = doc.data();
          const existingDate = approvedLeaveData[req.employeeId];
          const currentStartDate = req.startDate.toDate().toISOString().split('T')[0];
          if (!existingDate || new Date(currentStartDate) > new Date(existingDate)) {
             approvedLeaveData[req.employeeId] = currentStartDate;
          }
      });
      
      const approvedEmployeeIds = Object.keys(approvedLeaveData);

      if (approvedEmployeeIds.length > 0) {
        const leaveWorkersToLoad = allWorkers
            .filter(worker => approvedEmployeeIds.includes(worker.id) && worker.status !== 'Terminated')
            .map(worker => ({
                ...worker,
                lastApprovedLeaveDate: approvedLeaveData[worker.id]
            }));
        setLeaveWorkers(leaveWorkersToLoad);
      } else {
        setLeaveWorkers([]);
      }
      
      // --- Fetch for History Tab ---
        const historyQuery = query(collectionGroup(db, 'serviceHistory'), orderBy('finalizedAt', 'desc'));
        const historySnapshot = await getDocs(historyQuery);
        const employeeNames: { [id: string]: string } = {};
        allWorkers.forEach(w => { employeeNames[w.id] = w.name; });

        const historyItems = historySnapshot.docs.map(doc => {
            const data = doc.data();
            const employeeId = doc.ref.parent.parent?.id || '';
            return {
                ...data,
                id: doc.id,
                employeeId: employeeId,
                employeeName: employeeNames[employeeId] || 'موظف غير معروف',
            } as ServiceHistoryItem;
        });
      setHistory(historyItems);


    } catch (error) {
      console.error("Error fetching workers: ", error);
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
