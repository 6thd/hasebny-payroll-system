
"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { calculateEndOfService, finalizeTermination, EndOfServiceOutput } from '@/app/actions/eos';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from '@/components/ui/separator';
import { Worker } from '@/types';

interface EndOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
  onFinalized?: () => void;
}

const FormSchema = z.object({
  lastDayOfWork: z.date({
    required_error: "الرجاء تحديد تاريخ آخر يوم عمل.",
  }),
  reasonForTermination: z.enum(
      ['resignation', 'contract_termination_by_employer_article_77', 'contract_termination_by_employee_article_81', 'force_majeure', 'termination_article_80'],
      { required_error: "الرجاء تحديد سبب إنهاء الخدمة." }
  ),
});

type FormValues = z.infer<typeof FormSchema>;

const ResultRow = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex justify-between items-center py-2">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
    </div>
);

export default function EndOfServiceModal({ isOpen, onClose, worker, onFinalized }: EndOfServiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [results, setResults] = useState<EndOfServiceOutput | null>(null);
  const [formData, setFormData] = useState<FormValues | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setResults(null);
    setFormData(data); // Save form data to use it for finalization
    const result = await calculateEndOfService({
      worker,
      ...data,
    });
    setLoading(false);

    if (result.success) {
      setResults(result.data);
      toast({
        title: "تم الحساب بنجاح",
        description: `تم حساب مستحقات نهاية الخدمة لـ ${worker.name}.`,
      });
    } else {
      toast({
        title: "خطأ في الحساب",
        description: result.error,
        variant: "destructive",
      });
    }
  };
  
  const handleFinalize = async () => {
    if (!results || !formData) return;
    
    setFinalizing(true);
    const result = await finalizeTermination({
        employeeId: worker.id,
        terminationDate: formData.lastDayOfWork,
        reasonForTermination: formData.reasonForTermination,
        results: results,
    });
    setFinalizing(false);
    
    if (result.success) {
        toast({
            title: "تم إنهاء الخدمة بنجاح",
            description: `تم تحديث حالة الموظف ${worker.name} وأرشفة سجل الخدمة.`,
        });
        onFinalized?.();
        resetAndClose();
    } else {
        toast({
            title: "خطأ في إنهاء الخدمة",
            description: result.error,
            variant: "destructive",
        });
    }
  };

  const resetAndClose = () => {
      form.reset();
      setResults(null);
      setFormData(null);
      onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>حساب مستحقات نهاية الخدمة لـِ {worker.name}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="lastDayOfWork"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>تاريخ آخر يوم عمل</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                          disabled={!!results}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                          {field.value ? format(field.value, "PPP") : <span>اختر تاريخًا</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reasonForTermination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>سبب إنهاء العلاقة العمالية</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!results}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر سبب الإنهاء" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="resignation">استقالة</SelectItem>
                      <SelectItem value="contract_termination_by_employer_article_77">فسخ العقد من قبل صاحب العمل (حسب المادة 77)</SelectItem>
                       <SelectItem value="contract_termination_by_employee_article_81">فسخ العقد من قبل العامل (حسب المادة 81)</SelectItem>
                      <SelectItem value="termination_article_80">فصل العامل (حسب المادة 80)</SelectItem>
                      <SelectItem value="force_majeure">قوة قاهرة</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!results && (
                <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "جارٍ الحساب..." : "احسب المستحقات"}
                </Button>
            )}
          </form>
        </Form>
        
        {results && (
            <div className="mt-6 space-y-2">
                <h3 className="font-bold text-lg">نتائج الحساب:</h3>
                <ResultRow label="مدة الخدمة (سنوات)" value={results.serviceDurationYears} />
                <ResultRow label="مكافأة نهاية الخدمة (قبل التعديل)" value={`${results.baseGratuity.toLocaleString()} ريال`} />
                <ResultRow label="مكافأة نهاية الخدمة (المستحقة)" value={`${results.finalGratuity.toLocaleString()} ريال`} />
                <ResultRow label="قيمة رصيد الإجازات" value={`${results.leaveBalanceValue.toLocaleString()} ريال`} />
                <Separator className="my-2" />
                <div className="flex justify-between items-center py-2 bg-primary/10 px-3 rounded-lg">
                    <p className="font-bold text-lg text-primary">إجمالي المبلغ المستحق</p>
                    <p className="font-bold text-xl text-primary">{`${results.totalAmount.toLocaleString()} ريال`}</p>
                </div>
                <div className="pt-4 flex justify-end gap-2">
                    <Button variant="destructive" onClick={handleFinalize} disabled={finalizing}>
                        {finalizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                        {finalizing ? "جارٍ التأكيد..." : "تأكيد وإنهاء الخدمة"}
                    </Button>
                </div>
            </div>
        )}

        <DialogFooter className="mt-4">
            <DialogClose asChild>
                <Button type="button" variant="secondary" onClick={resetAndClose}>إغلاق</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
