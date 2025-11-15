"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '../LoadingSpinner';
import { Badge } from '../ui/badge';
import { LeaveRequest } from '@/types';

const leaveTypeMap: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
    annual: { label: 'سنوية', variant: 'secondary' },
    sick: { label: 'مرضية', variant: 'default' },
    emergency: { label: 'طارئة', variant: 'destructive' },
};

interface UpcomingLeavesTabProps {
    leaves: LeaveRequest[];
    loading: boolean;
}

export default function UpcomingLeavesTab({ leaves, loading }: UpcomingLeavesTabProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>الإجازات المعتمدة القادمة</CardTitle>
                <CardDescription>
                    قائمة بالموظفين الذين سيبدأون إجازاتهم قريبًا.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <LoadingSpinner />
                    </div>
                ) : leaves.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">لا توجد إجازات قادمة مجدولة.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الموظف</TableHead>
                                <TableHead>نوع الإجازة</TableHead>
                                <TableHead>تاريخ البدء</TableHead>
                                <TableHead>تاريخ الانتهاء</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leaves.map((leave) => (
                                <TableRow key={leave.id}>
                                    <TableCell className="font-medium">{leave.employeeName}</TableCell>
                                    <TableCell>
                                        <Badge variant={leaveTypeMap[leave.leaveType]?.variant || 'default'}>
                                            {leaveTypeMap[leave.leaveType]?.label || leave.leaveType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(leave.startDate).toLocaleDateString('ar-EG')}</TableCell>
                                    <TableCell>{new Date(leave.endDate).toLocaleDateString('ar-EG')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
