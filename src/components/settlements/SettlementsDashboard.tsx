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
import { checkFirebaseConnection, checkNetworkConnectivity } from '@/lib/firebase-utils';

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
    console.log("SettlementsDashboard: Starting fetchData");
    
    if (!user) {
      console.log("SettlementsDashboard: No user, skipping fetch");
      setLoading(false);
      return;
    }
    
    if (user.role !== 'admin') {
      console.log("SettlementsDashboard: User not admin, skipping fetch");
      setLoading(false);
      return;
    }
    
    // Check network connectivity first
    if (!checkNetworkConnectivity()) {
      console.log("SettlementsDashboard: No network connectivity");
      setError("لا يوجد اتصال بالإنترنت. يرجى التحقق من اتصالك بالشبكة.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("SettlementsDashboard: Checking Firebase connection");
      const connectionCheck = await checkFirebaseConnection();
      if (!connectionCheck.success) {
        console.log("SettlementsDashboard: Firebase connection failed");
        setError(`فشل الاتصال بقاعدة البيانات: ${connectionCheck.error}`);
        setLoading(false);
        return;
      }
      
      console.log("SettlementsDashboard: Fetching EOS data");
      // --- Fetch for End of Service Tab ---
      const eosSnapshot = await getDocs(query(collection(db, "employees"), where("status", "!=", "Terminated")));
      const activeWorkersForEos = eosSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Worker));
      setEosWorkers(activeWorkersForEos);

      console.log("SettlementsDashboard: Fetching leave data");
      // --- Fetch for Leave Settlement Tab ---
      const allEmployeesSnapshot = await getDocs(collection(db, "employees"));
      console.log("SettlementsDashboard: All employees snapshot received", allEmployeesSnapshot.size);
      
      const allWorkers: Worker[] = allEmployeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
      console.log("SettlementsDashboard: All workers processed", allWorkers.length);
      
      const leaveRequestsQuery = query(
        collection(db, "leaveRequests"), 
        where("status", "==", "approved"),
        where("leaveType", "in", [...LEAVE_TYPES_FOR_SETTLEMENT])
      );
      
      console.log("SettlementsDashboard: Fetching leave requests");
      const leaveRequestsSnapshot = await getDocs(leaveRequestsQuery);
      console.log("SettlementsDashboard: Leave requests snapshot received", leaveRequestsSnapshot.size);
      
      const approvedLeaveData: { [employeeId: string]: string } = {};
      leaveRequestsSnapshot.forEach(doc => {
          const req = doc.data();
          const existingDate = approvedLeaveData[req.employeeId];
          const currentStartDate = req.startDate.toDate().toISOString().split('T')[0];
          if (!existingDate || new Date(currentStartDate) > new Date(existing.Date)) {
             approvedLeaveData[req.employeeId] = currentStartDate;
          }
      });
      
      console.log("SettlementsDashboard: Approved leave data processed", Object.keys(approvedLeaveData).length);
      const approvedEmployeeIds = Object.keys(approvedLeaveData);

      if (approvedEmployeeIds.length > 0) {
        const leaveWorkersToLoad = allWorkers
            .filter(worker => approvedEmployeeIds.includes(worker.id) && worker.status !== 'Terminated')
            .map(worker => ({
                ...worker,
                lastApprovedLeaveDate: approvedLeaveData[worker.id]
            }));
        console.log("SettlementsDashboard: Leave workers to load", leaveWorkersToLoad.length);
        setLeaveWorkers(leaveWorkersToLoad);
      } else {
        console.log("SettlementsDashboard: No approved leave workers");
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


    } catch (error: any) {
      console.error("Error fetching workers: ", error);
      // Check if it's a network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError("فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت وإعادة المحاولة.");
      } else {
        setError(error instanceof Error ? error.message : "حدث خطأ أثناء جلب البيانات");
      }
    } finally {
      console.log("SettlementsDashboard: Finished fetchData");
      setLoading(false);
    }
  }, [user]);


  useEffect(() => {
    console.log("SettlementsDashboard: useEffect triggered");
    fetchData();
  }, [fetchData]);

  if (loading) {
    console.log("SettlementsDashboard: Showing loading spinner");
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
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

  console.log("SettlementsDashboard: Rendering dashboard with", {
    eosWorkers: eosWorkers.length,
    leaveWorkers: leaveWorkers.length
  });

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
