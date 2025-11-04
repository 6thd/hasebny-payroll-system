'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type DayData, type Worker } from "@/types";

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
  day: number;
  year: number;
  month: number; // 0-indexed
  onDataUpdate: () => void; // Kept for future use, e.g., editing
}

export default function DayDetailsModal({ isOpen, onClose, worker, day, year, month }: DayDetailsModalProps) {
  
  const dayData = worker.days?.[day];
  const date = new Date(year, month, day);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تفاصيل اليوم - {worker.name}</DialogTitle>
          <p className="pt-2 text-sm text-muted-foreground">
            {date.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </DialogHeader>
        {dayData ? (
            <div className="space-y-4 py-4">
                <p><strong>الحالة:</strong> {dayData.status}</p>
                <p><strong>وقت الحضور:</strong> {dayData.in || "غير مسجل"}</p>
                <p><strong>وقت الانصراف:</strong> {dayData.out || "غير مسجل"}</p>
                <p><strong>ملاحظات:</strong> {dayData.notes || "لا يوجد"}</p>
            </div>
        ) : (
            <div className="py-4">
                <p>لا توجد بيانات حضور مسجلة لهذا اليوم.</p>
            </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
