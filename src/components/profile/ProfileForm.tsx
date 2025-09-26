"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { AppUser } from "@/types";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { updateUserProfile } from "@/app/actions/profile";

const profileFormSchema = z.object({
  name: z.string().min(3, { message: "الاسم يجب أن يحتوي على 3 أحرف على الأقل." }),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email({ message: "البريد الإلكتروني غير صالح." }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  user: AppUser;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const { toast } = useToast();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name || "",
      jobTitle: user.jobTitle || "",
      department: user.department || "",
      email: user.email || "",
    },
    mode: "onChange",
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: ProfileFormValues) {
    const result = await updateUserProfile({
        employeeId: user.id,
        ...data
    });

    if (result.success) {
        toast({
            title: "تم بنجاح",
            description: "تم تحديث بيانات ملفك الشخصي بنجاح.",
        });
    } else {
        const errorMessage = typeof result.error === 'string' 
            ? result.error
            : "حدث خطأ غير متوقع.";
        toast({
            title: "خطأ في التحديث",
            description: errorMessage,
            variant: "destructive",
        });
    }
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>ملفي الشخصي</CardTitle>
            <CardDescription>
                يمكنك تحديث بياناتك الشخصية من هنا.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>الاسم الكامل</FormLabel>
                        <FormControl>
                        <Input placeholder="اسمك الكامل" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>البريد الإلكتروني</FormLabel>
                        <FormControl>
                        <Input placeholder="email@example.com" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>المسمى الوظيفي</FormLabel>
                        <FormControl>
                        <Input placeholder="مثال: محاسب" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>القسم</FormLabel>
                        <FormControl>
                        <Input placeholder="مثال: المالية" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    حفظ التغييرات
                </Button>
                </form>
            </Form>
        </CardContent>
    </Card>
  );
}
