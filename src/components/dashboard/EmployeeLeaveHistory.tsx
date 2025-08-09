"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    approved: { label: 'مقبولة', variant: 'default' },
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
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                نوع الإجازة
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                تاريخ البدء
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                تاريخ الانتهاء
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                الحالة
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {requests.map((req) => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
                                        {leaveTypeMap[req.leaveType] || req.leaveType}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                                        {formatDate(req.startDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                                        {formatDate(req.endDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                                        <Badge variant={statusMap[req.status]?.variant || 'secondary'}>
                                            {statusMap[req.status]?.label || req.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
