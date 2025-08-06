"use client";

import { useState, useEffect } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Worker } from '@/types';
import { Pencil, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface EmployeeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  onDataUpdate: () => void;
}

const initialFormState: Partial<Worker> = {
  id: '', name: '', department: '', jobTitle: '', shift: 'الوردية النهارية', role: 'employee',
  basicSalary: 0, housing: 0, workNature: 0, transport: 0, phone: 0, food: 0,
  commission: 0, advances: 0, penalties: 0,
};

export default function EmployeeManagementModal({ isOpen, onClose, workers, onDataUpdate }: EmployeeManagementModalProps) {
  const [formData, setFormData] = useState<Partial<Worker>>(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name.includes('Salary') || name.includes('housing') ? parseFloat(value) || 0 : value }));
  };

  const selectEmployeeForEdit = (worker: Worker) => {
    setFormData(worker);
    setIsEditing(true);
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setIsEditing(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const workerId = isEditing ? formData.id : Date.now().toString();
    if(!workerId) return;

    const { id, days, ...workerDataToSave } = formData;
    
    try {
      await setDoc(doc(db, 'employees', workerId), workerDataToSave, { merge: isEditing });
      toast({ title: isEditing ? 'تم تحديث الموظف' : 'تم إضافة الموظف' });
      onDataUpdate();
      resetForm();
    } catch (error) {
      toast({ title: 'خطأ', description: 'لم يتم حفظ البيانات', variant: 'destructive' });
    }
  };

  const handleDelete = async (workerId: string) => {
    try {
      await deleteDoc(doc(db, 'employees', workerId));
      toast({ title: 'تم حذف الموظف' });
      onDataUpdate();
    } catch (error) {
      toast({ title: 'خطأ', description: 'لم يتم حذف الموظف', variant: 'destructive' });
    }
  };

  const financialFields: { key: keyof Worker, label: string }[] = [
    { key: 'basicSalary', label: 'الراتب الأساسي' }, { key: 'housing', label: 'بدل سكن' },
    { key: 'workNature', label: 'طبيعة عمل' }, { key: 'transport', label: 'مواصلات' },
    { key: 'phone', label: 'هاتف' }, { key: 'food', label: 'طعام' },
    { key: 'commission', label: 'عمولة' }, { key: 'advances', label: 'سلف' },
    { key: 'penalties', label: 'جزاءات' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); onClose(); }}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader><DialogTitle>إدارة الموظفين</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow overflow-hidden">
          <div className="md:col-span-1 flex flex-col">
            <h3 className="font-semibold mb-2">قائمة الموظفين</h3>
            <ScrollArea className="border rounded-lg p-2 flex-grow">
              {workers.map(w => (
                <div key={w.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                  <div>
                    <p className="font-semibold">{w.name}</p>
                    <p className="text-sm text-muted-foreground">{w.department || 'N/A'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => selectEmployeeForEdit(w)}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                          <AlertDialogDescription>سيتم حذف الموظف {w.name} بشكل نهائي.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(w.id)} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
          <div className="md:col-span-2 flex flex-col">
            <h3 className="font-semibold mb-2">{isEditing ? `تعديل ${formData.name}` : 'إضافة موظف جديد'}</h3>
            <ScrollArea className="border rounded-lg p-4 flex-grow">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>الاسم</Label><Input name="name" value={formData.name || ''} onChange={handleInputChange} required /></div>
                  <div><Label>القسم</Label><Input name="department" value={formData.department || ''} onChange={handleInputChange} /></div>
                  <div><Label>الوظيفة</Label><Input name="jobTitle" value={formData.jobTitle || ''} onChange={handleInputChange} /></div>
                  <div><Label>الوردية</Label><Input name="shift" value={formData.shift || ''} onChange={handleInputChange} /></div>
                </div>
                <h4 className="font-semibold pt-4 border-t">البيانات المالية</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {financialFields.map(field => (
                    <div key={field.key}><Label>{field.label}</Label><Input type="number" name={field.key} value={formData[field.key] as number || ''} onChange={handleInputChange} /></div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-4">
                   <Button type="button" variant="outline" onClick={resetForm}>
                    {isEditing ? 'إلغاء التعديل' : 'مسح النموذج'}
                  </Button>
                  <Button type="submit">{isEditing ? 'حفظ التعديلات' : 'إضافة موظف'}</Button>
                </div>
              </form>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
