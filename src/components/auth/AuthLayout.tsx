import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: "url('https://placehold.co/1920x1080/0f172a/334155.png')" }}
      data-ai-hint="dark blue abstract background"
    >
      <div className="glass-card p-8 rounded-2xl shadow-lg max-w-sm w-full text-white">
        {children}
      </div>
    </main>
  );
}
