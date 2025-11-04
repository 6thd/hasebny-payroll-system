"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Worker } from "@/types";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calculator } from 'lucide-react';
import LeaveSettlementModal from './LeaveSettlementModal';

interface LeaveSettlementTabProps {
    workers: (Worker & { lastApprovedLeaveDate?: string })[];
    onAction: () => void;
}

export default function LeaveSettlementTab({ workers, onAction }: LeaveSettlementTabProps) {
    const [selectedWorker, setSelectedWorker] = useState<(Worker & { lastApprovedLeaveDate?: string }) | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = (worker: Worker & { lastApprovedLeaveDate?: string }) => {
        setSelectedWorker(worker);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setSelectedWorker(null);
        setIsModalOpen(false);
        onAction(); // refetch data
    }

    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle>تصفية رصيد الإجازات السنوية</CardTitle>
                <CardDescription>
                    اختر موظفًا لحساب رصيد إجازاته المستحقة وتصفيتها. سيؤدي هذا إلى إعادة تعيين فترة استحقاق الإجازة للموظف.
                    يعرض هذا الجدول فقط الموظفين الذين لديهم إجازات معتمدة.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <ScrollArea className="h-[50vh] border rounded-md">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                                <TableHead>اسم الموظف</TableHead>
                                <TableHead>الرقم الوظيفي</TableHead>
                                <TableHead>تاريخ آخر إجازة معتمدة</TableHead>
                                <TableHead className="text-left">إجراء</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workers && workers.length > 0 ? workers.map((worker) => (
                                <TableRow key={worker.id}>
                                    <TableCell className="font-medium">{worker.name}</TableCell>
                                    <TableCell>{worker.employeeId || 'N/A'}</TableCell>
                                    <TableCell>{worker.lastApprovedLeaveDate || 'N/A'}</TableCell>
                                    <TableCell className="text-left">
                                        <Button variant="outline" size="sm" onClick={() => handleOpenModal(worker)}>
                                            <Calculator className="mr-2 h-4 w-4" />
                                            حساب وتصفية الرصيد
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                       لا توجد طلبات إجازة معتمدة حاليًا.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>

        {isModalOpen && selectedWorker && (
            <LeaveSettlementModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                workerId={selectedWorker.id}
                workerName={selectedWorker.name}
            />
        )}
        </>
    );
}
