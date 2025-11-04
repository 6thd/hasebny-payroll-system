
"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppUser } from "@/types";
import { useTransition } from "react";
import { toast } from "sonner";
import { updateUserProfile } from "@/app/actions/user-actions";

const profileSchema = z.object({
  name: z.string().min(3, "يجب أن يكون الاسم 3 أحرف على الأقل"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: AppUser | null;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      jobTitle: user?.jobTitle || "",
      department: user?.department || "",
    },
  });

  const onSubmit: SubmitHandler<ProfileFormValues> = (data) => {
    if (!user?.id) {
        toast.error("معرف المستخدم غير موجود.");
        return;
    }
    
    // By this point, user.id is guaranteed to be a string.
    // We assign it to a const to help TypeScript's control flow analysis within the closure.
    const userId = user.id;

    startTransition(async () => {
      try {
        const result = await updateUserProfile(userId, data);
        if (result.success) {
          toast.success("تم تحديث الملف الشخصي بنجاح!");
        } else {
          toast.error(result.error || "حدث خطأ غير معروف.");
        }
      } catch (error) {
        toast.error("فشل في تحديث الملف الشخصي.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">الاسم</Label>
        <Input id="name" {...register("name")} defaultValue={user?.name || ''} />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" type="email" {...register("email")} defaultValue={user?.email || ''} readOnly disabled />
        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobTitle">المسمى الوظيفي</Label>
        <Input id="jobTitle" {...register("jobTitle")} defaultValue={user?.jobTitle || ''} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">القسم</Label>
        <Input id="department" {...register("department")} defaultValue={user?.department || ''} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
      </Button>
    </form>
  );
}
