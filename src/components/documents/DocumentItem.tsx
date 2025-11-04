
"use client";

import React, { useState } from 'react';
import { DocumentData } from '@/types';
import { getDocumentDownloadUrl, deleteDocument } from '@/app/actions/documents';
import { Button } from '@/components/ui/button';
import { Download, FileText, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Timestamp } from 'firebase/firestore';

const getJsDate = (date: string | Date | Timestamp): Date => {
    if (typeof date === 'string') {
        return new Date(date);
    }
    if (date instanceof Timestamp) {
        return date.toDate();
    }
    return date;
};

interface DocumentItemProps {
  doc: DocumentData;
  isAdmin?: boolean;
  employeeId: string;
}

export default function DocumentItem({ doc, isAdmin, employeeId }: DocumentItemProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsDownloading(true);
    const result = await getDocumentDownloadUrl(doc.storagePath);
    setIsDownloading(false);

    if (result.success && result.url) {
      window.open(result.url, '_blank');
    } else {
      toast({
        title: "خطأ في تحميل الملف",
        description: result.error || 'فشل تحميل الملف.',
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا المستند؟ هذا الإجراء لا يمكن التراجع عنه.")) {
      return;
    }
    
    setIsDeleting(true);
    const result = await deleteDocument(employeeId, doc.id, doc.storagePath);
    setIsDeleting(false);

    if (result.success) {
        toast({
            title: "تم الحذف بنجاح",
            description: `تم حذف ملف \"${doc.fileName}\".`,
            variant: 'default',
        });
    } else {
        toast({
            title: "خطأ في حذف المستند",
            description: result.error || 'فشل حذف المستند.',
            variant: "destructive",
        });
    }
  };

  const issueDateStr = doc.issueDate ? getJsDate(doc.issueDate).toLocaleDateString('ar-EG') : 'غير محدد';
  const expiryDateStr = doc.expiryDate ? getJsDate(doc.expiryDate).toLocaleDateString('ar-EG') : 'لا ينتهي';

  return (
    <div className="p-3 border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-gray-800 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-3 min-w-0">
        <FileText className="w-6 h-6 text-gray-500 flex-shrink-0" />
        <div className="flex-grow min-w-0">
          <p className="font-semibold text-gray-800 dark:text-gray-100 truncate" title={doc.fileName}>{doc.fileName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            تاريخ الإصدار: {issueDateStr} • تاريخ الانتهاء: {expiryDateStr}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading || isDeleting}
          aria-label="Download document"
        >
          {isDownloading ? (
            <><Loader2 className="ml-2 h-4 w-4 animate-spin" /><span>جار التحميل...</span></>
          ) : (
            <><Download className="w-4 h-4 ml-2" /><span>تحميل</span></>
          )}
        </Button>
        {isAdmin && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDownloading || isDeleting}
            aria-label="Delete document"
          >
             {isDeleting ? (
                <><Loader2 className="ml-2 h-4 w-4 animate-spin" /><span>جار الحذف...</span></>
             ) : (
                <><Trash2 className="w-4 h-4 ml-2" /><span>حذف</span></>
             )}
          </Button>
        )}
      </div>
    </div>
  );
}
