"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '../LoadingSpinner';
import { Badge } from '../ui/badge';
import { UserCheck, CalendarClock, UserX } from 'lucide-react';
import { Separator } from '../ui/separator';
import { LeaveRequest } from '@/types';
import { Timestamp } from 'firebase/firestore';

const getJsDate = (date: Date | Timestamp): Date => {
    if (date instanceof Timestamp) {
        return date.toDate();
    }
    return date;
};

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
                            من {getJsDate(leave.startDate).toLocaleDateString('ar-EG')} إلى {getJsDate(leave.endDate).toLocaleDateString('ar-EG')}
                        </p>
                    </li>
                ))}
            </ul>
        )}
    </div>
);

interface EmployeesOnLeaveProps {
    activeLeaves: LeaveRequest[];
    upcomingLeaves: LeaveRequest[];
    loading: boolean;
}

export default function EmployeesOnLeave({ activeLeaves, upcomingLeaves, loading }: EmployeesOnLeaveProps) {
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
                            leaves={activeLeaves}
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
