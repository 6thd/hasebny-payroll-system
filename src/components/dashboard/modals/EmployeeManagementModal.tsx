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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

  const mainFormFields = [
    'id', 'name', 'jobTitle', 'hiringDate', 'salary', 'contractType', 'idNumber', 
    'phone', 'basicSalary', 'housing', 'transport', 'food', 'bankName', 'iban',
    'serviceHistory', 'days', 'totalRegular', 'totalOvertime', 'absentDays', 
    'annualLeaveDays', 'sickLeaveDays', 'leaveBalance'
  ];

  const extraFields = Object.entries(worker).filter(([key]) => !mainFormFields.includes(key));


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>إدارة بيانات الموظف</DialogTitle>
           <DialogDescription>
            اختر موظفًا من القائمة لعرض وتعديل بياناته الأساسية.
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

        {isLoading ? renderSkeleton() : isError ? <p>Error loading data</p> : selectedEmployeeId && (
          <ScrollArea className="h-[60vh] rounded-md border p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column 1: Main Details */}
              <div className="space-y-4">
                <Input name="name" value={worker.name || ''} onChange={handleInputChange} placeholder="الاسم الكامل" aria-label="الاسم الكامل" />
                <Input name="jobTitle" value={worker.jobTitle || ''} onChange={handleInputChange} placeholder="المسمى الوظيفي" aria-label="المسمى الوظيفي" />
                <Input name="idNumber" value={worker.idNumber || ''} onChange={handleInputChange} placeholder="رقم الهوية/الإقامة" aria-label="رقم الهوية/الإقامة" />
                <Input name="phone" value={worker.phone || ''} onChange={handleInputChange} placeholder="رقم الجوال" aria-label="رقم الجوال" />
                 <Select name="contractType" onValueChange={(value: string) => handleSelectChange('contractType', value)} value={worker.contractType}>
                    <SelectTrigger aria-label="نوع العقد">
                        <SelectValue placeholder="نوع العقد" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="fixed">عقد محدد المدة</SelectItem>
                        <SelectItem value="unlimited">عقد غير محدد المدة</SelectItem>
                    </SelectContent>
                </Select>
                <Input 
                  name="hiringDate" 
                  type="date" 
                  value={worker.hiringDate ? (worker.hiringDate instanceof Date ? worker.hiringDate.toISOString().split('T')[0] : String(worker.hiringDate).split('T')[0]) : ''} 
                  onChange={handleInputChange} 
                  placeholder="تاريخ التعيين" 
                  aria-label="تاريخ التعيين"
                />
              </div>

              {/* Column 2: Financial & Bank Details */}
              <div className="space-y-4">
                <Input name="basicSalary" type="number" value={worker.basicSalary || ''} onChange={handleInputChange} placeholder="الراتب الأساسي" aria-label="الراتب الأساسي" />
                <Input name="housing" type="number" value={worker.housing || ''} onChange={handleInputChange} placeholder="بدل سكن" aria-label="بدل سكن" />
                <Input name="transport" type="number" value={worker.transport || ''} onChange={handleInputChange} placeholder="بدل مواصلات" aria-label="بدل مواصلات" />
                <Input name="food" type="number" value={worker.food || ''} onChange={handleInputChange} placeholder="بدل طعام" aria-label="بدل طعام" />
                <Input name="bankName" value={worker.bankName || ''} onChange={handleInputChange} placeholder="اسم البنك" aria-label="اسم البنك" />
                <Input name="iban" value={worker.iban || ''} onChange={handleInputChange} placeholder="رقم الآيبان" aria-label="رقم الآيبان" />
              </div>
            </div>

            {/* Section for Extra Fields, only if they exist */}
            {extraFields.length > 0 && (
                <div className="col-span-1 md:col-span-2 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>بيانات إضافية</CardTitle>
                            <CardDescription>
                                حقول إضافية موجودة في سجل الموظف. هذه الحقول للقراءة فقط.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-48 w-full">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[200px]">الحقل</TableHead>
                                            <TableHead>القيمة</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {extraFields.map(([key, value]) => (
                                            <TableRow key={key}>
                                                <TableCell className="font-mono text-sm">{key}</TableCell>
                                                <TableCell className="font-mono text-sm">{String(value)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            )}
          </ScrollArea>
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
