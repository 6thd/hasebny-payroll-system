"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, query, getDocs, Timestamp, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '../LoadingSpinner';
import { Badge } from '../ui/badge';
import { UserCheck, CalendarClock, UserX } from 'lucide-react';
import { Separator } from '../ui/separator';
import { LeaveRequest } from '@/types';


const leaveTypeMap: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
    annual: { label: 'سنوية', variant: 'secondary' },
    sick: { label: 'مرضية', variant: 'default' },
    emergency: { label: 'طارئة', variant: 'destructive' },
};

const LeaveList = ({ title, leaves, icon }: { title: string, leaves: LeaveRequest[], icon: React.ReactNode }) => (
    <div>
        <h4 className="flex items-center gap-2 text-md font-semibold mb-3 text-muted-foreground">
            {icon}
            {title} ({leaves.length})
        </h4>
        {leaves.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-2">لا توجد بيانات.</p>
        ) : (
            <ul className="space-y-3">
                {leaves.map(leave => (
                    <li key={leave.id} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-foreground">{leave.employeeName}</p>
                            <Badge variant={leaveTypeMap[leave.leaveType]?.variant || 'default'}>{leaveTypeMap[leave.leaveType]?.label || leave.leaveType}</Badge>
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

interface EmployeesOnLeaveProps {
    onAction?: () => void;
}

export default function EmployeesOnLeave({ onAction }: EmployeesOnLeaveProps) {
    const [onLeave, setOnLeave] = useState<LeaveRequest[]>([]);
    const [upcomingLeaves, setUpcomingLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOnLeaveEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const q = query(collection(db, 'leaveRequests'), where('status', '==', 'approved'), orderBy('startDate', 'asc'));

            const querySnapshot = await getDocs(q);
            const allLeaves = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
            
            const active: LeaveRequest[] = [];
            const upcoming: LeaveRequest[] = [];
            
            allLeaves.forEach(leave => {
                const startDate = leave.startDate.toDate();
                const endDate = leave.endDate.toDate();
                endDate.setHours(23, 59, 59, 999); 

                if (endDate < today) return; 
                
                if (startDate <= today) {
                    active.push(leave);
                } else {
                    upcoming.push(leave);
                }
            });
            
            setOnLeave(active);
            setUpcomingLeaves(upcoming);

        } catch (error) {
            console.error("Error fetching employees on leave:", error);
            toast.error("خطأ", { description: "لم نتمكن من جلب بيانات الموظفين المجازين." });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const handleDataUpdate = () => fetchOnLeaveEmployees();
        fetchOnLeaveEmployees();
        window.addEventListener('data-updated', handleDataUpdate);
        return () => window.removeEventListener('data-updated', handleDataUpdate);
    }, [fetchOnLeaveEmployees]);

    return (
        <Card className="shadow-lg no-print h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <UserCheck />
                    حالة الإجازات المعتمدة
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
                            icon={<UserX className="h-5 w-5 text-orange-500" />}
                        />
                        <Separator />
                        <LeaveList 
                            title="إجازات قادمة" 
                            leaves={upcomingLeaves} 
                            icon={<CalendarClock className="h-5 w-5 text-blue-500" />}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
