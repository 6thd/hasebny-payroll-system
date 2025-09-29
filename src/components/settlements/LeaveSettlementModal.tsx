"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Worker } from '@/types';
import { calculateLeaveBalance, LeaveBalanceOutput } from '@/app/actions/leave-balance';
import { settleLeaveBalance } from '@/app/actions/leave';
import LoadingSpinner from '../LoadingSpinner';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, ShieldCheck, Loader2, HelpCircle, Printer, Download } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';

interface LeaveSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
}

// Define the policy type based on the Zod schema
type LeavePolicy = {
  accrualBasis: 'daily' | 'monthly';
  includeWeekendsInAccrual: boolean;
  excludeUnpaidLeaveFromAccrual: boolean;
  annualEntitlementBefore5Y: number;
  annualEntitlementAfter5Y: number;
};

// Define the default policy values
const DEFAULT_POLICY: LeavePolicy = {
  accrualBasis: 'daily',
  includeWeekendsInAccrual: true,
  excludeUnpaidLeaveFromAccrual: true,
  annualEntitlementBefore5Y: 21,
  annualEntitlementAfter5Y: 30
};

// Define the policy keys and their descriptions
const POLICY_DESCRIPTIONS: Record<keyof LeavePolicy, string> = {
  accrualBasis: "أساس احتساب الاستحقاق (يومي/شهري)",
  includeWeekendsInAccrual: "هل يتم احتساب أيام العطل في الاستحقاق؟",
  excludeUnpaidLeaveFromAccrual: "هل يتم استثناء أيام الإجازة غير المدفوعة من الاستحقاق؟",
  annualEntitlementBefore5Y: "عدد أيام الإجازة السنوية قبل إكمال 5 سنوات خدمة",
  annualEntitlementAfter5Y: "عدد أيام الإجازة السنوية بعد إكمال 5 سنوات خدمة"
};

// Define detailed explanations for each policy
const POLICY_EXPLANATIONS: Record<keyof LeavePolicy, string> = {
  accrualBasis: "يحدد هذا الإعداد ما إذا كان سيتم احتساب رصيد الإجازة بشكل يومي (لكل يوم عمل) أو شهري (لكل شهر عمل).",
  includeWeekendsInAccrual: "عند التفعيل، يتم احتساب أيام العطل (الجمعة والسبت) ضمن أيام الاستحقاق. هذا متوافق مع قوانين العمل السعودية.",
  excludeUnpaidLeaveFromAccrual: "عند التفعيل، لن يتم احتساب أيام الإجازة غير المدفوعة ضمن فترة الاستحقاق، مما يقلل من الرصيد النهائي.",
  annualEntitlementBefore5Y: "عدد الأيام المخصصة سنوياً للموظف قبل إكمال 5 سنوات من الخدمة. وفقاً لنظام العمل السعودي، هذا عادة 21 يوماً.",
  annualEntitlementAfter5Y: "عدد الأيام المخصصة سنوياً للموظف بعد إكمال 5 سنوات من الخدمة. وفقاً لنظام العمل السعودي، هذا عادة 30 يوماً."
};

// Define the policy value labels
const POLICY_VALUE_LABELS: Record<string, Record<string, string>> = {
  accrualBasis: {
    daily: "يومي",
    monthly: "شهري"
  }
};

// Function to check if a policy value differs from the default
const isPolicyCustomized = (key: keyof LeavePolicy, value: any): boolean => {
  return value !== DEFAULT_POLICY[key];
};

const ResultRow = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex justify-between items-center py-2">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
    </div>
);

