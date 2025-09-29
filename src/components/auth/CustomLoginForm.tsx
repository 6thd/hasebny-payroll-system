"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import "./CustomLogin.css";

export default function CustomLoginForm() {
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
    <div className="login-bg">
      <div className="login-card" dir="rtl">
        <img src="/logo.svg" alt="شعار النظام" className="logo" />
        <h2>مرحباً بعودتك 👋</h2>
        <p className="subtitle">الرجاء إدخال بياناتك لتسجيل الدخول</p>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <span className="icon">📧</span>
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="input-group">
            <span className="icon">🔒</span>
            <input
              type="password"
              placeholder="كلمة المرور"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "جارِ تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
        <div className="signup-msg">
          ليس لديك حساب؟ <Link href="/signup">سجل الآن</Link>
        </div>
      </div>
    </div>
  );
}