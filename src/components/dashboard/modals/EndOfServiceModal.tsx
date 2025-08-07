"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { calculateEndOfService, EndOfServiceOutput } from '@/app/actions/eos';

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
}

const FormSchema = z.object({
  lastDayOfWork: z.date({
    required_error: "الرجاء تحديد تاريخ آخر يوم عمل.",
  }),
  reasonForTermination: z.enum(['termination', 'resignation'], {
    required_error: "الرجاء تحديد سبب إنهاء الخدمة.",
  }),
});

type FormValues = z.infer<typeof FormSchema>;

const ResultRow = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex justify-between items-center py-2">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
    </div>
);

export default function EndOfServiceModal({ isOpen, onClose, worker }: EndOfServiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EndOfServiceOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setResults(null);
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

  const resetAndClose = () => {
      form.reset();
      setResults(null);
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
                  <FormLabel>سبب إنهاء الخدمة</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر سبب الإنهاء" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="termination">انتهاء العقد / فصل من العمل</SelectItem>
                      <SelectItem value="resignation">استقالة</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "جارٍ الحساب..." : "احسب المستحقات"}
            </Button>
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
