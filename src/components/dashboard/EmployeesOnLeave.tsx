"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '../LoadingSpinner';
import { Badge } from '../ui/badge';
import { UserCheck, CalendarClock } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useAuth } from '@/hooks/use-auth';

interface LeaveRequest {
    id: string;
    employeeName: string;
    leaveType: string;
    startDate: Timestamp;
    endDate: Timestamp;
    status: 'pending' | 'approved' | 'rejected';
}

const leaveTypeMap: { [key: string]: string } = {
    annual: 'سنوية',
    sick: 'مرضية',
    emergency: 'طارئة',
};

const LeaveList = ({ title, leaves, icon }: { title: string, leaves: LeaveRequest[], icon: React.ReactNode }) => (
    <div>
        <h4 className="flex items-center gap-2 text-md font-semibold mb-3 text-muted-foreground">
            {icon}
            {title}
        </h4>
        {leaves.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-2">لا توجد بيانات.</p>
        ) : (
            <ul className="space-y-3">
                {leaves.map(leave => (
                    <li key={leave.id} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold">{leave.employeeName}</p>
                            <Badge variant="secondary">{leaveTypeMap[leave.leaveType] || leave.leaveType}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            من {leave.startDate.toDate().toLocaleDateString('ar-EG')} إلى {leave.endDate.toDate().toLocaleDateString('ar-EG')}
                        </p>
                    </li>
                ))}
            </ul>
        )}
    </div>
);

export default function EmployeesOnLeave() {
    const { user } = useAuth();
    const [onLeave, setOnLeave] = useState<LeaveRequest[]>([]);
    const [upcomingLeaves, setUpcomingLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchOnLeaveEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Fetch all leave requests and filter client-side to avoid complex index requirements.
            const q = query(collection(db, 'leaveRequests'));

            const querySnapshot = await getDocs(q);
            const allLeaves = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
                
            const approvedLeaves = allLeaves.filter(leave => leave.status === 'approved');

            const active: LeaveRequest[] = [];
            const upcoming: LeaveRequest[] = [];
            
            approvedLeaves.forEach(leave => {
                const startDate = leave.startDate.toDate();
                const endDate = leave.endDate.toDate();
                endDate.setHours(23, 59, 59, 999); // Ensure end of day is included

                if (endDate < today) {
                    return; // Skip past leaves
                }
                
                if (startDate <= today) {
                    active.push(leave);
                } else {
                    upcoming.push(leave);
                }
            });
            
            // Sort leaves by start date
            active.sort((a,b) => a.startDate.toMillis() - b.startDate.toMillis());
            upcoming.sort((a,b) => a.startDate.toMillis() - b.startDate.toMillis());

            setOnLeave(active);
            setUpcomingLeaves(upcoming);

        } catch (error) {
            console.error("Error fetching employees on leave:", error);
            toast({ title: "خطأ", description: "لم نتمكن من جلب بيانات الموظفين المجازين.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        // A simple way to trigger re-fetch when actions happen in other components.
        // In a real app, a more robust state management (like Context or Zustand) would be better.
        if(user){
            fetchOnLeaveEmployees();
        }
    }, [user, fetchOnLeaveEmployees]);

    return (
        <Card className="shadow-md no-print h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserCheck />
                    حالة الإجازات
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <LeaveList 
                            title="في إجازة حاليًا" 
                            leaves={onLeave}
                            icon={<UserCheck className="h-5 w-5" />}
                        />
                        <Separator />
                        <LeaveList 
                            title="إجازات قادمة" 
                            leaves={upcomingLeaves} 
                            icon={<CalendarClock className="h-5 w-5" />}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
