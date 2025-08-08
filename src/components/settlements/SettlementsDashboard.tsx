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


export default function SettlementsDashboard() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      setLoading(false);
      return;
    };
    setLoading(true);
    try {
      const q = query(collection(db, "employees"), where("status", "==", "Active"));
      const employeesSnapshot = await getDocs(q);
      const workersToLoad = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
      setWorkers(workersToLoad);

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
      )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-full mx-auto">
        <Card className="mb-8">
            <CardHeader>
                <CardTitle className="text-2xl">مركز تصفية المستحقات</CardTitle>
                <CardDescription>
                    قم بإدارة وتصفية مستحقات الموظفين من إجازات سنوية أو إنهاء خدمة من هنا.
                </CardDescription>
            </CardHeader>
        </Card>

        <Tabs defaultValue="leave" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="leave">تصفية الإجازات السنوية</TabsTrigger>
                <TabsTrigger value="eos">تصفية نهاية الخدمة</TabsTrigger>
            </TabsList>
            <TabsContent value="leave">
                <LeaveSettlementTab workers={workers} onAction={fetchData} />
            </TabsContent>
            <TabsContent value="eos">
                <EosSettlementTab workers={workers} onAction={fetchData} />
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
