"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const newEmployeeData = {
        authUid: user.uid,
        name: name,
        email: email,
        role: 'employee',
        basicSalary: 0, housing: 0, workNature: 0, transport: 0, phone: 0, food: 0, commission: 0, advances: 0, penalties: 0,
      };

      const newDocId = Date.now().toString(); 
      await setDoc(doc(db, 'employees', newDocId), newEmployeeData);

      router.push("/");
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError("هذا البريد الإلكتروني مسجل بالفعل.");
      } else {
        setError("حدث خطأ أثناء إنشاء الحساب.");
      }
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">إنشاء حساب جديد</h2>
        <p className="text-white/70 mt-2">أدخل بياناتك للانضمام إلينا</p>
      </div>
      <form onSubmit={handleSignup} className="space-y-6">
        <div>
          <Label htmlFor="signup-name" className="block mb-1 font-medium text-sm text-white/80">الاسم الكامل</Label>
          <Input 
            type="text" 
            id="signup-name" 
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-white" 
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="signup-email" className="block mb-1 font-medium text-sm text-white/80">البريد الإلكتروني</Label>
          <Input 
            type="email" 
            id="signup-email" 
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-white" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="signup-password" className="block mb-1 font-medium text-sm text-white/80">كلمة المرور</Label>
          <Input 
            type="password" 
            id="signup-password" 
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-white" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 transition duration-300 shadow-lg" disabled={loading}>
          {loading ? "جارِ إنشاء الحساب..." : "إنشاء حساب"}
        </Button>
        {error && <p className="text-red-400 text-sm text-center h-4">{error}</p>}
      </form>
      <p className="text-center text-sm text-white/70 mt-6">
        لديك حساب بالفعل؟ <Link href="/login" className="font-bold text-blue-400 hover:underline">سجل الدخول</Link>
      </p>
    </div>
  );
}
