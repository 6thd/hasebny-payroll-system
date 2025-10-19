import type { ReactNode } from "react";
import { Briefcase } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main 
      className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background"
    >
      <div className="hidden md:flex flex-col items-center justify-center p-12 bg-primary/5 border-l border-primary/10">
        <Briefcase className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold text-foreground">نظام حاسبني</h1>
        <p className="text-muted-foreground mt-2 text-center max-w-sm">
          مرحباً بك في نظام الرواتب المتكامل. أدخل بياناتك للوصول إلى لوحة التحكم الخاصة بك.
        </p>
      </div>
      <div className="flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {children}
        </div>
      </div>
    </main>
  );
}