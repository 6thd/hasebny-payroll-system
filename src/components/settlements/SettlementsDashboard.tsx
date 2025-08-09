"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Worker } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LeaveSettlementTab from './LeaveSettlementTab';
import EosSettlementTab from './EosSettlementTab';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function SettlementsDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [eosWorkers, setEosWorkers] = useState<Worker[]>([]);
  const [leaveWorkers, setLeaveWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Fetch workers for End of Service tab (all non-terminated employees)
      const eosQuery = query(collection(db, "employees"), where("status", "!=", "Terminated"));
      const eosSnapshot = await getDocs(eosQuery);
      const allActiveWorkers = eosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
      setEosWorkers(allActiveWorkers);

      // 2. Fetch workers for Leave Settlement tab
      const leaveRequestsQuery = query(
        collection(db, "leaveRequests"), 
        where("status", "==", "approved"),
        where("leaveType", "in", ["annual", "emergency"])
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
        // Filter from the already fetched active workers list
        const leaveWorkersToLoad = allActiveWorkers
            .filter(worker => approvedEmployeeIds.includes(worker.id))
            .map(worker => ({
                ...worker,
                lastApprovedLeaveDate: approvedLeaveData[worker.id]
            }));
        setLeaveWorkers(leaveWorkersToLoad);
      } else {
        setLeaveWorkers([]);
      }

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
                    قم بإدارة وتصفية مستحقات الموظفين من إجازات سنوية أو إنهاء خدمة من هنا.
                    </CardDescription>
                </div>
                <Button onClick={() => router.push('/')}>
                    <ArrowRight className="ml-2 h-4 w-4" />
                    العودة للوحة التحكم
                </Button>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="leave" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leave">تصفية الإجازات السنوية</TabsTrigger>
            <TabsTrigger value="eos">تصفية نهاية الخدمة</TabsTrigger>
          </TabsList>
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
