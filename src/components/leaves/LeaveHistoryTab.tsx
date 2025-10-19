"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '../LoadingSpinner';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { LeaveRequest } from '@/types';
import { Timestamp } from 'firebase/firestore';

const leaveTypeMap: { [key: string]: string } = {
    annual: 'سنوية',
    sick: 'مرضية',
    emergency: 'طارئة',
};

const statusMap: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
    pending: { label: 'قيد المراجعة', variant: 'outline' },
    approved: { label: 'مقبولة', variant: 'default' },
    rejected: { label: 'مرفوضة', variant: 'destructive' },
};

interface LeaveHistoryTabProps {
    requests: LeaveRequest[];
    loading: boolean;
}

export default function LeaveHistoryTab({ requests, loading }: LeaveHistoryTabProps) {
    const formatDate = (timestamp: Timestamp) => {
        if (!timestamp) return 'N/A';
        return format(timestamp.toDate(), 'P', { locale: arSA });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>سجل الإجازات التاريخي</CardTitle>
                <CardDescription>
                    عرض لجميع طلبات الإجازة السابقة والحالية وحالتها.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <LoadingSpinner />
                    </div>
                ) : requests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">لا توجد طلبات إجازة سابقة.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الموظف</TableHead>
                                <TableHead>النوع</TableHead>
                                <TableHead>تاريخ البدء</TableHead>
                                <TableHead>تاريخ الانتهاء</TableHead>
                                <TableHead>الحالة</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.employeeName}</TableCell>
                                    <TableCell>{leaveTypeMap[req.leaveType] || req.leaveType}</TableCell>
                                    <TableCell>{formatDate(req.startDate)}</TableCell>
                                    <TableCell>{formatDate(req.endDate)}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusMap[req.status]?.variant || 'secondary'}>
                                            {statusMap[req.status]?.label || req.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
