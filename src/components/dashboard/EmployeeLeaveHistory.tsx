"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '../LoadingSpinner';
import { Badge } from '../ui/badge';
import { History } from 'lucide-react';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';


interface LeaveRequest {
    id: string;
    leaveType: string;
    startDate: Timestamp;
    endDate: Timestamp;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Timestamp;
}

const leaveTypeMap: { [key: string]: string } = {
    annual: 'سنوية',
    sick: 'مرضية',
    emergency: 'طارئة',
};

const statusMap: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
    pending: { label: 'قيد المراجعة', variant: 'outline' },
    approved: { label: 'مقبولة', variant: 'default' }, // 'default' is primary color
    rejected: { label: 'مرفوضة', variant: 'destructive' },
};


interface EmployeeLeaveHistoryProps {
    employeeId: string;
}

export default function EmployeeLeaveHistory({ employeeId }: EmployeeLeaveHistoryProps) {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchRequests = useCallback(async () => {
        if (!employeeId) return;
        setLoading(true);
        try {
            const q = query(
                collection(db, 'leaveRequests'), 
                where('employeeId', '==', employeeId)
            );
            const querySnapshot = await getDocs(q);
            const fetchedRequests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
            
            // Sort client-side to avoid composite index
            fetchedRequests.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

            setRequests(fetchedRequests);
        } catch (error) {
            console.error("Error fetching leave history:", error);
            toast({ title: "خطأ", description: "لم نتمكن من جلب سجل طلبات الإجازة.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [employeeId, toast]);

    useEffect(() => {
        const handleDataUpdate = () => fetchRequests();
        fetchRequests();
        window.addEventListener('data-updated', handleDataUpdate);
        return () => window.removeEventListener('data-updated', handleDataUpdate);
    }, [fetchRequests]);

    const formatDate = (timestamp: Timestamp) => {
        if (!timestamp) return 'N/A';
        try {
          return format(timestamp.toDate(), 'P', { locale: arSA });
        } catch (e) {
            console.error("Invalid timestamp for date formatting:", timestamp);
            return 'تاريخ غير صالح';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-6 w-6" />
                    سجل طلبات الإجازة
                </CardTitle>
            </CardHeader>
            <CardContent>
                 {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <LoadingSpinner />
                    </div>
                ) : requests.length === 0 ? (
                     <p className="text-center text-muted-foreground py-4">لا توجد طلبات إجازة سابقة.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table dir="rtl">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>نوع الإجازة</TableHead>
                                    <TableHead>تاريخ البدء</TableHead>
                                    <TableHead>تاريخ الانتهاء</TableHead>
                                    <TableHead>الحالة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((req) => (
                                    <TableRow key={req.id}>
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
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
