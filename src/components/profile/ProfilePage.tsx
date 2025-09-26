"use client";

import { useAuth } from "@/hooks/use-auth";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowRight, User } from "lucide-react";
import EmployeeLeaveHistory from "@/components/dashboard/EmployeeLeaveHistory";
import ProfileForm from "./ProfileForm";
import { useCallback } from "react";

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const handleDataUpdate = useCallback(() => {
        // This is a dummy handler for now, can be used to trigger data refetch
        // if we decide to lift state up or use a more complex state management.
        // For now, server action revalidation handles it.
    }, []);

    if (loading || !user) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    <User />
                                    بوابة الخدمة الذاتية للموظف
                                </CardTitle>
                                <CardDescription>
                                    أدِر معلوماتك الشخصية وسجلك الوظيفي من هنا.
                                </CardDescription>
                            </div>
                            <Button onClick={() => router.push('/')}>
                                <ArrowRight className="ml-2 h-4 w-4" />
                                العودة للوحة التحكم
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <ProfileForm user={user} />
                    </div>
                    <div className="lg:col-span-2">
                         <EmployeeLeaveHistory employeeId={user.id} />
                    </div>
                </div>

                {/* Placeholder for future components */}
                {/* <Card>
                    <CardHeader>
                        <CardTitle>مستنداتي</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">قريباً: رفع وإدارة المستندات.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>السلف والعهد</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">قريباً: عرض حالة السلف والعهد المالية.</p>
                    </CardContent>
                </Card> */}
            </div>
        </div>
    );
}
