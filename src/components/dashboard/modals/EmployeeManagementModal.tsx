'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { getEmployee, updateEmployee } from '@/app/actions/employee-actions';
import { type Worker } from '@/types';

interface EmployeeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWorkers: Worker[];
  onDataUpdate: () => void;
}

export default function EmployeeManagementModal({ isOpen, onClose, initialWorkers, onDataUpdate }: EmployeeManagementModalProps) {
  const queryClient = useQueryClient();
  const [worker, setWorker] = useState<Partial<Worker>>({});
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['employeeDetails', selectedEmployeeId],
    queryFn: () => getEmployee({ employeeId: selectedEmployeeId! }),
    enabled: !!selectedEmployeeId,
  });

  useEffect(() => {
    if (data?.worker) {
      setWorker(data.worker);
    } else {
        setWorker({});
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (updatedWorker: Partial<Worker>) => updateEmployee({ employeeId: selectedEmployeeId!, workerData: updatedWorker }),
    onSuccess: () => {
      toast.success('تم تحديث بيانات الموظف بنجاح.');
      queryClient.invalidateQueries({ queryKey: ['allEmployees'] });
      onDataUpdate();
    },
    onError: (error: Error) => {
      toast.error(`فشل التحديث: ${error.message}`);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setWorker((prev: Partial<Worker>) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setWorker((prev: Partial<Worker>) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!selectedEmployeeId) return;
    mutation.mutate(worker);
  };
  
  const handleEmployeeSelection = (employeeId: string) => {
      setSelectedEmployeeId(employeeId);
      if (employeeId) {
          refetch();
      } else {
          setWorker({});
      }
  }

  const renderSkeleton = () => (
    <div className="space-y-4">
      <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
      <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
      <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
      <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>إدارة بيانات الموظف</DialogTitle>
           <DialogDescription>
            اختر موظفًا من القائمة لعرض وتعديل بياناته.
          </DialogDescription>
        </DialogHeader>
        
         <div className="mb-4">
            <Select onValueChange={handleEmployeeSelection} value={selectedEmployeeId || ''}>
                <SelectTrigger>
                    <SelectValue placeholder="اختر موظفًا..." />
                </SelectTrigger>
                <SelectContent>
                    {initialWorkers.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        {isLoading || isError ? renderSkeleton() : selectedEmployeeId && (
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Personal Information */}
            <Input name="name" value={worker.name || ''} onChange={handleInputChange} placeholder="الاسم الكامل" />
            <Input name="jobTitle" value={worker.jobTitle || ''} onChange={handleInputChange} placeholder="المسمى الوظيفي" />
            <Input name="idNumber" value={worker.idNumber || ''} onChange={handleInputChange} placeholder="رقم الهوية/الإقامة" />
            <Input name="phone" value={worker.phone || ''} onChange={handleInputChange} placeholder="رقم الجوال" />
            
            {/* Financial Information */}
            <Input name="basicSalary" type="number" value={worker.basicSalary || ''} onChange={handleInputChange} placeholder="الراتب الأساسي" />
            <Input name="housing" type="number" value={worker.housing || ''} onChange={handleInputChange} placeholder="بدل سكن" />
            <Input name="transport" type="number" value={worker.transport || ''} onChange={handleInputChange} placeholder="بدل مواصلات" />
            <Input name="food" type="number" value={worker.food || ''} onChange={handleInputChange} placeholder="بدل طعام" />

            {/* Contract Information */}
            <Select name="contractType" onValueChange={(value: string) => handleSelectChange('contractType', value)} value={worker.contractType}>
                <SelectTrigger>
                    <SelectValue placeholder="نوع العقد" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="fixed">عقد محدد المدة</SelectItem>
                    <SelectItem value="unlimited">عقد غير محدد المدة</SelectItem>
                </SelectContent>
            </Select>

            <Input 
              name="joiningDate" 
              type="date" 
              value={worker.joiningDate ? (worker.joiningDate instanceof Date ? worker.joiningDate.toISOString().split('T')[0] : String(worker.joiningDate).split('T')[0]) : ''} 
              onChange={handleInputChange} 
              placeholder="تاريخ الالتحاق" 
            />

             {/* Bank Information */}
            <Input name="bankName" value={worker.bankName || ''} onChange={handleInputChange} placeholder="اسم البنك" />
            <Input name="iban" value={worker.iban || ''} onChange={handleInputChange} placeholder="رقم الآيبان" />


            {/* Custom Fields Expansion */}
            <div className="col-span-2 mt-4">
                <h4 className="font-semibold mb-2">حقول إضافية</h4>
                {Object.keys(worker).filter(key => ![ 'id', 'name', 'jobTitle', 'joiningDate', 'salary', 'contractType', 'idNumber', 'phone', 'basicSalary', 'housing', 'transport', 'food', 'bankName', 'iban', 'serviceHistory', 'days', 'totalRegular', 'totalOvertime', 'absentDays', 'annualLeaveDays', 'sickLeaveDays'].includes(key)).map(key => (
                    <div key={key} className="flex items-center gap-2 mb-2">
                        <Input 
                            value={key}
                            disabled
                            className="w-1/3"
                        />
                        <Input 
                            name={key} 
                            value={String((worker as any)[key])} 
                            onChange={handleInputChange} 
                            placeholder="القيمة"
                            className="w-2/3"
                        />
                    </div>
                ))}
            </div>

          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          {selectedEmployeeId && <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
          </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
