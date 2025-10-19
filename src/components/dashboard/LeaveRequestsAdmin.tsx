
"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { approveLeaveRequest, rejectLeaveRequest } from '@/app/actions/leave';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '../LoadingSpinner';
import { Badge } from '../ui/badge';
import { Briefcase } from 'lucide-react';
import LeaveRequestActions from './LeaveRequestActions';
import { LeaveRequest } from '@/types';

const leaveTypeMap: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
    annual: { label: 'سنوية', variant: 'secondary' },
    sick: { label: 'مرضية', variant: 'default' },
    emergency: { label: 'طارئة', variant: 'destructive' },
};

interface LeaveRequestsAdminProps {
    requests: LeaveRequest[];
    loading: boolean;
    onAction: () => void;
}

export default function LeaveRequestsAdmin({ requests, loading, onAction }: LeaveRequestsAdminProps) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleApproval = async (id: string, override: boolean, newStartDate?: Date, newEndDate?: Date) => {
        setActionLoading(id);
        const result = await approveLeaveRequest(id, override, newStartDate, newEndDate);
        if (result.success) {
            toast.success("تمت الموافقة", { description: "تمت الموافقة على طلب الإجازة." });
            onAction?.();
        } else {
            toast.error("خطأ", { description: result.error });
        }
        setActionLoading(null);
    }
    
    const handleReject = async (id: string) => {
        setActionLoading(id);
        const result = await rejectLeaveRequest(id);
        if (result.success) {
            toast.info("تم الرفض", { description: "تم رفض طلب الإجازة." });
            onAction?.();
        } else {
            toast.error("خطأ", { description: result.error });
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
