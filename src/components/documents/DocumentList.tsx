
"use client";

import React from 'react';
import { useEmployeeDocuments } from '@/hooks/use-employee-documents';
import DocumentItem from './DocumentItem';
import LoadingSpinner from '@/components/LoadingSpinner';
import { DocumentData } from '@/types'; // Import the missing type

interface DocumentListProps {
  employeeId: string;
  isAdmin?: boolean;
}

export default function DocumentList({ employeeId, isAdmin }: DocumentListProps) {
  const { documents, loading } = useEmployeeDocuments(employeeId);

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <h4 className="font-semibold mb-4 text-gray-800 dark:text-gray-100">قائمة المستندات</h4>

      {loading ? (
        <div className="text-center py-10">
            <LoadingSpinner/>
            <p className="text-muted-foreground mt-2">جاري تحميل المستندات...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">لا توجد مستندات مرفقة لهذا الموظف حتى الآن.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Explicitly type the 'doc' parameter */}
          {documents.map((doc: DocumentData) => (
            <DocumentItem key={doc.id} doc={doc} isAdmin={isAdmin} employeeId={employeeId} />
          ))}
        </div>
      )}
    </div>
  );
}
