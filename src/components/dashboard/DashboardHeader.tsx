"use client";

import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AppUser, Worker } from '@/types';
import { MONTHS } from '@/lib/utils';
import { LogOut, Users, CircleDollarSign, BarChart3, ChevronDown, Landmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PayrollModal from './modals/PayrollModal';
import EmployeeManagementModal from './modals/EmployeeManagementModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface DashboardHeaderProps {
  user: AppUser;
  date: { year: number; month: number };
  onDateChange: (newDate: { year: number; month: number }) => void;
  isAdmin: boolean;
  workers: Worker[];
  onDataUpdate: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export default function DashboardHeader({ user, date, onDateChange, isAdmin, workers, onDataUpdate, activeView, setActiveView }: DashboardHeaderProps) {
  const router = useRouter();
  const [isPayrollModalOpen, setPayrollModalOpen] = useState(false);
  const [isEmployeeModalOpen, setEmployeeModalOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + 2 - i);

  return (
    <>
      <header className="no-print bg-card shadow-sm rounded-xl p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-right">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
              {isAdmin ? 'لوحة تحكم المدير' : 'بوابة الموظف'}
            </h1>
            <p className="text-sm text-muted-foreground">{isAdmin ? `نظرة عامة لشهر ${MONTHS[date.month]} ${date.year}` : 'مرحباً بعودتك'}</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center items-center">
             {isAdmin && (
               <div className="flex items-center gap-2">
                 <Button variant={activeView === 'analytics' ? "default" : "outline"} onClick={() => setActiveView('analytics')}>
                    <BarChart3 className="ml-2 h-4 w-4" />
                    لوحة التحكم
                 </Button>
                  <Button variant={activeView === 'attendance' ? "default" : "outline"} onClick={() => setActiveView('attendance')}>
                    <Users className="ml-2 h-4 w-4" />
                    جدول الحضور
                 </Button>
               </div>
            )}
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  إجراءات
                  <ChevronDown className="mr-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => setPayrollModalOpen(true)}>
                      <CircleDollarSign className="ml-2 h-4 w-4" />
                      مسير الرواتب
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEmployeeModalOpen(true)}>
                      <Users className="ml-2 h-4 w-4" />
                      إدارة الموظفين
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => router.push('/settlements')}>
                        <Landmark className="ml-2 h-4 w-4" />
                        مركز تصفية المستحقات
                    </DropdownMenuItem>
                  </>
                )}
                {!isAdmin && (
                   <DropdownMenuItem disabled>لا توجد إجراءات متاحة</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
             <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                {user.name || user.email}
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">تسجيل الخروج</span>
                </Button>
            </div>
          </div>
        </div>
      </header>

      {isPayrollModalOpen &&
        <PayrollModal
          isOpen={isPayrollModalOpen}
          onClose={() => setPayrollModalOpen(false)}
          workers={workers}
          year={date.year}
          month={date.month}
        />
      }

      {isEmployeeModalOpen &&
        <EmployeeManagementModal
          isOpen={isEmployeeModalOpen}
          onClose={() => setEmployeeModalOpen(false)}
          workers={workers}
          onDataUpdate={onDataUpdate}
        />
      }
    </>
  );
}
