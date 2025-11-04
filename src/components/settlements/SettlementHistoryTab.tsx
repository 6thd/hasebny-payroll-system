
'use client';

import { useQuery } from '@tanstack/react-query';
import { getSettlements } from '@/app/actions/settlement-actions';
import { type Settlement } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from '@/components/LoadingSpinner';

interface SettlementHistoryTabProps {
    employeeId: string;
}

export default function SettlementHistoryTab({ employeeId }: SettlementHistoryTabProps) {

    const { data: history, isLoading, isError } = useQuery<Settlement[], Error>({
        queryKey: ['settlementHistory', employeeId],
        queryFn: async () => {
            const { settlements, error } = await getSettlements(employeeId);
            if (error) {
                throw new Error(error);
            }
            return settlements || [];
        },
        enabled: !!employeeId,
    });

    const formatCurrency = (amount: number | undefined | null) => {
        if (amount === undefined || amount === null) return 'N/A';
        return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
    };

    const formatDate = (date: any | undefined | null) => {
        if (!date) return 'N/A';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('ar-SA');
    }

    if (isLoading) return <LoadingSpinner />;
    if (isError) return <p className="text-red-500">Error loading settlement history.</p>;

    return (
        <div className="mt-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>نوع التسوية</TableHead>
                        <TableHead>تاريخ التسوية</TableHead>
                        <TableHead>المبلغ الإجمالي</TableHead>
                        <TableHead>تفاصيل</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {history && history.length > 0 ? (
                        history.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <Badge variant={item.type === "EndOfService" ? "destructive" : "secondary"}>
                                        {item.type === "EndOfService" ? "نهاية خدمة" : "تسوية إجازة"}
                                    </Badge>
                                </TableCell>
                                <TableCell>{formatDate(item.calculationDate)}</TableCell>
                                <TableCell>{formatCurrency(item.totalPayout)}</TableCell>
                                <TableCell className="text-xs">{item.details}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center">لا توجد سجلات تسوية.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
