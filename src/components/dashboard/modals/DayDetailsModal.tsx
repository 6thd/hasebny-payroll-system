'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { DayData, Worker } from "@/types";
import { Input } from '@/components/ui/input';

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
  day: number;
  year: number;
  month: number; // 0-indexed
  onDataUpdate: () => void;
}

export default function DayDetailsModal({ isOpen, onClose, worker, day, year, month, onDataUpdate }: DayDetailsModalProps) {
  
  const date = new Date(year, month, day);
  
  const [inTime, setInTime] = useState('');
  const [outTime, setOutTime] = useState('');
  const [notes, setNotes] = useState('');

  // Effect to reset the state whenever the modal is opened or the context changes.
  useEffect(() => {
    if (isOpen) {
      const dayData = worker.days?.[day];
      setInTime(dayData?.in || '');
      setOutTime(dayData?.out || '');
      setNotes(dayData?.notes || '');
    }
  }, [isOpen, worker, day, worker.days]);

  const handleStatusChange = async (status: 'present' | 'absent' | 'sick_leave') => {
    const attendanceDocId = `attendance_${year}_${month + 1}`;
    const workerAttendanceRef = doc(db, attendanceDocId, worker.id);

    try {
      const docSnap = await getDoc(workerAttendanceRef);
      const dayField = `days.${day}`;

      const newDayData = { status, in: inTime, out: outTime, notes };

      if (docSnap.exists()) {
        await updateDoc(workerAttendanceRef, { [dayField]: newDayData });
      } else {
        await setDoc(workerAttendanceRef, { days: { [day]: newDayData } });
      }
      onDataUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating attendance:", error);
    }
  };

  const currentDayData = worker.days?.[day];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>تعديل حالة اليوم: {worker.name}</DialogTitle>
          <p className="pt-2 text-sm text-muted-foreground">
            {date.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <p className="font-medium">الحالة الحالية:</p>
            {currentDayData?.status ? (
              <p className="font-bold">{currentDayData.status}</p>
            ) : (
              <p className="font-bold text-red-500">لم تسجل</p>
            )}
          </div>
          
          <p className="text-sm font-medium text-muted-foreground pt-2">تسجيل أو تعديل معلومات اليوم:</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="inTime" className="text-sm font-medium">وقت الحضور</label>
              <Input id="inTime" type="time" value={inTime} onChange={(e) => setInTime(e.target.value)} />
            </div>
            <div>
              <label htmlFor="outTime" className="text-sm font-medium">وقت الانصراف</label>
              <Input id="outTime" type="time" value={outTime} onChange={(e) => setOutTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="text-sm font-medium">ملاحظات</label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="إضافة ملاحظات..." />
          </div>
        </div>

        <DialogFooter className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4">
          <Button variant="default" onClick={() => handleStatusChange('present')}>حاضر</Button>
          <Button variant="destructive" onClick={() => handleStatusChange('absent')}>غائب</Button>
          <Button variant="outline" className="border-yellow-500 text-yellow-500" onClick={() => handleStatusChange('sick_leave')}>مرضية</Button>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
