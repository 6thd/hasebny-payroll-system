"use client";

import React, { useState } from "react";
import { uploadDocument } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DocumentUploaderProps {
  employeeId: string;
}

export default function DocumentUploader({ employeeId }: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setSuccess(null);
    setError(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("يرجى اختيار ملف.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadDocument(employeeId, formData);

      if (result.success) {
        setSuccess("تم رفع المستند بنجاح ✅");
        // Reset the file input visually by resetting the component's state
        setFile(null);
        // And resetting the form element itself
        const form = e.target as HTMLFormElement;
        form.reset();
      } else {
        setError(result.error || "حدث خطأ أثناء رفع المستند.");
      }
    } catch (err: any) {
      setError("فشل الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800"
      onSubmit={handleUpload}
    >
      <div className="w-full">
        <label htmlFor="file-upload" className="block mb-2 font-semibold text-sm text-gray-700 dark:text-gray-300">اختيار ملف المستند:</label>
        <Input
          id="file-upload"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          onChange={handleFileChange}
        />
        <p className="text-xs text-gray-500 mt-1">.pdf, .jpg, .png, .docx :الصيغ المسموح بها</p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !file}
      >
        {loading ? "جاري الرفع..." : "رفع المستند"}
      </Button>

      {success && (
        <div className="text-green-700 bg-green-100 rounded-lg px-4 py-2 w-full text-center text-sm">{success}</div>
      )}
      {error && (
        <div className="text-red-700 bg-red-100 rounded-lg px-4 py-2 w-full text-center text-sm">{error}</div>
      )}
    </form>
  );
}
