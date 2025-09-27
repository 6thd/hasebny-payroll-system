"use client";

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Calendar, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  UserCheck,
  Bell
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Worker } from '@/types';

interface AlertItem {
  id: string;
  type: 'contract_expiry' | 'absence_limit' | 'performance_review' | 'payroll_error';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  employeeId?: string;
  employeeName?: string;
  date?: Date;
  action?: () => void;
}

interface AlertsManagerProps {
  workers: Worker[];
  isAdmin: boolean;
}

export default function AlertsManager({ workers, isAdmin }: AlertsManagerProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [expanded, setExpanded] = useState(false);

  // Check for various alert conditions
  useEffect(() => {
    if (!isAdmin) return;
    
    const newAlerts: AlertItem[] = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Check contract expiries (within 30 days)
    workers.forEach(worker => {
      // Check for contract end date (terminationDate) or if there's a contract end field
      if (worker.terminationDate) {
        const terminationDate = new Date(worker.terminationDate);
        const daysUntilTermination = Math.ceil(
          (terminationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysUntilTermination > 0 && daysUntilTermination <= 30) {
          newAlerts.push({
            id: `contract-${worker.id}`,
            type: 'contract_expiry',
            severity: daysUntilTermination <= 7 ? 'high' : daysUntilTermination <= 15 ? 'medium' : 'low',
            title: 'انتهاء عقد الموظف قريباً',
            description: `عقد الموظف ${worker.name} سينتهي خلال ${daysUntilTermination} أيام`,
            employeeId: worker.id,
            employeeName: worker.name,
            date: terminationDate
          });
        }
      }
    });
    
    // Check absence limits (more than 5 absences in the current month)
    workers.forEach(worker => {
      if (worker.absentDays && worker.absentDays > 5) {
        const severity = worker.absentDays > 10 ? 'high' : worker.absentDays > 7 ? 'medium' : 'low';
        newAlerts.push({
          id: `absence-${worker.id}-${currentYear}-${currentMonth}`,
          type: 'absence_limit',
          severity,
          title: 'تجاوز حد الغياب المسموح',
          description: `الموظف ${worker.name} غائب ${worker.absentDays} أيام هذا الشهر`,
          employeeId: worker.id,
          employeeName: worker.name
        });
      }
    });
    
    // Check for upcoming performance reviews (hire date anniversary)
    workers.forEach(worker => {
      if (worker.hireDate) {
        const hireDate = new Date(worker.hireDate);
        const nextReview = new Date(today.getFullYear(), hireDate.getMonth(), hireDate.getDate());
        
        // If the review date has passed this year, set it for next year
        if (nextReview < today) {
          nextReview.setFullYear(nextReview.getFullYear() + 1);
        }
        
        const daysUntilReview = Math.ceil(
          (nextReview.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysUntilReview <= 30 && daysUntilReview >= 0) {
          newAlerts.push({
            id: `review-${worker.id}`,
            type: 'performance_review',
            severity: daysUntilReview <= 7 ? 'high' : daysUntilReview <= 15 ? 'medium' : 'low',
            title: 'اقتراب موعد المراجعة السنوية',
            description: `مراجعة أداء الموظف ${worker.name} خلال ${daysUntilReview} أيام`,
            employeeId: worker.id,
            employeeName: worker.name,
            date: nextReview
          });
        }
      }
    });
    
    // Check for potential payroll errors (more comprehensive checks)
    workers.forEach(worker => {
      let hasPotentialPayrollError = false;
      let errorDescription = '';
      
      // Check for negative basic salary
      if (worker.basicSalary < 0) {
        hasPotentialPayrollError = true;
        errorDescription = `قيمة الراتب الأساسية للموظف ${worker.name} سالبة`;
      }
      // Check for negative allowances
      else if (worker.housing < 0 || worker.workNature < 0 || worker.transport < 0 || 
               worker.phone < 0 || worker.food < 0) {
        hasPotentialPayrollError = true;
        errorDescription = `قيمة إحدى البدلات للموظف ${worker.name} سالبة`;
      }
      // Check for missing required data
      else if (!worker.name || !worker.basicSalary) {
        hasPotentialPayrollError = true;
        errorDescription = `بيانات الموظف ${worker.name || 'غير محدد'} غير مكتملة`;
      }
      
      if (hasPotentialPayrollError) {
        newAlerts.push({
          id: `payroll-${worker.id}`,
          type: 'payroll_error',
          severity: 'high',
          title: 'خطأ محتمل في حساب الراتب',
          description: errorDescription,
          employeeId: worker.id,
          employeeName: worker.name
        });
      }
    });
    
    setAlerts(newAlerts);
  }, [workers, isAdmin]);
  
  if (!isAdmin || alerts.length === 0) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'contract_expiry': return <Calendar className="h-4 w-4" />;
      case 'absence_limit': return <AlertTriangle className="h-4 w-4" />;
      case 'performance_review': return <UserCheck className="h-4 w-4" />;
      case 'payroll_error': return <DollarSign className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="mb-6">
      <div className="bg-card border rounded-lg shadow-sm">
        <div 
          className="flex justify-between items-center p-4 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">تنبيهات النظام</h3>
            <Badge variant="destructive">{alerts.length}</Badge>
          </div>
          <Button variant="ghost" size="sm">
            {expanded ? 'طي' : 'عرض الكل'}
          </Button>
        </div>
        
        {expanded && (
          <div className="border-t p-4 space-y-3 max-h-96 overflow-y-auto">
            {alerts.map(alert => (
              <Alert 
                key={alert.id} 
                className={`${getSeverityColor(alert.severity)} border-l-4 p-3`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{alert.title}</h4>
                      <Badge 
                        variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {alert.severity === 'high' ? 'عالي' : alert.severity === 'medium' ? 'متوسط' : 'منخفض'}
                      </Badge>
                    </div>
                    <AlertDescription className="text-sm">
                      {alert.description}
                      {alert.date && (
                        <span className="block mt-1 text-xs opacity-75">
                          التاريخ: {format(alert.date, 'PPP', { locale: ar })}
                        </span>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
            
            {alerts.length === 0 && (
              <p className="text-center text-muted-foreground py-4">لا توجد تنبيهات حالياً</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}