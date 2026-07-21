"use client";
import React, { useState, useRef } from 'react';
import { FileText, UploadCloud, CheckCircle2, FileCheck } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface ComplianceDocsProps {
  onComplete: () => void;
}

export default function ComplianceDocs({ onComplete }: ComplianceDocsProps) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const fileName = e.target.files[0].name;
      setTimeout(() => {
        setUploadedDocs(prev => [...prev, fileName]);
        setIsUploading(false);
      }, 1000);
    }
  };

  const hasRequiredDocs = uploadedDocs.length > 0;

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-border px-6 py-5 bg-neutral-50/50 flex items-center gap-3">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">{t('logistics.complianceDocs') || 'Compliance & Shipping Documents'}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('logistics.complianceDocsDesc') || 'Upload required customs, packing lists, and commercial invoices.'}</p>
        </div>
      </div>
      
      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="flex flex-col">
            <div 
              className="flex-1 border-2 border-dashed border-border rounded-xl bg-neutral-50 dark:bg-card hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors flex flex-col items-center justify-center p-8 text-center cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleSimulateUpload}
                accept=".pdf,.doc,.docx,.jpg,.png"
              />
              <div className="h-12 w-12 bg-card rounded-full flex items-center justify-center shadow-sm border border-border mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="h-6 w-6 text-indigo-500" />
              </div>
              <h3 className="text-sm font-semibold text-card-foreground mb-1">{t('orderInitiation.orderForm.dragDrop') || 'Click to upload documents'}</h3>
              <p className="text-xs text-muted-foreground">{t('orderInitiation.orderForm.maxSize') || 'Supports PDF, DOCX, JPG (Max 5MB)'}</p>
              
              {isUploading && (
                <div className="mt-4 flex items-center gap-2 text-sm text-indigo-600 font-medium">
                  <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                  {t('logistics.verifying') || 'Uploading...'}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-card-foreground mb-4">{t('logistics.uploadedDocs') || 'Uploaded Documents'}</h3>
            <div className="flex-1 bg-card border border-border rounded-xl p-4 overflow-y-auto max-h-[250px] space-y-3">
              {uploadedDocs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 py-8">
                  <FileText className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">{t('logistics.noDocs') || 'No documents uploaded yet'}</p>
                </div>
              ) : (
                uploadedDocs.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-card border border-neutral-100 dark:border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileCheck className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate max-w-[200px]">{doc}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">{t('orderInitiation.header.saveOrder') || 'Verified'}</span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => onComplete()}
              disabled={!hasRequiredDocs}
              className="w-full mt-6 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-4 w-4" />
              {t('logistics.confirmDocs') || 'Confirm Documents & Proceed'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
