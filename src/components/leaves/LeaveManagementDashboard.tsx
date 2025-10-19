"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { ArrowRight, Briefcase, CalendarClock, History, UserCheck } from 'lucide-react';
import LeaveRequestsAdmin from '../dashboard/LeaveRequestsAdmin';
import UpcomingLeavesTab from './UpcomingLeavesTab';
import LeaveHistoryTab from './LeaveHistoryTab';
import EmployeesOnLeave from '../dashboard/EmployeesOnLeave';
import { LeaveRequest } from '@/types';

export default function LeaveManagementDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<LeaveRequest[]>([]);
  const [rejectedRequests, setRejectedRequests] = useState<LeaveRequest[]>([]);
  const [activeLeaves, setActiveLeaves] = useState<LeaveRequest[]>([]);
  const [upcomingLeaves, setUpcomingLeaves] = useState<LeaveRequest[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'leaveRequests'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedRequests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
      setAllRequests(fetchedRequests);

      // Process and categorize requests
      const pending: LeaveRequest[] = [];
      const approved: LeaveRequest[] = [];
      const rejected: LeaveRequest[] = [];
      const active: LeaveRequest[] = [];
      const upcoming: LeaveRequest[] = [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      fetchedRequests.forEach(req => {
        if (req.status === 'pending') {
          pending.push(req);
        } else if (req.status === 'approved') {
          approved.push(req);
          const startDate = req.startDate.toDate();
          const endDate = req.endDate.toDate();
          endDate.setHours(23, 59, 59, 999);

          if (endDate >= today) {
            if (startDate <= today) {
              active.push(req);
            } else {
              upcoming.push(req);
            }
          }
        } else if (req.status === 'rejected') {
          rejected.push(req);
        }
      });
      
      setPendingRequests(pending);
      setApprovedRequests(approved);
      setRejectedRequests(rejected);
      setActiveLeaves(active);
      setUpcomingLeaves(upcoming);

    } catch (error) {
      console.error("Error fetching leave data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData();
      window.addEventListener('data-updated', fetchData);
    }
    return () => {
      window.removeEventListener('data-updated', fetchData);
    };
  }, [user, fetchData]);

  if (!user || user.role !== 'admin') {
    return <LoadingSpinner fullScreen />;
  }

  const handleAction = () => {
    fetchData(); // Refetch all data after an action
  };

  const historyRequests = [...approvedRequests, ...rejectedRequests].sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());

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

        {loading ? <LoadingSpinner fullScreen /> : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Tabs defaultValue="pending" className="w-full">
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
                            <LeaveRequestsAdmin 
                                requests={pendingRequests} 
                                loading={loading} 
                                onAction={handleAction} 
                            />
                        </TabsContent>
                        <TabsContent value="upcoming">
                            <UpcomingLeavesTab leaves={upcomingLeaves} loading={loading} />
                        </TabsContent>
                        <TabsContent value="history">
                            <LeaveHistoryTab requests={historyRequests} loading={loading} />
                        </TabsContent>
                    </Tabs>
                </div>
                <div className="lg:col-span-1">
                    <EmployeesOnLeave 
                        activeLeaves={activeLeaves}
                        upcomingLeaves={upcomingLeaves}
                        loading={loading}
                    />
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
