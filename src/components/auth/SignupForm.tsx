"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

      const newDocId = Date.now().toString(); 
      const newEmployeeData = {
        id: newDocId,
        authUid: user.uid,
        name: name,
        email: email,
        role: 'employee',
        employeeId: `EMP${newDocId.slice(-4)}`,
        jobTitle: '',
        department: '',
        hireDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        basicSalary: 0, housing: 0, workNature: 0, transport: 0, phone: 0, food: 0, commission: 0, advances: 0, penalties: 0,
      };

      await setDoc(doc(db, 'employees', newDocId), newEmployeeData);

      router.push("/");
    } catch (err: any) {
      let errorMessage = "حدث خطأ أثناء إنشاء الحساب.";
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = "هذا البريد الإلكتروني مسجل بالفعل.";
      }
      setError(errorMessage);
      toast.error("خطأ في إنشاء الحساب", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 border rounded-xl shadow-sm bg-card text-card-foreground">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">إنشاء حساب جديد</h2>
        <p className="text-muted-foreground mt-2">أدخل بياناتك للانضمام إلينا</p>
      </div>
      <form onSubmit={handleSignup} className="space-y-6">
        <div>
          <Label htmlFor="signup-name" className="block mb-2 font-medium text-sm">الاسم الكامل</Label>
          <Input 
            type="text" 
            id="signup-name" 
            className="w-full p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" 
            required
            placeholder="مثال: خالد الأحمد"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="signup-email" className="block mb-2 font-medium text-sm">البريد الإلكتروني</Label>
          <Input 
            type="email" 
            id="signup-email" 
            className="w-full p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" 
            required 
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="signup-password" className="block mb-2 font-medium text-sm">كلمة المرور</Label>
          <Input 
            type="password" 
            id="signup-password" 
            className="w-full p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" 
            required
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full bg-primary text-primary-foreground p-3 rounded-lg font-bold hover:bg-primary/90 transition duration-300 shadow-lg" disabled={loading}>
          {loading ? "جارِ إنشاء الحساب..." : "إنشاء حساب"}
        </Button>
        {error && <p className="text-destructive text-sm text-center h-4">{error}</p>}
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        لديك حساب بالفعل؟ <Link href="/login" className="font-bold text-primary hover:underline">سجل الدخول</Link>
      </p>
    </div>
  );
}