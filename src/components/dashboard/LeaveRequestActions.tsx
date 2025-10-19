
"use client";

import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '../LoadingSpinner';
import { Check, X, Edit, ShieldAlert, Calendar as CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
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
    employeeName: string;
    startDate: Timestamp;
    endDate: Timestamp;
}

interface LeaveRequestActionsProps {
    request: LeaveRequest;
    isLoading: boolean;
    actionLoadingId: string | null;
    onApprove: (id: string, override: boolean, newStartDate?: Date, newEndDate?: Date) => void;
    onReject: (id: string) => void;
}

export default function LeaveRequestActions({
    request,
    isLoading,
    actionLoadingId,
    onApprove,
    onReject,
}: LeaveRequestActionsProps) {

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [newStartDate, setNewStartDate] = useState<Date | undefined>();
    const [newEndDate, setNewEndDate] = useState<Date | undefined>();

    const handleOpenEditModal = () => {
        setNewStartDate(request.startDate.toDate());
        setNewEndDate(request.endDate.toDate());
        setEditModalOpen(true);
    };

    const handleConfirmApproval = () => {
        onApprove(request.id, false, newStartDate, newEndDate);
        setEditModalOpen(false);
    };
    
    return (
        <>
            <Button size="icon" variant="ghost" className="text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded-full" onClick={() => onApprove(request.id, false)} disabled={isLoading}>
                {actionLoadingId === request.id ? <LoadingSpinner /> : <Check className="h-5 w-5" />}
            </Button>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                     <Button size="icon" variant="ghost" className="text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900 rounded-full" disabled={isLoading}>
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
                    <AlertDialogAction onClick={() => onApprove(request.id, true)} className="bg-yellow-500 hover:bg-yellow-600">
                        تأكيد الموافقة
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <Button size="icon" variant="ghost" className="text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full" onClick={handleOpenEditModal} disabled={isLoading}>
                <Edit className="h-5 w-5" />
            </Button>

            <Button size="icon" variant="ghost" className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-full" onClick={() => onReject(request.id)} disabled={isLoading}>
                {actionLoadingId === request.id ? <LoadingSpinner /> : <X className="h-5 w-5" />}
            </Button>

            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>الموافقة على الإجازة مع تعديل</DialogTitle>
                        <DialogDescription>
                            يمكنك تعديل تواريخ البدء والانتهاء قبل الموافقة النهائية.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p>الموظف: <span className="font-semibold">{request.employeeName}</span></p>
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
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="ghost" disabled={isLoading}>إلغاء</Button>
                        </DialogClose>
                        <Button onClick={handleConfirmApproval} disabled={isLoading}>
                           {isLoading ? <LoadingSpinner /> : null}
                           {isLoading ? 'جارٍ الحفظ...' : 'تأكيد الموافقة'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
