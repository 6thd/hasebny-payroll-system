"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-4 border border-white/30">
          <LockKeyhole className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold">مرحباً بعودتك</h2>
        <p className="text-white/70 mt-2">الرجاء إدخال بياناتك لتسجيل الدخول</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <Label htmlFor="login-email" className="block mb-1 font-medium text-sm text-white/80">البريد الإلكتروني</Label>
          <Input 
            type="email" 
            id="login-email" 
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-white placeholder:text-white/50" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="login-password" className="block mb-1 font-medium text-sm text-white/80">كلمة المرور</Label>
          <Input 
            type="password" 
            id="login-password" 
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-white" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition duration-300 shadow-lg" disabled={loading}>
          {loading ? "جارِ تسجيل الدخول..." : "تسجيل الدخول"}
        </Button>
        {error && <p className="text-red-400 text-sm text-center h-4">{error}</p>}
      </form>
      <p className="text-center text-sm text-white/70 mt-6">
        ليس لديك حساب؟ <Link href="/signup" className="font-bold text-blue-400 hover:underline">سجل الآن</Link>
      </p>
    </div>
  );
}
