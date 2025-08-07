"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '../LoadingSpinner';
import { Badge } from '../ui/badge';
import { UserCheck } from 'lucide-react';

interface OnLeaveEmployee {
    id: string;
    employeeName: string;
    leaveType: string;
    startDate: Timestamp;
    endDate: Timestamp;
}

const leaveTypeMap: { [key: string]: string } = {
    annual: 'سنوية',
    sick: 'مرضية',
    emergency: 'طارئة',
};

export default function EmployeesOnLeave() {
    const [onLeave, setOnLeave] = useState<OnLeaveEmployee[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchOnLeaveEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const today = Timestamp.now();
            const q = query(
                collection(db, 'leaveRequests'), 
                where('status', '==', 'approved'),
                where('startDate', '<=', today)
            );

            const querySnapshot = await getDocs(q);
            const activeLeaves = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as OnLeaveEmployee))
                .filter(leave => leave.endDate >= today);

            setOnLeave(activeLeaves);
        } catch (error) {
            console.error("Error fetching employees on leave:", error);
            toast({ title: "خطأ", description: "لم نتمكن من جلب بيانات الموظفين المجازين.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchOnLeaveEmployees();
    }, [fetchOnLeaveEmployees]);

    return (
        <Card className="shadow-md no-print h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserCheck />
                    الموظفون في إجازة حاليًا
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-24">
                        <LoadingSpinner />
                    </div>
                ) : onLeave.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">لا يوجد موظفون في إجازة حاليًا.</p>
                ) : (
                    <ul className="space-y-4">
                        {onLeave.map(employee => (
                            <li key={employee.id} className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold">{employee.employeeName}</p>
                                    <Badge variant="secondary">{leaveTypeMap[employee.leaveType] || employee.leaveType}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    تنتهي بتاريخ: {employee.endDate.toDate().toLocaleDateString('ar-EG')}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
