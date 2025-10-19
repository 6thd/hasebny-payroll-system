"use client";

import { useAuth } from '@/hooks/use-auth';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { ArrowRight, Briefcase, CalendarClock, History } from 'lucide-react';
import LeaveRequestsAdmin from '../dashboard/LeaveRequestsAdmin';
import UpcomingLeavesTab from './UpcomingLeavesTab';
import LeaveHistoryTab from './LeaveHistoryTab';

export default function LeaveManagementDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user || user.role !== 'admin') {
    return <LoadingSpinner fullScreen />;
  }

  const handleAction = () => {
    // This custom event helps other components know when to refetch data
    window.dispatchEvent(new CustomEvent('data-updated'));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-full mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-2xl">مركز إدارة الإجازات</CardTitle>
                    <CardDescription>
                    مراجعة واعتماد طلبات الإجازة، وعرض جدول الإجازات القادمة والسجل التاريخي.
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
            <TabsTrigger value="pending">
                <Briefcase className="ml-2 h-4 w-4" />
                طلبات معلقة
            </TabsTrigger>
            <TabsTrigger value="upcoming">
                <CalendarClock className="ml-2 h-4 w-4" />
                إجازات قادمة
            </TabsTrigger>
            <TabsTrigger value="history">
                <History className="ml-2 h-4 w-4" />
                سجل الإجازات
            </TabsTrigger>
          </TabsList>
           <TabsContent value="pending">
                <LeaveRequestsAdmin onAction={handleAction} showAll={true} />
          </TabsContent>
          <TabsContent value="upcoming">
            <UpcomingLeavesTab />
          </TabsContent>
          <TabsContent value="history">
            <LeaveHistoryTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
