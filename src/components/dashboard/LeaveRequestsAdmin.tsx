
"use client";

import { useState } from 'react';
import { collection, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useFirestoreListener } from '@/hooks/use-firestore-listener';
import { approveLeaveRequest, rejectLeaveRequest } from '@/app/actions/leave';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '../LoadingSpinner';
import { Badge } from '../ui/badge';
import { Briefcase } from 'lucide-react';
import LeaveRequestActions from './LeaveRequestActions';


interface LeaveRequest {
    id: string;
    employeeId: string;
    employeeName: string;
    leaveType: string;
    startDate: Timestamp;
    endDate: Timestamp;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Timestamp;
}

const leaveTypeMap: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
    annual: { label: 'سنوية', variant: 'secondary' },
    sick: { label: 'مرضية', variant: 'default' },
    emergency: { label: 'طارئة', variant: 'destructive' },
};


interface LeaveRequestsAdminProps {
    onAction?: () => void;
    itemCount?: number;
}

export default function LeaveRequestsAdmin({ onAction, itemCount = 5 }: LeaveRequestsAdminProps) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { toast } = useToast();

    const { data: requests, loading } = useFirestoreListener<LeaveRequest>({
        query: query(collection(db, 'leaveRequests')),
        onFetch: (allRequests) => {
            return allRequests
                .filter(req => req.status === 'pending')
                .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
                .slice(0, itemCount);
        },
        dependencies: [itemCount]
    });

    const handleApproval = async (id: string, override: boolean, newStartDate?: Date, newEndDate?: Date) => {
        setActionLoading(id);
        const result = await approveLeaveRequest(id, override, newStartDate, newEndDate);
        if (result.success) {
            toast({ title: "تمت الموافقة", description: "تمت الموافقة على طلب الإجازة." });
            onAction?.();
        } else {
            toast({ title: "خطأ", description: result.error, variant: "destructive" });
        }
        setActionLoading(null);
    }
    
    const handleReject = async (id: string) => {
        setActionLoading(id);
        const result = await rejectLeaveRequest(id);
        if (result.success) {
            toast({ title: "تم الرفض", description: "تم رفض طلب الإجازة." });
            onAction?.();
        } else {
            toast({ title: "خطأ", description: result.error, variant: "destructive" });
        }
        setActionLoading(null);
    };


    return (
        <Card className="shadow-lg no-print h-full">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-lg"><Briefcase />طلبات الإجازة المعلقة</span>
                    <Badge variant="destructive">{requests.length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <LoadingSpinner />
                    </div>
                ) : requests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">لا توجد طلبات إجازة معلقة حاليًا.</p>
                ) : (
                    <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الموظف</TableHead>
                                <TableHead>النوع</TableHead>
                                <TableHead>المدة</TableHead>
                                <TableHead className="text-center">إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium whitespace-nowrap">{req.employeeName}</TableCell>
                                    <TableCell><Badge variant={leaveTypeMap[req.leaveType]?.variant || 'default'}>{leaveTypeMap[req.leaveType]?.label || req.leaveType}</Badge></TableCell>
                                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                        {req.startDate.toDate().toLocaleDateString('ar-EG')} - {req.endDate.toDate().toLocaleDateString('ar-EG')}
                                    </TableCell>
                                    <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                                       <LeaveRequestActions 
                                            request={req}
                                            isLoading={!!actionLoading}
                                            actionLoadingId={actionLoading}
                                            onApprove={handleApproval}
                                            onReject={handleReject}
                                       />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
