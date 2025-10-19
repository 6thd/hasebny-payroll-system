"use client";

import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Worker, DayData } from '@/types';

const REGULAR_HOURS_PER_DAY = 8;

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
  day: number;
  year: number;
  month: number;
  onDataUpdate: () => void;
}

export default function DayDetailsModal({ isOpen, onClose, worker, day, year, month, onDataUpdate }: DayDetailsModalProps) {
  const [dayData, setDayData] = useState<DayData>({ status: 'present', in: '', out: '' });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (worker && day) {
      setDayData(worker.days?.[day] || { status: 'present', in: '', out: '' });
    }
  }, [worker, day]);
  
  const handleStatusChange = (status: 'present' | 'sick_leave' | 'annual_leave' | 'absent') => {
    setDayData(prev => ({ ...prev, status }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDayData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const updatedDayData = { ...dayData };
    if (dayData.status === 'present' && dayData.in && dayData.out) {
      const inDate = new Date(`1970-01-01T${dayData.in}`);
      const outDate = new Date(`1970-01-01T${dayData.out}`);
      let hours = (outDate.getTime() - inDate.getTime()) / 3600000;
      if (hours < 0) hours += 24;
      const workedHours = Math.max(0, hours > 1 ? hours - 1 : hours); // 1 hour break
      updatedDayData.regularHours = Math.min(workedHours, REGULAR_HOURS_PER_DAY);
      updatedDayData.overtimeHours = Math.max(0, workedHours - REGULAR_HOURS_PER_DAY);
    } else {
      updatedDayData.regularHours = 0;
      updatedDayData.overtimeHours = 0;
    }

    try {
      const updatedDays = { ...worker.days, [day]: updatedDayData };
      await setDoc(doc(db, `attendance_${year}_${month + 1}`, worker.id.toString()), { days: updatedDays });
      toast({ title: "تم الحفظ بنجاح", description: "تم تحديث حالة اليوم للموظف." });
      onDataUpdate();
      onClose();
    } catch (error) {
      console.error("Error saving day details: ", error);
      toast({ title: "خطأ", description: "لم يتم حفظ التغييرات.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تفاصيل اليوم {day} - {worker.name}</DialogTitle>
          <DialogDescription>
            تعديل حالة الحضور ووقت الدخول والخروج للموظف في هذا اليوم.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="day-status">حالة اليوم:</Label>
            <Select onValueChange={handleStatusChange} value={dayData.status}>
              <SelectTrigger id="day-status">
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">حضور</SelectItem>
                <SelectItem value="sick_leave">إجازة مرضية</SelectItem>
                <SelectItem value="annual_leave">إجازة سنوية</SelectItem>
                <SelectItem value="absent">غياب</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dayData.status === 'present' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time-in">وقت الدخول:</Label>
                <Input id="time-in" name="in" type="time" value={dayData.in || ''} onChange={handleTimeChange} />
              </div>
              <div>
                <Label htmlFor="time-out">وقت الخروج:</Label>
                <Input id="time-out" name="out" type="time" value={dayData.out || ''} onChange={handleTimeChange} />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">إغلاق</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? 'جارٍ الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
