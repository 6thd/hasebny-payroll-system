"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Worker } from "@/types";
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut } from 'lucide-react';
import EndOfServiceModal from '../dashboard/modals/EndOfServiceModal';


interface EosSettlementTabProps {
    workers: Worker[];
    onAction: () => void;
}

export default function EosSettlementTab({ workers, onAction }: EosSettlementTabProps) {
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = (worker: Worker) => {
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
                <CardTitle>تصفية مستحقات نهاية الخدمة</CardTitle>
                <CardDescription>
                    اختر موظفًا لبدء إجراءات إنهاء الخدمة وحساب مستحقاته النهائية شاملة رصيد الإجازات.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <ScrollArea className="h-[50vh] border rounded-md">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                                <TableHead>اسم الموظف</TableHead>
                                <TableHead>الرقم الوظيفي</TableHead>
                                <TableHead>تاريخ التعيين</TableHead>
                                <TableHead className="text-left">إجراء</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workers.length > 0 ? workers.map((worker) => (
                                <TableRow key={worker.id}>
                                    <TableCell className="font-medium">{worker.name}</TableCell>
                                    <TableCell>{worker.employeeId || 'N/A'}</TableCell>
                                    <TableCell>{worker.hireDate}</TableCell>
                                    <TableCell className="text-left">
                                        <Button variant="destructive" size="sm" onClick={() => handleOpenModal(worker)}>
                                            <LogOut className="mr-2 h-4 w-4" />
                                            بدء إجراءات الإنهاء
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        لا يوجد موظفون نشطون لعرضهم.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>

        {isModalOpen && selectedWorker && (
            <EndOfServiceModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                worker={selectedWorker}
                onFinalized={handleCloseModal}
            />
        )}
        </>
    );
}