// New component to display policy settings in an accordion format
const PolicySettingsAccordion = ({ policy }: { policy: LeavePolicy }) => {
  // Determine if any policy is customized
  const hasCustomizedPolicies = (Object.keys(policy) as Array<keyof LeavePolicy>).some(
    key => isPolicyCustomized(key, policy[key])
  );

  return (
    <Accordion type="single" collapsible className="w-full">
      {(Object.keys(policy) as Array<keyof LeavePolicy>).map((key) => {
        const value = policy[key];
        const isCustom = isPolicyCustomized(key, value);
        
        return (
          <AccordionItem value={key} key={key}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center">
                <span className="font-medium">{POLICY_DESCRIPTIONS[key] || key}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="mr-2 h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{POLICY_EXPLANATIONS[key] || POLICY_DESCRIPTIONS[key] || key}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {isCustom ? (
                  <Badge variant="default" className="mr-2 bg-yellow-500 hover:bg-yellow-600">
                    معدل
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="mr-2">
                    افتراضي
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className={`p-4 rounded-lg ${isCustom ? 'bg-yellow-50 border border-yellow-200' : 'bg-muted'}`}>
                {typeof value === 'boolean' ? (
                  <div className="flex items-center">
                    <span className={`font-semibold ${value ? "text-green-600" : "text-red-600"}`}>
                      {value ? 'نعم' : 'لا'}
                    </span>
                    <span className="mx-2">-</span>
                    <span className="text-muted-foreground">{POLICY_EXPLANATIONS[key]}</span>
                  </div>
                ) : typeof value === 'string' ? (
                  <div className="flex items-center">
                    <span className="font-semibold">{POLICY_VALUE_LABELS[key]?.[value] || value}</span>
                    <span className="mx-2">-</span>
                    <span className="text-muted-foreground">{POLICY_EXPLANATIONS[key]}</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="font-semibold">{String(value)} يوم</span>
                    <span className="mx-2">-</span>
                    <span className="text-muted-foreground">{POLICY_EXPLANATIONS[key]}</span>
                  </div>
                )}
                {isCustom && (
                  <div className="mt-2 text-sm text-yellow-700">
                    <strong>ملاحظة:</strong> هذه القيمة تم تعديلها عن القيمة الافتراضية ({String(DEFAULT_POLICY[key])})
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default function LeaveSettlementModal({ isOpen, onClose, worker }: LeaveSettlementModalProps) {
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LeaveBalanceOutput | null>(null);
  const { toast } = useToast();

  const handleCalculate = useCallback(async () => {
    console.log('handleCalculate called');
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Validate worker data before proceeding
      if (!worker || !worker.id) {
        throw new Error('بيانات الموظف غير مكتملة');
      }

      console.log('Starting leave balance calculation for employee:', worker.id);
      console.log('Worker data:', worker);
      
      // Add a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Calling calculateLeaveBalance');
      const result = await calculateLeaveBalance({ employeeId: worker.id });
      console.log('calculateLeaveBalance returned:', result);

      if (result.success) {
        console.log('Leave balance calculation successful:', result.data);
        setResults(result.data);
      } else {
        console.error('Leave balance calculation failed:', result.error);
        setError(result.error);
        toast({
          title: "خطأ في الحساب",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Unexpected error in handleCalculate:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء حساب الرصيد.';
      setError(errorMessage);
      toast({
        title: "خطأ في الحساب",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  }, [worker, toast]);

  // Fix the useEffect to properly handle the calculation
  useEffect(() => {
    console.log('useEffect called with isOpen:', isOpen);
    let isMounted = true;
    
    if (isOpen) {
      console.log('Modal is open, setting up calculation');
      
      // Use a timeout to prevent indefinite loading
      const timeoutId = setTimeout(() => {
        if (isMounted && loading) {
          console.warn('Calculation timeout - resetting loading state');
          setLoading(false);
          setError('انتهت مهلة الحساب. يرجى المحاولة مرة أخرى.');
          toast({
            title: "انتهت المهلة",
            description: "استغرق الحساب وقتاً طويلاً. يرجى المحاولة مرة أخرى.",
            variant: "destructive",
          });
        }
      }, 30000); // 30 second timeout
      
      // Trigger calculation
      console.log('Calling handleCalculate');
      handleCalculate();
      
      // Cleanup function
      return () => {
        console.log('useEffect cleanup');
        isMounted = false;
        clearTimeout(timeoutId);
      };
    }
  }, [isOpen, handleCalculate, loading, toast]);
  
  const handleSettle = async () => {
    if (!results) return;
    setFinalizing(true);
    try {
      const result = await settleLeaveBalance({
          employeeId: worker.id,
          settlementDate: new Date(),
          results: results,
      });
      
      if (result.success) {
        toast({
            title: "تمت التصفية بنجاح",
            description: `تمت تصفية رصيد إجازات الموظف ${worker.name}.`,
        });
        onClose();
      } else {
        toast({
            title: "خطأ في التصفية",
            description: result.error,
            variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error in handleSettle:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء تصفية الرصيد.';
      toast({
        title: "خطأ في التصفية",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setFinalizing(false);
    }
  }

  const handlePrint = () => {
    if (!results) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      // Get the user name from localStorage or use a default
      const userName = typeof window !== 'undefined' ? localStorage.getItem('userName') || 'غير محدد' : 'غير محدد';
      
      // Create the HTML content for printing
      const printContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>تقرير تصفية رصيد الإجازة - ${worker.name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            /* Additional print-specific styles */
            @media print {
              body {
                direction: rtl;
                font-family: 'Cairo', Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background: white;
                color: #333;
                font-size: 12pt;
                line-height: 1.4;
              }
              
              @page {
                margin: 1.5cm;
              }
              
              .print-container {
                max-width: 100%;
                margin: 0 auto;
              }
              
              .print-header {
                text-align: center;
                margin-bottom: 25px;
                padding-bottom: 15px;
                border-bottom: 2px solid #eee;
                page-break-after: avoid;
              }
              
              .print-header h1 {
                font-size: 24pt;
                font-weight: bold;
                color: #333;
                margin: 0 0 8px 0;
              }
              
              .print-header h2 {
                font-size: 16pt;
                font-weight: 600;
                color: #555;
                margin: 0 0 5px 0;
              }
              
              .print-header-info {
                font-size: 11pt;
                color: #666;
                margin-top: 8px;
              }
              
              .employee-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                page-break-inside: avoid;
              }
              
              .employee-info h3 {
                font-size: 14pt;
                font-weight: 600;
                color: #333;
                margin: 0 0 10px 0;
                padding-bottom: 8px;
                border-bottom: 1px solid #ddd;
              }
              
              .employee-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
              }
              
              .employee-detail-item {
                font-size: 11pt;
              }
              
              .employee-detail-label {
                font-weight: 600;
                color: #555;
                display: inline-block;
                min-width: 120px;
              }
              
              .print-summary {
                background: #f0f4ff;
                padding: 20px;
                border-radius: 12px;
                margin: 25px 0;
                text-align: center;
                page-break-inside: avoid;
                border: 1px solid #d0d7ff;
              }
              
              .print-summary-title {
                font-size: 14pt;
                font-weight: 600;
                color: #444;
                margin-bottom: 15px;
              }
              
              .print-balance-days {
                font-size: 32pt;
                font-weight: bold;
                color: #2563eb;
                margin: 10px 0;
              }
              
              .print-balance-value {
                font-size: 18pt;
                font-weight: 600;
                color: #059669;
                margin: 10px 0;
              }
              
              .print-calculation-info {
                font-size: 11pt;
                color: #666;
                margin-top: 15px;
                padding-top: 10px;
                border-top: 1px solid #ddd;
              }
              
              .policy-section {
                background: #fff;
                border-radius: 8px;
                margin: 15px 0;
                border: 1px solid #eee;
                page-break-inside: avoid;
              }
              
              .policy-section-header {
                padding: 12px 15px;
                background: #f8f9fa;
                border-bottom: 1px solid #eee;
                font-weight: 600;
                font-size: 13pt;
                color: #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              
              .policy-item {
                padding: 12px 15px;
                border-bottom: 1px solid #f0f0f0;
              }
              
              .policy-item:last-child {
                border-bottom: none;
              }
              
              .policy-item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
              }
              
              .policy-title {
                font-weight: 600;
                font-size: 12pt;
                color: #444;
              }
              
              .badge-custom, .badge-default {
                font-size: 9pt;
                padding: 3px 10px;
                border-radius: 12px;
                font-weight: 500;
              }
              
              .badge-custom {
                background: #fff8ea;
                color: #d99e36;
                border: 1px solid #f5d8b0;
              }
              
              .badge-default {
                background: #eafaf1;
                color: #39b463;
                border: 1px solid #c5e5d2;
              }
              
              .policy-value {
                font-size: 11pt;
                margin: 5px 0;
              }
              
              .policy-value-boolean {
                font-weight: 600;
              }
              
              .policy-value-boolean.true {
                color: #059669;
              }
              
              .policy-value-boolean.false {
                color: #dc2626;
              }
              
              .policy-description {
                color: #666;
                font-size: 10pt;
                margin-top: 5px;
                line-height: 1.4;
              }
              
              .policy-custom-note {
                background: #fff8ea;
                border-radius: 6px;
                padding: 8px 12px;
                margin-top: 8px;
                font-size: 9.5pt;
                color: #d99e36;
                border: 1px solid #f5d8b0;
              }
              
              .calculation-details {
                margin: 20px 0;
                page-break-inside: avoid;
              }
              
              .calculation-details-header {
                font-size: 13pt;
                font-weight: 600;
                color: #333;
                margin-bottom: 15px;
                padding-bottom: 8px;
                border-bottom: 1px solid #ddd;
              }
              
              .calculation-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                font-size: 11pt;
              }
              
              .calculation-label {
                color: #666;
              }
              
              .calculation-value {
                font-weight: 500;
                color: #333;
              }
              
              .print-notes {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                page-break-inside: avoid;
              }
              
              .print-notes-header {
                font-size: 12pt;
                font-weight: 600;
                color: #333;
                margin-bottom: 15px;
              }
              
              .print-notes-content {
                min-height: 60px;
                border: 1px dashed #ccc;
                border-radius: 6px;
                padding: 15px;
                font-size: 11pt;
                color: #666;
              }
              
              .print-signature {
                margin-top: 40px;
                display: flex;
                justify-content: space-between;
              }
              
              .signature-box {
                width: 45%;
                text-align: center;
              }
              
              .signature-line {
                margin-top: 50px;
                border-top: 1px solid #333;
                padding-top: 10px;
                font-size: 11pt;
                color: #666;
              }
              
              .page-break-before {
                page-break-before: always;
              }
              
              .page-break-after {
                page-break-after: always;
              }
              
              .no-page-break {
                page-break-inside: avoid;
              }
              
              /* Hide all non-essential elements */
              .no-print, 
              .sidebar, 
              .actions-bar, 
              .MuiButton-root, 
              .nav-bar,
              .dialog-overlay,
              .close-button,
              [data-radix-dialog-content],
              .print-hide {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="print-header">
              <h1>حسِبني - نظام الحضور والرواتب</h1>
              <h2>تقرير تصفية رصيد الإجازة</h2>
              <div class="print-header-info">
                تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')} | 
                المستخدم: ${userName}
              </div>
            </div>
            
            <div class="employee-info">
              <h3>معلومات الموظف</h3>
              <div class="employee-details">
                <div class="employee-detail-item">
                  <span class="employee-detail-label">الاسم:</span> ${worker.name}
                </div>
                <div class="employee-detail-item">
                  <span class="employee-detail-label">الرقم الوظيفي:</span> ${worker.employeeId || 'غير محدد'}
                </div>
                <div class="employee-detail-item">
                  <span class="employee-detail-label">القسم:</span> ${worker.department || 'غير محدد'}
                </div>
                <div class="employee-detail-item">
                  <span class="employee-detail-label">تاريخ التعيين:</span> ${worker.hireDate || 'غير محدد'}
                </div>
              </div>
            </div>
            
            <div class="print-summary">
              <div class="print-summary-title">ملخص رصيد الإجازة</div>
              <div class="print-balance-days">${results.accruedDays} يوم</div>
              <div class="print-balance-value">
                ~ ${results.monetaryValue.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}
              </div>
              <div class="print-calculation-info">
                <p>تم احتساب هذا الرصيد بناءً على:</p>
                <p>سنوات الخدمة: ${results.calculationBasis.serviceYears} سنة | الأيام المحسوبة: ${results.calculationBasis.daysCounted} يوم</p>
                <p>فترة الاحتساب: من ${results.calculationBasis.periodStartDate} إلى ${results.calculationBasis.periodEndDate}</p>
              </div>
            </div>
            
            <div class="policy-section">
              <div class="policy-section-header">
                <span>السياسات المطبقة في الحساب</span>
                ${(Object.keys(results.calculationBasis.policy) as Array<keyof LeavePolicy>).some(
                  key => isPolicyCustomized(key, results.calculationBasis.policy[key])
                ) ? (
                  '<span class="badge-custom">تحتوي على تعديلات</span>'
                ) : (
                  '<span class="badge-default">افتراضية</span>'
                )}
              </div>
              ${(Object.keys(results.calculationBasis.policy) as Array<keyof LeavePolicy>).map((key) => {
                const value = results.calculationBasis.policy[key];
                const isCustom = isPolicyCustomized(key, value);
                
                return `
                  <div class="policy-item">
                    <div class="policy-item-header">
                      <span class="policy-title">${POLICY_DESCRIPTIONS[key] || key}</span>
                      ${isCustom ? 
                        '<span class="badge-custom">معدل</span>' : 
                        '<span class="badge-default">افتراضي</span>'}
                    </div>
                    <div class="policy-value">
                      ${typeof value === 'boolean' ? 
                        `<span class="policy-value-boolean ${value ? 'true' : 'false'}">
                          ${value ? 'نعم' : 'لا'}
                        </span>` : 
                        typeof value === 'string' ? 
                          `<span>${POLICY_VALUE_LABELS[key]?.[value] || value}</span>` : 
                          `<span>${String(value)} يوم</span>`}
                    </div>
                    <div class="policy-description">
                      ${POLICY_EXPLANATIONS[key] || POLICY_DESCRIPTIONS[key] || key}
                    </div>
                    ${isCustom ? 
                      `<div class="policy-custom-note">
                        <strong>ملاحظة:</strong> هذه القيمة تم تعديلها عن القيمة الافتراضية (${String(DEFAULT_POLICY[key])})
                      </div>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
            
            <div class="calculation-details">
              <div class="calculation-details-header">تفاصيل الاحتساب</div>
              <div class="calculation-item">
                <span class="calculation-label">سنوات الخدمة</span>
                <span class="calculation-value">${results.calculationBasis.serviceYears}</span>
              </div>
              <div class="calculation-item">
                <span class="calculation-label">الاستحقاق السنوي الحالي</span>
                <span class="calculation-value">${results.calculationBasis.annualEntitlement} يوم</span>
              </div>
              <div class="calculation-item">
                <span class="calculation-label">تاريخ بداية الفترة</span>
                <span class="calculation-value">${results.calculationBasis.periodStartDate}</span>
              </div>
              <div class="calculation-item">
                <span class="calculation-label">تاريخ نهاية الفترة</span>
                <span class="calculation-value">${results.calculationBasis.periodEndDate}</span>
              </div>
              <div class="calculation-item">
                <span class="calculation-label">الأيام المحسوبة في الفترة</span>
                <span class="calculation-value">${results.calculationBasis.daysCounted} يوم</span>
              </div>
            </div>
            
            <div class="print-notes">
              <div class="print-notes-header">ملاحظات إضافية</div>
              <div class="print-notes-content">
                <!-- This space is for manual notes -->
              </div>
            </div>
            
            <div class="print-signature">
              <div class="signature-box">
                <div class="signature-line">توقيع مسؤول الموارد البشرية</div>
              </div>
              <div class="signature-box">
                <div class="signature-line">توقيع الموظف</div>
              </div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              // Close the window after printing (optional)
              // window.close();
            };
          </script>
        </body>
        </html>
      `;
      
      // Write the content to the new window
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  const resetAndClose = () => {
    setResults(null);
    setError(null);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>تصفية رصيد الإجازة لـِ {worker.name}</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={!results}>
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => console.log("Export to PDF")} disabled={!results}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4 space-y-6 min-h-[300px]">
            {loading && (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <LoadingSpinner />
                <p className="mt-4 text-muted-foreground">...جاري حساب رصيد الإجازة</p>
                <p className="text-sm text-muted-foreground mt-2">قد يستغرق هذا بعض الوقت حسب كمية البيانات</p>
              </div>
            )}
            
            {error && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>خطأ في الحساب</AlertTitle>
                <AlertDescription className="text-right">
                  {error}
                  <div className="mt-4 flex justify-center">
                    <Button variant="outline" onClick={handleCalculate} disabled={loading}>
                      {loading ? '...جاري المحاولة' : 'إعادة المحاولة'}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {!loading && !error && results && (
                <div className="space-y-6">
                    {/* Summary Card */}
                    <Card className="shadow-lg border-primary/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-center">ملخص رصيد الإجازة</CardTitle>
                        <CardDescription className="text-center">الحساب النهائي للموظف</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="p-6 rounded-lg bg-primary/10 text-center">
                          <p className="text-sm text-primary font-semibold">رصيد الأيام المتراكمة</p>
                          <p className="text-4xl font-bold text-primary my-2">{results.accruedDays} يوم</p>
                          <p className="text-lg text-primary/80">~ {results.monetaryValue.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</p>
                          <div className="mt-4 text-sm text-muted-foreground">
                            <p>تم احتساب هذا الرصيد بناءً على:</p>
                            <p className="mt-1">سنوات الخدمة: {results.calculationBasis.serviceYears} سنة</p>
                            <p>الأيام المحسوبة: {results.calculationBasis.daysCounted} يوم</p>
                            <p className="mt-2 text-xs">حسب سياسة الشركة الحالية</p>
                          </div>
                        </div>
                        
                        {/* Detailed explanation */}
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                          <h4 className="font-semibold mb-2 flex items-center">
                            <HelpCircle className="h-4 w-4 ml-2" />
                            تفاصيل الحساب
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            تم احتساب الرصيد بناءً على فترة من {results.calculationBasis.periodStartDate} إلى {results.calculationBasis.periodEndDate} 
                            (عدد الأيام: {results.calculationBasis.daysCounted})، مع تطبيق السياسة المحددة والتي تحدد الاستحقاق السنوي 
                            بـ {results.calculationBasis.annualEntitlement} يوم لكل سنة خدمة.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Separator />

                    {/* Calculation Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle>تفاصيل الحساب</CardTitle>
                        <CardDescription>البيانات المستخدمة في احتساب الرصيد</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ResultRow label="سنوات الخدمة" value={results.calculationBasis.serviceYears} />
                        <ResultRow label="الاستحقاق السنوي الحالي" value={`${results.calculationBasis.annualEntitlement} يوم`} />
                        <ResultRow label="تاريخ بداية الفترة" value={results.calculationBasis.periodStartDate} />
                        <ResultRow label="تاريخ نهاية الفترة" value={results.calculationBasis.periodEndDate} />
                        <ResultRow label="الأيام المحسوبة في الفترة" value={`${results.calculationBasis.daysCounted} يوم`} />
                      </CardContent>
                    </Card>

                    {/* Policy Settings */}
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle>السياسة المطبقة</CardTitle>
                            <CardDescription>الإعدادات المستخدمة في حساب رصيد الإجازة</CardDescription>
                          </div>
                          {/* Check if any policy is customized */}
                          {(Object.keys(results.calculationBasis.policy) as Array<keyof LeavePolicy>).some(
                            key => isPolicyCustomized(key, results.calculationBasis.policy[key])
                          ) ? (
                            <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                              تحتوي على تعديلات
                            </Badge>
                          ) : (
                            <Badge variant="outline">افتراضية</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <PolicySettingsAccordion policy={results.calculationBasis.policy} />
                      </CardContent>
                    </Card>
                </div>
            )}
            
            {!loading && !error && !results && (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <p className="text-muted-foreground">لم يتم العثور على نتائج للحساب</p>
                <div className="mt-4 flex justify-center">
                  <Button onClick={handleCalculate}>بدء الحساب</Button>
                </div>
              </div>
            )}
        </div>

        <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="secondary" onClick={handleCalculate} disabled={loading || finalizing}>
                {loading ? '...جاري الحساب' : 'إعادة الحساب'}
            </Button>
            {results && (
                 <Button variant="default" onClick={handleSettle} disabled={finalizing || loading}>
                    {finalizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    {finalizing ? "جارٍ الحفظ..." : "تأكيد وتصفية الرصيد"}
                </Button>
            )}
            <Button type="button" variant="outline" onClick={resetAndClose} disabled={finalizing}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}