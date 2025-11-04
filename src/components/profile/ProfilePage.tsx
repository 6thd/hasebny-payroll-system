
"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileForm } from "./ProfileForm";
import ChangePasswordForm from "./ChangePasswordForm";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/app/actions/user-actions";
import { AppUser } from "@/types";

export function ProfilePage() {
  const { data: session, status } = useSession();

  const { data: userData, isLoading: isUserLoading } = useQuery({
      queryKey: ['userProfile', session?.user?.id],
      queryFn: async () => {
        if (!session?.user?.id) return null;
        const { profile, error } = await getUserProfile(session.user.id);
        if (error) {
            throw new Error(error);
        }
        return profile;
      },
      enabled: status === 'authenticated' && !!session?.user?.id,
  });

  const user = userData as AppUser | undefined;

  const getInitials = (name: string | undefined | null) => {
      if (!name) return "U";
      return name.split(' ').map(n => n[0]).join('');
  };

  if (status === "loading" || (status === "authenticated" && isUserLoading)) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <Skeleton className="h-10 w-32" />
             </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <p>الرجاء تسجيل الدخول لعرض هذه الصفحة.</p>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
            <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={session?.user?.image || undefined} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-2xl">{user.name || 'مستخدم غير معروف'}</CardTitle>
                    <CardDescription>{user.jobTitle || user.email || 'لا يوجد مسمى وظيفي'}</CardDescription>
                </div>
            </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>الملف الشخصي</CardTitle>
              <CardDescription>قم بتحديث معلوماتك الشخصية.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={user} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تغيير كلمة المرور</CardTitle>
              <CardDescription>من الأفضل استخدام كلمة مرور قوية لم تستخدمها من قبل.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
