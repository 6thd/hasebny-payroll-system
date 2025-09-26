"use client";

import { useState } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Worker } from '@/types';
import { Pencil, Trash2, Calculator, PlusCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import EndOfServiceModal from './EndOfServiceModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface EmployeeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  onDataUpdate: () => void;
}

const initialFormState: Partial<Worker> = {
  id: '', name: '', department: '', jobTitle: '', shift: 'الوردية النهارية', role: 'employee',
  basicSalary: 0, housing: 0, workNature: 0, transport: 0, phone: 0, food: 0, status: 'Active',
};

export default function EmployeeManagementModal({ isOpen, onClose, workers, onDataUpdate }: EmployeeManagementModalProps) {
  const [formData, setFormData] = useState<Partial<Worker>>(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWorkerForEOS, setSelectedWorkerForEOS] = useState<Worker | null>(null);
  const [isEOSModalOpen, setIsEOSModalOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const isNumberField = type === 'number' || ['basicSalary', 'housing', 'workNature', 'transport', 'phone', 'food'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumberField ? parseFloat(value) || 0 : value }));
  };

  const handleSelectEmployeeForEdit = (worker: Worker) => {
    setFormData(worker);
    setIsEditing(true);
  };
  
  const handleAddNewEmployeeClick = () => {
    setFormData(initialFormState);
    setIsEditing(false);
  };

  const handleOpenEOSModal = (worker: Worker) => {
    setSelectedWorkerForEOS(worker);
    setIsEOSModalOpen(true);
  };

  const handleCloseEOSModal = () => {
    setIsEOSModalOpen(false);
    setSelectedWorkerForEOS(null);
    onDataUpdate(); // Refetch data to show terminated status
  };


  const navigateToSettlements = () => {
    router.push('/settlements');
    onClose();
  }

  const resetFormAndClose = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    onClose();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const workerId = isEditing && formData.id ? formData.id : Date.now().toString();
    
    const dataToSave: Partial<Worker> = { ...formData, id: workerId };
    
    if (isEditing) {
        // If editing an existing employee, check if they are missing an employeeId
        if (!dataToSave.employeeId) {
            dataToSave.employeeId = `EMP${workerId.slice(-4)}`;
        }
    } else {
      // For new employees
      dataToSave.employeeId = `EMP${workerId.slice(-4)}`;
      dataToSave.hireDate = new Date().toISOString().split('T')[0];
      dataToSave.status = 'Active';
      dataToSave.role = 'employee';
    }
    
    // These are UI-calculated or monthly fields, so we remove them before saving to the main document.
    const { days, totalRegular, totalOvertime, absentDays, sickLeaveDays, annualLeaveDays, commission, advances, penalties, ...employeeDataToSave } = dataToSave;
    
    try {
      await setDoc(doc(db, 'employees', workerId), employeeDataToSave, { merge: true });
      toast({ title: isEditing ? 'تم تحديث الموظف' : 'تم إضافة الموظف' });
      onDataUpdate();
      if (!isEditing) {
          setFormData(initialFormState); // Reset form only when adding a new employee
      }
    } catch (error) {
      console.error(error);
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
  ];
  
  const sortedWorkers = [...workers].sort((a, b) => {
      if (a.status === 'Terminated' && b.status !== 'Terminated') return 1;
      if (a.status !== 'Terminated' && b.status === 'Terminated') return -1;
      return a.name.localeCompare(b.name);
  });


  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetFormAndClose() }}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader><DialogTitle>إدارة الموظفين</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow overflow-hidden">
          <div className="md:col-span-1 flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">قائمة الموظفين</h3>
                <Button variant="outline" size="sm" onClick={handleAddNewEmployeeClick}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    إضافة
                </Button>
            </div>
            <ScrollArea className="border rounded-lg p-2 flex-grow">
              {sortedWorkers.map(w => {
                const isTerminated = w.status === 'Terminated';
                return (
                  <div key={w.id} className={cn("flex items-center justify-between p-2 rounded-lg", isTerminated ? "bg-muted/50" : "hover:bg-muted")}>
                    <div>
                      <p className={cn("font-semibold", isTerminated && "text-muted-foreground line-through")}>{w.name}</p>
                      <p className="text-sm text-muted-foreground">{w.jobTitle || 'N/A'}</p>
                       {isTerminated && <Badge variant="destructive" className="mt-1">خدمة منتهية</Badge>}
                    </div>
                    {!isTerminated && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleSelectEmployeeForEdit(w)}><Pencil className="h-4 w-4" /></Button>
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
                    )}
                  </div>
                )
              })}
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
                  <div><Label>تاريخ التعيين</Label><Input type="date" name="hireDate" value={(formData as any).hireDate || ''} onChange={handleInputChange} /></div>
                  <div>
                    <Label>الرقم الوظيفي</Label>
                    <Input name="employeeId" value={(formData as any).employeeId || ''} onChange={handleInputChange} disabled />
                     <p className="text-xs text-muted-foreground mt-1">يتم إنشاء الرقم الوظيفي تلقائياً.</p>
                  </div>
                  <div>
                    <Label>الصلاحية</Label>
                    <Select
                        name="role"
                        value={formData.role || 'employee'}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as 'admin' | 'employee' }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="اختر الصلاحية" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="admin">مدير</SelectItem>
                            <SelectItem value="employee">موظف</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                </div>
                <h4 className="font-semibold pt-4 border-t">البيانات المالية الثابتة</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {financialFields.map(field => (
                    <div key={field.key}><Label>{field.label}</Label><Input type="number" name={field.key} value={formData[field.key] as number || ''} onChange={handleInputChange} /></div>
                  ))}
                </div>
                 <p className="text-sm text-muted-foreground pt-4 border-t">ملاحظة: العمولات والسلف والجزاءات يتم إدخالها من شاشة مسير الرواتب لكل شهر على حدة.</p>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="submit">{isEditing ? 'حفظ التعديلات' : 'إضافة موظف'}</Button>
                </div>
              </form>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    {isEOSModalOpen && selectedWorkerForEOS && (
        <EndOfServiceModal
            isOpen={isEOSModalOpen}
            onClose={handleCloseEOSModal}
            worker={selectedWorkerForEOS}
            onFinalized={handleCloseEOSModal}
        />
    )}
    </>
  );
}
