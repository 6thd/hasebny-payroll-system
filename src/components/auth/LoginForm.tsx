"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      toast.error("خطأ في تسجيل الدخول", {
        description: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 border rounded-xl shadow-sm bg-card text-card-foreground">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">مرحباً بعودتك</h2>
        <p className="text-muted-foreground mt-2">الرجاء إدخال بياناتك لتسجيل الدخول</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <Label htmlFor="login-email" className="block mb-2 font-medium text-sm">البريد الإلكتروني</Label>
          <Input 
            type="email" 
            id="login-email" 
            className="w-full p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" 
            required 
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="login-password" className="block mb-2 font-medium text-sm">كلمة المرور</Label>
          <Input 
            type="password" 
            id="login-password" 
            className="w-full p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" 
            required
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full p-3 rounded-lg font-bold transition duration-300 shadow-lg" disabled={loading}>
          {loading ? "جارِ تسجيل الدخول..." : "تسجيل الدخول"}
        </Button>
        {error && <p className="text-destructive text-sm text-center h-4">{error}</p>}
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        ليس لديك حساب؟ <Link href="/signup" className="font-bold text-primary hover:underline">سجل الآن</Link>
      </p>
    </div>
  );
}