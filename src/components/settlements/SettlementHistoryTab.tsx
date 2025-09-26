
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from '@/components/ui/scroll-area';
import { ServiceHistoryItem } from "@/types";
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Clock, FileText, User } from "lucide-react";

interface SettlementHistoryTabProps {
    historyItems: ServiceHistoryItem[];
}

const SettlementTypeBadge = ({ type }: { type: 'EndOfService' | 'LeaveSettlement' }) => {
    if (type === 'EndOfService') {
        return <Badge variant="destructive">إنهاء خدمة</Badge>;
    }
    return <Badge variant="secondary">تصفية إجازة</Badge>;
};

export default function SettlementHistoryTab({ historyItems }: SettlementHistoryTabProps) {
    const formatDate = (timestamp: any) => {
        if (!timestamp || !timestamp.toDate) return 'N/A';
        try {
            return format(timestamp.toDate(), 'PPP p', { locale: arSA });
        } catch (e) {
            return 'تاريخ غير صالح';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>سجل عمليات التسوية</CardTitle>
                <CardDescription>
                    عرض لجميع عمليات تصفية المستحقات التي تمت في النظام.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[50vh] border rounded-md">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                                <TableHead className="flex items-center gap-2"><User />اسم الموظف</TableHead>
                                <TableHead><FileText />نوع التسوية</TableHead>
                                <TableHead><Clock />تاريخ التنفيذ</TableHead>
                                <TableHead className="text-left">المبلغ الإجمالي</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {historyItems.length > 0 ? historyItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.employeeName}</TableCell>
                                    <TableCell>
                                        <SettlementTypeBadge type={item.type} />
                                    </TableCell>
                                    <TableCell>{formatDate(item.finalizedAt)}</TableCell>
                                    <TableCell className="text-left font-semibold text-primary">
                                        {(item.totalAmount ?? item.monetaryValue ?? 0).toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        لا توجد عمليات تسوية مسجلة حتى الآن.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
