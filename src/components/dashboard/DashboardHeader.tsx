"use client";

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AppUser } from '@/types';
import { MONTHS } from '@/lib/utils';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DashboardHeaderProps {
  user: AppUser;
  date: { year: number; month: number };
  onDateChange: (newDate: { year: number; month: number }) => void;
  isAdmin: boolean;
}

export default function DashboardHeader({ user, date, onDateChange, isAdmin }: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + 2 - i);

  return (
    <header className="mb-8 no-print">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-right">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-700">
            {isAdmin ? 'نظام الحضور والرواتب' : 'بوابة الموظف'}
          </h1>
          {isAdmin && (
            <div className="flex items-center gap-2 justify-center sm:justify-start mt-2">
              <Select
                value={String(date.month)}
                onValueChange={(value) => onDateChange({ ...date, month: Number(value) })}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="الشهر" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(date.year)}
                onValueChange={(value) => onDateChange({ ...date, year: Number(value) })}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="السنة" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 justify-center items-center">
          <div className="text-sm font-semibold text-gray-600 bg-gray-200 px-3 py-1 rounded-full">
            مرحباً, {user.name || user.email}
          </div>
          <Button onClick={handleLogout} variant="destructive" size="sm">
            <LogOut className="ml-2 h-4 w-4" />
            خروج
          </Button>
        </div>
      </div>
    </header>
  );
}
