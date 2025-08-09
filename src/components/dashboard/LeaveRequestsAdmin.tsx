"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, query, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { approveLeaveRequest, rejectLeaveRequest } from '@/app/actions/leave';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '../LoadingSpinner';
import { Badge } from '../ui/badge';
import { Check, X, Calendar as CalendarIcon, Edit, Briefcase, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface LeaveRequest {
    id: string;
    employeeId: string;
    employeeName: string;
    leaveType: string;
    startDate: Timestamp;
    endDate: Timestamp;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Timestamp;
}

const leaveTypeMap: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
    annual: { label: 'سنوية', variant: 'secondary' },
    sick: { label: 'مرضية', variant: 'default' },
    emergency: { label: 'طارئة', variant: 'destructive' },
};


interface LeaveRequestsAdminProps {
    onAction?: () => void;
    itemCount?: number;
}

export default function LeaveRequestsAdmin({ onAction, itemCount = 5 }: LeaveRequestsAdminProps) {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [newStartDate, setNewStartDate] = useState<Date | undefined>();
    const [newEndDate, setNewEndDate] = useState<Date | undefined>();
    const { toast } = useToast();

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'leaveRequests'));
            const querySnapshot = await getDocs(q);

            const allRequests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
            
            const pendingRequests = allRequests
                .filter(req => req.status === 'pending')
                .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
                .slice(0, itemCount);

            setRequests(pendingRequests);
        } catch (error) {
            console.error("Error fetching leave requests:", error);
            toast({ title: "خطأ", description: "لم نتمكن من جلب طلبات الإجازة.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast, itemCount]);

    useEffect(() => {
        const handleDataUpdate = () => fetchRequests();
        fetchRequests();
        window.addEventListener('data-updated', handleDataUpdate);
        return () => window.removeEventListener('data-updated', handleDataUpdate);
    }, [fetchRequests]);

    const handleOpenEditModal = (req: LeaveRequest) => {
        setSelectedRequest(req);
        setNewStartDate(req.startDate.toDate());
        setNewEndDate(req.endDate.toDate());
        setEditModalOpen(true);
    };

    const handleConfirmApproval = async () => {
        if (!selectedRequest) return;
        setActionLoading(selectedRequest.id);
        const result = await approveLeaveRequest(selectedRequest.id, false, newStartDate, newEndDate);
        if (result.success) {
            toast({ title: "تمت الموافقة", description: "تمت الموافقة على طلب الإجازة." });
            fetchRequests();
            onAction?.();
        } else {
            toast({ title: "خطأ", description: result.error, variant: "destructive" });
        }
        setEditModalOpen(false);
        setSelectedRequest(null);
        setActionLoading(null);
    };
    
    const handleApproval = async (id: string, override: boolean) => {
        setActionLoading(id);
        const result = await approveLeaveRequest(id, override);
        if (result.success) {
            toast({ title: "تمت الموافقة", description: "تمت الموافقة على طلب الإجازة." });
            fetchRequests();
            onAction?.();
        } else {
            toast({ title: "خطأ", description: result.error, variant: "destructive" });
        }
        setActionLoading(null);
    }
    
    const handleReject = async (id: string) => {
        setActionLoading(id);
        const result = await rejectLeaveRequest(id);
        if (result.success) {
            toast({ title: "تم الرفض", description: "تم رفض طلب الإجازة." });
            fetchRequests();
            onAction?.();
        } else {
            toast({ title: "خطأ", description: result.error, variant: "destructive" });
        }
        setActionLoading(null);
    };


    return (
        <>
            <Card className="shadow-lg no-print h-full">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-lg"><Briefcase />طلبات الإجازة المعلقة</span>
                        <Badge variant="destructive">{requests.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <LoadingSpinner />
                        </div>
                    ) : requests.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">لا توجد طلبات إجازة معلقة حاليًا.</p>
                    ) : (
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>الموظف</TableHead>
                                    <TableHead>النوع</TableHead>
                                    <TableHead>المدة</TableHead>
                                    <TableHead className="text-center">إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map(req => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium whitespace-nowrap">{req.employeeName}</TableCell>
                                        <TableCell><Badge variant={leaveTypeMap[req.leaveType]?.variant || 'default'}>{leaveTypeMap[req.leaveType]?.label || req.leaveType}</Badge></TableCell>
                                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                            {req.startDate.toDate().toLocaleDateString('ar-EG')} - {req.endDate.toDate().toLocaleDateString('ar-EG')}
                                        </TableCell>
                                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                                            <Button size="icon" variant="ghost" className="text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded-full" onClick={() => handleApproval(req.id, false)} disabled={!!actionLoading}>
                                                {actionLoading === req.id ? <LoadingSpinner /> : <Check className="h-5 w-5" />}
                                            </Button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                     <Button size="icon" variant="ghost" className="text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900 rounded-full" disabled={!!actionLoading}>
                                                        <ShieldAlert className="h-5 w-5" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>تأكيد الموافقة مع التجاوز</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        هل أنت متأكد من رغبتك في الموافقة على هذا الطلب مع تجاوز فحص رصيد الإجازات؟ سيتم تسجيل الإجازة للموظف حتى لو كان رصيده غير كافٍ.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleApproval(req.id, true)} className="bg-yellow-500 hover:bg-yellow-600">
                                                        تأكيد الموافقة
                                                    </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                            
                                            <Button size="icon" variant="ghost" className="text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full" onClick={() => handleOpenEditModal(req)} disabled={!!actionLoading}>
                                                <Edit className="h-5 w-5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-full" onClick={() => handleReject(req.id)} disabled={!!actionLoading}>
                                                {actionLoading === req.id ? <LoadingSpinner /> : <X className="h-5 w-5" />}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>الموافقة على الإجازة مع تعديل</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4 py-4">
                            <p>الموظف: <span className="font-semibold">{selectedRequest.employeeName}</span></p>
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium">تاريخ البدء</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn("w-full justify-start text-left font-normal", !newStartDate && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newStartDate ? format(newStartDate, "PPP", { locale: arSA }) : <span>اختر تاريخًا</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={newStartDate} onSelect={setNewStartDate} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                             <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium">تاريخ الانتهاء</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn("w-full justify-start text-left font-normal", !newEndDate && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newEndDate ? format(newEndDate, "PPP", { locale: arSA }) : <span>اختر تاريخًا</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={newEndDate} onSelect={setNewEndDate} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="ghost" disabled={!!actionLoading}>إلغاء</Button>
                        </DialogClose>
                        <Button onClick={handleConfirmApproval} disabled={!!actionLoading}>
                           {actionLoading ? <LoadingSpinner /> : null}
                           {actionLoading ? 'جارٍ الحفظ...' : 'تأكيد الموافقة'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
