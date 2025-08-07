"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { approveLeaveRequest, rejectLeaveRequest } from '@/app/actions/leave';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '../LoadingSpinner';
import { Badge } from '../ui/badge';
import { Check, X } from 'lucide-react';

interface LeaveRequest {
    id: string;
    employeeId: string;
    employeeName: string;
    leaveType: string;
    startDate: Timestamp;
    endDate: Timestamp;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected';
}

const leaveTypeMap: { [key: string]: string } = {
    annual: 'سنوية',
    sick: 'مرضية',
    emergency: 'طارئة',
};

export default function LeaveRequestsAdmin() {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'leaveRequests'), where('status', '==', 'pending'));
            const querySnapshot = await getDocs(q);
            const pendingRequests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
            setRequests(pendingRequests);
        } catch (error) {
            console.error("Error fetching leave requests:", error);
            toast({ title: "خطأ", description: "لم نتمكن من جلب طلبات الإجازة.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleApprove = async (id: string) => {
        const result = await approveLeaveRequest(id);
        if (result.success) {
            toast({ title: "تمت الموافقة", description: "تمت الموافقة على طلب الإجازة." });
            fetchRequests();
        } else {
            toast({ title: "خطأ", description: result.error, variant: "destructive" });
        }
    };

    const handleReject = async (id: string) => {
        const result = await rejectLeaveRequest(id);
        if (result.success) {
            toast({ title: "تم الرفض", description: "تم رفض طلب الإجازة." });
            fetchRequests();
        } else {
            toast({ title: "خطأ", description: result.error, variant: "destructive" });
        }
    };

    return (
        <Card className="shadow-md no-print">
            <CardHeader>
                <CardTitle>طلبات الإجازة المعلقة</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-24">
                        <LoadingSpinner />
                    </div>
                ) : requests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">لا توجد طلبات إجازة معلقة حاليًا.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الموظف</TableHead>
                                <TableHead>نوع الإجازة</TableHead>
                                <TableHead>من تاريخ</TableHead>
                                <TableHead>إلى تاريخ</TableHead>
                                <TableHead>ملاحظات</TableHead>
                                <TableHead className="text-center">إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.employeeName}</TableCell>
                                    <TableCell><Badge variant="secondary">{leaveTypeMap[req.leaveType] || req.leaveType}</Badge></TableCell>
                                    <TableCell>{req.startDate.toDate().toLocaleDateString('ar-EG')}</TableCell>
                                    <TableCell>{req.endDate.toDate().toLocaleDateString('ar-EG')}</TableCell>
                                    <TableCell>{req.notes || '-'}</TableCell>
                                    <TableCell className="text-center space-x-2 rtl:space-x-reverse">
                                        <Button size="icon" variant="ghost" className="text-green-600 hover:text-green-700" onClick={() => handleApprove(req.id)}>
                                            <Check className="h-5 w-5" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleReject(req.id)}>
                                            <X className="h-5 w-5" />
                                        </Button>
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
