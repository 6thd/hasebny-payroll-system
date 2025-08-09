"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { submitLeaveRequest } from "@/app/actions/leave";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import LoadingSpinner from "../LoadingSpinner";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

const leaveRequestSchema = z.object({
  leaveType: z.string({
    required_error: "الرجاء اختيار نوع الإجازة.",
  }),
  startDate: z.date({
    required_error: "الرجاء اختيار تاريخ البدء.",
  }),
  endDate: z.date({
    required_error: "الرجاء اختيار تاريخ الانتهاء.",
  }),
  notes: z.string().max(250, "الملاحظات يجب ألا تتجاوز 250 حرفًا.").optional(),
}).refine(data => data.endDate >= data.startDate, {
  message: "تاريخ الانتهاء يجب أن يكون بعد أو بنفس تاريخ البدء.",
  path: ["endDate"],
});

type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;

interface LeaveRequestFormProps {
  onSubmitted?: () => void;
  currentBalance: number | null;
}

export default function LeaveRequestForm({ onSubmitted, currentBalance }: LeaveRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth(); // Get current user
  
  const form = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      notes: "",
    }
  });

  const onSubmit = async (data: LeaveRequestFormValues) => {
    if (!user) {
      toast({ title: "خطأ", description: "يجب أن تكون مسجلاً لتقديم طلب.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const result = await submitLeaveRequest({
      ...data,
      employeeId: user.id,
      employeeName: user.name || user.email || 'غير معروف',
    });
    setLoading(false);

    if (result.success) {
      toast({
        title: "تم إرسال الطلب",
        description: "تم إرسال طلب الإجازة بنجاح للمراجعة.",
      });
      form.reset();
      onSubmitted?.();
    } else {
      console.error("Error submitting leave request: ", result.error);
      const errorMessage = typeof result.error === 'string' 
        ? result.error
        : "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.";
      
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {currentBalance !== null && (
          <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>رصيد الإجازات</AlertTitle>
              <AlertDescription>
                  رصيدك المتاح حاليًا هو: <span className="font-bold">{currentBalance.toFixed(2)} يوم</span>.
              </AlertDescription>
          </Alert>
      )}

      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <FormField
              control={form.control}
              name="leaveType"
              render={({ field }) => (
              <FormItem>
                  <FormLabel>نوع الإجازة</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                      <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الإجازة" />
                      </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                      <SelectItem value="annual">سنوية</SelectItem>
                      <SelectItem value="sick">مرضية</SelectItem>
                      <SelectItem value="emergency">طارئة</SelectItem>
                  </SelectContent>
                  </Select>
                  <FormMessage />
              </FormItem>
              )}
          />
          
          <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
              <FormItem className="flex flex-col">
                  <FormLabel>تاريخ البدء</FormLabel>
                  <Popover>
                  <PopoverTrigger asChild>
                      <FormControl>
                      <Button
                          variant={"outline"}
                          className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                          )}
                      >
                          <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                          {field.value ? (
                          format(field.value, "PPP")
                          ) : (
                          <span>اختر تاريخًا</span>
                          )}
                      </Button>
                      </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      />
                  </PopoverContent>
                  </Popover>
                  <FormMessage />
              </FormItem>
              )}
          />

          <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
              <FormItem className="flex flex-col">
                  <FormLabel>تاريخ الانتهاء</FormLabel>
                  <Popover>
                  <PopoverTrigger asChild>
                      <FormControl>
                      <Button
                          variant={"outline"}
                          className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                          )}
                      >
                          <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                          {field.value ? (
                          format(field.value, "PPP")
                          ) : (
                          <span>اختر تاريخًا</span>
                          )}
                      </Button>
                      </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      />
                  </PopoverContent>
                  </Popover>
                  <FormMessage />
              </FormItem>
              )}
          />

          <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
              <FormItem>
                  <FormLabel>ملاحظات إضافية (اختياري)</FormLabel>
                  <FormControl>
                  <Textarea
                      placeholder="أدخل ملاحظاتك هنا..."
                      className="resize-none"
                      {...field}
                  />
                  </FormControl>
                  <FormMessage />
              </FormItem>
              )}
          />

          <Button type="submit" className="w-full" disabled={loading}>
              {loading && <LoadingSpinner />}
              {loading ? "جارٍ الإرسال..." : "إرسال الطلب"}
          </Button>
          </form>
      </Form>
    </div>
  );
}
